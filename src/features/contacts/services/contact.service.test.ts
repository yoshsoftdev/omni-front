import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LinkedContact } from "@/types/contact";

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/services/api/client", () => ({
  apiClient: apiClientMock,
}));

import { contactService } from "@/features/contacts/services/contact.service";

describe("contactService contact linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends the linked contact id in the contact-links payload", async () => {
    const linked: LinkedContact = {
      link_id: "link-ab",
      id: "b",
      contact_name: "Contact b",
      customer_name: "Contact b",
      phone: "",
      provider_kinds: [],
      linked_at: "2026-07-15T00:00:00Z",
    };
    apiClientMock.post.mockResolvedValue({ data: linked });

    await contactService.linkContact("a", "b");

    expect(apiClientMock.post).toHaveBeenCalledWith("/contacts/a/links", {
      contact_id: "b",
    });
  });

  it("does not fabricate activity text when the API provides none", async () => {
    apiClientMock.get.mockResolvedValue({
      data: {
        activities: [
          {
            id: "real",
            type: "provider_linked",
            text: "",
            description: "WhatsApp linked",
            created_at: "2026-07-15T00:00:00Z",
          },
          {
            id: "empty",
            type: "provider_linked",
            text: "",
            created_at: "2026-07-15T00:00:00Z",
          },
        ],
      },
    });

    const activities = await contactService.listActivities("a");

    expect(activities).toHaveLength(1);
    expect(activities[0].text).toBe("WhatsApp linked");
  });
});
