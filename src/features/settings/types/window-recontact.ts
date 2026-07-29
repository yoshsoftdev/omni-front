export interface WindowRecontactSettings {
  enabled: boolean;
  text: string;
  /** Hours after last customer message before auto-send (1–23). */
  after_hours: number;
}

export const WINDOW_RECONTACT_MIN_HOURS = 1;
export const WINDOW_RECONTACT_MAX_HOURS = 23;
export const WINDOW_RECONTACT_DEFAULT_TEXT =
  "Halo, apakah masih ada yang bisa kami bantu? Silakan balas pesan ini agar kami dapat terus membantu Anda.";
