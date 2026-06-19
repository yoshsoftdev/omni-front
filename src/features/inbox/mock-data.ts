import type {
  InboxActivityEvent,
  InboxAgent,
  InboxChatMessage,
  InboxContact,
  InboxConversation,
  InboxWorkspaceNote,
  QuickReplyItem,
} from "@/features/inbox/types";

const TAGS = {
  vip: { id: "t1", name: "VIP", color: "#8B5CF6" },
  customer: { id: "t2", name: "Customer", color: "#3B82F6" },
  jakarta: { id: "t3", name: "Jakarta", color: "#10B981" },
};

export const MOCK_AGENTS: InboxAgent[] = [
  { id: "a1", name: "Steven Fernandes", email: "steven@weebs.team", presence: "online" },
  { id: "a2", name: "Shabrina Ayu", email: "shabrina@weebs.team", presence: "online" },
  { id: "a3", name: "Budi Setiawan", email: "budi@weebs.team", presence: "away" },
  { id: "a4", name: "Aulia Putri", email: "aulia@weebs.team", presence: "offline" },
];

export const MOCK_CONTACTS: Record<string, InboxContact> = {
  c1: {
    id: "c1", name: "Aulia Putri", phone: "+62 812-3456-7890", email: "aulia@email.com",
    subscription_status: "subscribed", source: "WhatsApp", added_on: "January 20, 2026",
    last_activity: "Today, 10:45 AM", language: "Indonesian", customer_type: "Premium",
    city: "Jakarta", notes: "Preferred WhatsApp contact",
    tags: [TAGS.vip, TAGS.customer, TAGS.jakarta],
    conversations_count: 18, campaigns_received: 7, campaigns_clicked: 3,
  },
  c2: {
    id: "c2", name: "Budi Setiawan", phone: "+62 813-9876-5432", email: "budi@email.com",
    subscription_status: "subscribed", source: "WhatsApp", added_on: "February 5, 2026",
    last_activity: "Yesterday, 5:21 PM", language: "Indonesian", customer_type: "Standard",
    city: "Bandung", tags: [TAGS.customer],
    conversations_count: 8, campaigns_received: 5, campaigns_clicked: 1,
  },
  c3: {
    id: "c3", name: "Rina Anggraini", phone: "+62 821-1122-3344", email: "rina@email.com",
    subscription_status: "unsubscribed", source: "Instagram", added_on: "March 10, 2026",
    last_activity: "June 15, 2026", language: "Indonesian", city: "Surabaya", tags: [],
    conversations_count: 3, campaigns_received: 2, campaigns_clicked: 0,
  },
};

