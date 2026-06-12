"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { metaEmbeddedService, type MetaEmbeddedConfig } from "@/features/devices/services/meta-embedded.service";

type EmbeddedSignupResult = {
  code: string;
  wabaId: string;
  phoneNumberId?: string;
};

type FacebookLoginResponse = {
  authResponse?: {
    code?: string;
  };
};

type FacebookSDK = {
  init: (params: Record<string, unknown>) => void;
  login: (callback: (response: FacebookLoginResponse) => void, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
  }
}

function loadFacebookSDK(appId: string, apiVersion: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: apiVersion,
      });
      resolve();
    };

    const existing = document.getElementById("facebook-jssdk");
    if (existing && window.FB) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.defer = true;
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.onerror = () => reject(new Error("Failed to load Facebook SDK"));
    document.body.appendChild(script);
  });
}

export function useMetaEmbeddedSignup() {
  const [config, setConfig] = useState<MetaEmbeddedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  useEffect(() => {
    metaEmbeddedService
      .getConfig()
      .then(setConfig)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load Meta config"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") {
        return;
      }
      try {
        const data = JSON.parse(event.data as string) as {
          type?: string;
          event?: string;
          data?: { waba_id?: string; phone_number_id?: string };
        };
        if (data.type !== "WA_EMBEDDED_SIGNUP") {
          return;
        }
        if (data.data?.waba_id) {
          sessionRef.current.wabaId = data.data.waba_id;
        }
        if (data.data?.phone_number_id) {
          sessionRef.current.phoneNumberId = data.data.phone_number_id;
        }
      } catch {
        // ignore non-JSON messages
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const launch = useCallback(async (): Promise<EmbeddedSignupResult> => {
    if (!config?.enabled) {
      throw new Error("Meta Embedded Signup belum dikonfigurasi. Set META_APP_ID dan META_EMBEDDED_CONFIG_ID.");
    }

    setLaunching(true);
    setError(null);
    sessionRef.current = {};

    try {
      await loadFacebookSDK(config.app_id, config.api_version);

      const code = await new Promise<string>((resolve, reject) => {
        if (!window.FB) {
          reject(new Error("Facebook SDK tidak tersedia"));
          return;
        }

        window.FB.login(
          (response) => {
            const authCode = response.authResponse?.code;
            if (!authCode) {
              reject(new Error("Embedded signup dibatalkan atau gagal"));
              return;
            }
            resolve(authCode);
          },
          {
            config_id: config.config_id,
            response_type: "code",
            override_default_response_type: true,
            extras: {
              setup: {},
              featureType: "whatsapp_business_app_onboarding",
              sessionInfoVersion: "3",
            },
          },
        );
      });

      const wabaId = sessionRef.current.wabaId;
      if (!wabaId) {
        throw new Error("WABA ID tidak diterima dari Meta. Pastikan flow coexistence selesai.");
      }

      return {
        code,
        wabaId,
        phoneNumberId: sessionRef.current.phoneNumberId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Embedded signup gagal";
      setError(message);
      throw err;
    } finally {
      setLaunching(false);
    }
  }, [config]);

  return {
    config,
    loading,
    launching,
    error,
    launch,
    enabled: Boolean(config?.enabled),
  };
}