export const MOCK_CONVERSATIONS: InboxConversation[] = [
  { id: "cv1", contact_id: "c1", contact_name: "Aulia Putri", contact_phone: "+62 812-3456-7890", channel: "whatsapp", status: "open", assigned_to: "a2", assignee_name: "Shabrina Ayu", last_message_at: "2026-06-17T10:45:00Z", last_message_preview: "Baik kak, saya tunggu updatenya ya", unread_count: 2, tags: [TAGS.vip, TAGS.customer, TAGS.jakarta] },
  { id: "cv2", contact_id: "c2", contact_name: "Budi Setiawan", contact_phone: "+62 813-9876-5432", channel: "whatsapp", status: "assigned", assigned_to: "a1", assignee_name: "Steven Fernandes", last_message_at: "2026-06-17T09:30:00Z", last_message_preview: "Terima kasih infonya", unread_count: 0, tags: [TAGS.customer] },
  { id: "cv3", contact_id: "c3", contact_name: "Rina Anggraini", contact_phone: "+62 821-1122-3344", channel: "instagram", status: "unassigned", last_message_at: "2026-06-16T14:00:00Z", last_message_preview: "Apakah masih ada stok?", unread_count: 1, tags: [] },
  { id: "cv4", contact_id: "c4", contact_name: "Dewi Lestari", contact_phone: "+62 856-7788-9900", channel: "whatsapp", status: "open", assigned_to: "a3", assignee_name: "Budi Setiawan", last_message_at: "2026-06-17T08:15:00Z", last_message_preview: "Oke siap", unread_count: 0, tags: [TAGS.customer] },
  { id: "cv5", contact_id: "c5", contact_name: "Ricky Saputra", contact_phone: "+62 877-5544-3322", channel: "messenger", status: "unassigned", last_message_at: "2026-06-16T17:00:00Z", last_message_preview: "Halo min", unread_count: 3, tags: [TAGS.jakarta] },
  { id: "cv6", contact_id: "c6", contact_name: "Nadia Permata", contact_phone: "+62 858-2233-4455", channel: "whatsapp", status: "assigned", assigned_to: "a2", assignee_name: "Shabrina Ayu", last_message_at: "2026-06-17T07:00:00Z", last_message_preview: "Sudah saya transfer", unread_count: 0, tags: [TAGS.vip] },
  { id: "cv7", contact_id: "c7", contact_name: "Arif Prasetyo", contact_phone: "+62 812-9988-7766", channel: "whatsapp", status: "open", last_message_at: "2026-06-17T06:30:00Z", last_message_preview: "Bisa dikirim hari ini?", unread_count: 1, tags: [] },
  { id: "cv8", contact_id: "c8", contact_name: "Maya Sari", contact_phone: "+62 813-4455-6677", channel: "whatsapp", status: "closed", assigned_to: "a1", assignee_name: "Steven Fernandes", last_message_at: "2026-06-15T11:00:00Z", last_message_preview: "Terima kasih", unread_count: 0, tags: [TAGS.customer] },
  { id: "cv9", contact_id: "c9", contact_name: "Rizki Ramadhan", contact_phone: "+62 811-6677-8899", channel: "instagram", status: "unassigned", last_message_at: "2026-06-16T10:00:00Z", last_message_preview: "Promonya masih berlaku?", unread_count: 0, tags: [] },
  { id: "cv10", contact_id: "c10", contact_name: "Tania Wijaya", contact_phone: "+62 822-3344-5566", channel: "whatsapp", status: "assigned", assigned_to: "a4", assignee_name: "Aulia Putri", last_message_at: "2026-06-17T05:00:00Z", last_message_preview: "Siap kak", unread_count: 0, tags: [TAGS.jakarta] },
  { id: "cv11", contact_id: "c11", contact_name: "Fajar Nugroho", contact_phone: "+62 878-9900-1122", channel: "whatsapp", status: "closed", last_message_at: "2026-06-14T09:00:00Z", last_message_preview: "Done", unread_count: 0, tags: [] },
  { id: "cv12", contact_id: "c12", contact_name: "Lina Kartika", contact_phone: "+62 813-4455-6677", channel: "whatsapp", status: "open", assigned_to: "a1", assignee_name: "Steven Fernandes", last_message_at: "2026-06-17T04:00:00Z", last_message_preview: "Mohon info ongkir", unread_count: 4, tags: [TAGS.vip, TAGS.customer] },
  { id: "cv13", contact_id: "c13", contact_name: "Hendra Wijaya", contact_phone: "+62 812-5566-7788", channel: "whatsapp", status: "open", last_message_at: "2026-06-16T16:00:00Z", last_message_preview: "Kapan barang dikirim?", unread_count: 1, tags: [TAGS.customer] },
  { id: "cv14", contact_id: "c14", contact_name: "Siti Rahayu", contact_phone: "+62 878-1122-3344", channel: "whatsapp", status: "open", assigned_to: "a3", assignee_name: "Budi Setiawan", last_message_at: "2026-06-16T15:00:00Z", last_message_preview: "Terima kasih kak", unread_count: 0, tags: [] },
];

export const MOCK_MESSAGES: Record<string, InboxChatMessage[]> = {
  cv1: [
    { id: "m1", conversation_id: "cv1", direction: "inbound", type: "text", content: "Halo kak, saya mau tanya soal pesanan kemarin", sent_at: "2026-06-17T10:30:00Z", date_label: "Today" },
    { id: "m2", conversation_id: "cv1", direction: "outbound", type: "text", content: "Halo Aulia! Pesanan kakak sedang kami proses ya.", sent_at: "2026-06-17T10:35:00Z", delivered: true, read: true, sender_name: "Shabrina Ayu" },
    { id: "m3", conversation_id: "cv1", direction: "inbound", type: "text", content: "Baik kak, saya tunggu updatenya ya", sent_at: "2026-06-17T10:45:00Z" },
  ],
  cv2: [
    { id: "m4", conversation_id: "cv2", direction: "inbound", type: "text", content: "Info harga paket enterprise?", sent_at: "2026-06-17T09:00:00Z", date_label: "Today" },
    { id: "m5", conversation_id: "cv2", direction: "outbound", type: "text", content: "Halo Budi, paket enterprise mulai dari Rp 2.5jt/bulan.", sent_at: "2026-06-17T09:20:00Z", delivered: true, read: true },
    { id: "m6", conversation_id: "cv2", direction: "inbound", type: "text", content: "Terima kasih infonya", sent_at: "2026-06-17T09:30:00Z" },
  ],
};

export const MOCK_ACTIVITIES: Record<string, InboxActivityEvent[]> = {
  c1: [
    { id: "ev1", type: "opened", description: "Conversation opened", created_at: "2026-06-17T10:30:00Z" },
    { id: "ev2", type: "agent_replied", description: "Agent replied (by Shabrina Ayu)", created_at: "2026-06-17T10:35:00Z" },
    { id: "ev3", type: "customer_replied", description: "Customer replied", created_at: "2026-06-17T10:45:00Z" },
    { id: "ev4", type: "campaign_received", description: "Received campaign Promo Juni", created_at: "2026-06-15T09:00:00Z" },
    { id: "ev5", type: "campaign_clicked", description: "Clicked campaign Promo Juni", created_at: "2026-06-15T11:00:00Z" },
    { id: "ev6", type: "tag_added", description: "Tag VIP added", created_at: "2026-01-20T08:00:00Z" },
  ],
};

export const MOCK_WORKSPACE_NOTES: Record<string, InboxWorkspaceNote[]> = {
  c1: [
    { id: "n1", category: "workspace", content: "VIP customer — prioritize response time.", author: "Steven Fernandes", created_at: "2026-06-10T08:00:00Z" },
    { id: "n2", category: "internal", content: "Customer asked about order #12345.", author: "Shabrina Ayu", created_at: "2026-06-17T10:40:00Z" },
    { id: "n3", category: "supervisor", content: "Monitor SLA for this conversation.", author: "Budi Setiawan", created_at: "2026-06-17T09:00:00Z" },
  ],
};

export const MOCK_QUICK_REPLIES: QuickReplyItem[] = [
  { id: "qr1", category: "Greeting", text: "Halo! Terima kasih sudah menghubungi kami. Ada yang bisa kami bantu?" },
  { id: "qr2", category: "Greeting", text: "Selamat pagi! Tim kami siap membantu Anda hari ini." },
  { id: "qr3", category: "Order & Payment", text: "Pesanan Anda sedang kami proses. Estimasi pengiriman 2-3 hari kerja." },
  { id: "qr4", category: "Order & Payment", text: "Silakan lakukan pembayaran ke rekening berikut..." },
  { id: "qr5", category: "Shipping", text: "Pengiriman menggunakan JNE Reguler. Nomor resi akan dikirim setelah barang dikirim." },
  { id: "qr6", category: "Support", text: "Mohon maaf atas ketidaknyamanannya. Tim kami akan segera menindaklanjuti." },
];

export function getContactForConversation(conversation: InboxConversation): InboxContact {
  return MOCK_CONTACTS[conversation.contact_id] ?? {
    id: conversation.contact_id,
    name: conversation.contact_name,
    phone: conversation.contact_phone,
    subscription_status: "subscribed",
    source: conversation.channel === "whatsapp" ? "WhatsApp" : conversation.channel,
    added_on: "January 1, 2026",
    last_activity: "Today",
    language: "Indonesian",
    tags: conversation.tags,
    conversations_count: 1,
    campaigns_received: 0,
    campaigns_clicked: 0,
  };
}
