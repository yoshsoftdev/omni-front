import type { Contact, ContactStats, ContactTag } from "@/types/contact";

export {
  MOCK_SEGMENTS,
  SEGMENT_CITY_STATS,
  SEGMENT_GENDER_STATS,
  SEGMENT_GROWTH_STATS,
} from "@/features/segments/mock/segment-mock-data";

export const CONTACT_STATS: ContactStats = {
  total: 25430,
  opt_in: 18732,
  opt_out: 2183,
  unknown: 4515,
};

export const MOCK_TAGS: ContactTag[] = [
  { id: "t1", name: "VIP", description: "High-value customers", color: "#8B5CF6", contact_count: 1240, updated_at: "2026-06-17T08:00:00Z", created_at: "2026-01-10T08:00:00Z", created_by: "Steven Fernandes" },
  { id: "t2", name: "Customer", description: "Active paying customers", color: "#3B82F6", contact_count: 8420, updated_at: "2026-06-16T14:00:00Z", created_at: "2026-01-12T08:00:00Z", created_by: "Aulia Putri" },
  { id: "t3", name: "Reseller", description: "Reseller partners", color: "#F59E0B", contact_count: 320, updated_at: "2026-06-15T10:00:00Z", created_at: "2026-02-01T08:00:00Z", created_by: "Steven Fernandes" },
  { id: "t4", name: "Hot Lead", description: "High intent prospects", color: "#EF4444", contact_count: 890, updated_at: "2026-06-17T06:00:00Z", created_at: "2026-03-05T08:00:00Z", created_by: "Budi Setiawan" },
  { id: "t5", name: "Cold Lead", description: "Low engagement prospects", color: "#6B7280", contact_count: 2100, updated_at: "2026-06-14T09:00:00Z", created_at: "2026-03-10T08:00:00Z", created_by: "Aulia Putri" },
  { id: "t6", name: "Prospect", description: "Potential customers", color: "#10B981", contact_count: 4560, updated_at: "2026-06-16T11:00:00Z", created_at: "2026-04-01T08:00:00Z", created_by: "Dewi Lestari" },
];

const tag = (id: string) => {
  const t = MOCK_TAGS.find((x) => x.id === id)!;
  return { id: t.id, name: t.name, color: t.color };
};

export const MOCK_CONTACTS: Contact[] = [
  {
    id: "c1", name: "Aulia Putri", phone: "+62 812-3456-7890", email: "aulia@email.com",
    source: "whatsapp", tags: [tag("t1"), tag("t2")], consent_status: "opt_in",
    last_activity_at: "2026-06-17T10:45:00Z", language: "Indonesian", customer_type: "Premium",
    city: "Jakarta", notes: "Preferred WhatsApp contact", created_at: "2026-01-20T08:00:00Z", updated_at: "2026-06-17T10:45:00Z",
    conversations_count: 16, campaigns_received: 7, campaigns_clicked: 3, last_conversation_at: "2026-06-17T10:45:00Z",
    recent_campaigns: [
      { id: "cp1", name: "Promo Juni", status: "clicked", sent_at: "2026-06-15T09:00:00Z" },
      { id: "cp2", name: "Flash Sale", status: "delivered", sent_at: "2026-06-10T09:00:00Z" },
    ],
    activities: [
      { id: "a1", type: "message", text: "Replied to inbox conversation", created_at: "2026-06-17T10:45:00Z" },
      { id: "a2", type: "campaign", text: "Clicked campaign Promo Juni", created_at: "2026-06-15T11:00:00Z" },
    ],
  },
  {
    id: "c2", name: "Budi Setiawan", phone: "+62 813-9876-5432", email: "budi@email.com",
    source: "import", tags: [tag("t2"), tag("t4")], consent_status: "opt_in",
    last_activity_at: "2026-06-16T17:21:00Z", language: "Indonesian", customer_type: "Standard",
    city: "Bandung", notes: "", created_at: "2026-02-05T08:00:00Z", updated_at: "2026-06-16T17:21:00Z",
    conversations_count: 8, campaigns_received: 5, campaigns_clicked: 1, last_conversation_at: "2026-06-16T17:21:00Z",
    recent_campaigns: [{ id: "cp3", name: "New Arrival", status: "read", sent_at: "2026-06-14T09:00:00Z" }],
    activities: [{ id: "a3", type: "import", text: "Imported via CSV", created_at: "2026-02-05T08:00:00Z" }],
  },
  {
    id: "c3", name: "Dewi Lestari", phone: "+62 821-1122-3344", email: "dewi@email.com",
    source: "manual", tags: [tag("t6")], consent_status: "unknown",
    last_activity_at: "2026-06-15T13:00:00Z", language: "Indonesian", customer_type: "Prospect",
    city: "Surabaya", notes: "Follow up next week", created_at: "2026-03-10T08:00:00Z", updated_at: "2026-06-15T13:00:00Z",
    conversations_count: 3, campaigns_received: 2, campaigns_clicked: 0, last_conversation_at: "2026-06-15T13:00:00Z",
    recent_campaigns: [], activities: [],
  },
  {
    id: "c4", name: "Ricky Saputra", phone: "+62 856-7788-9900", email: "ricky@email.com",
    source: "whatsapp", tags: [tag("t3")], consent_status: "opt_out",
    last_activity_at: "2026-06-12T10:20:00Z", language: "Indonesian", customer_type: "Reseller",
    city: "Jakarta", notes: "", created_at: "2026-02-20T08:00:00Z", updated_at: "2026-06-12T10:20:00Z",
    conversations_count: 12, campaigns_received: 10, campaigns_clicked: 2, last_conversation_at: "2026-06-12T10:20:00Z",
    recent_campaigns: [{ id: "cp4", name: "Reseller Promo", status: "failed", sent_at: "2026-06-11T09:00:00Z" }],
    activities: [{ id: "a4", type: "consent", text: "Opted out of marketing", created_at: "2026-06-01T08:00:00Z" }],
  },
  {
    id: "c5", name: "Nadia Permata", phone: "+62 877-5544-3322", email: "nadia@email.com",
    source: "api", tags: [tag("t1"), tag("t4")], consent_status: "opt_in",
    last_activity_at: "2026-06-17T08:10:00Z", language: "English", customer_type: "Premium",
    city: "Jakarta", notes: "VIP since 2025", created_at: "2026-01-05T08:00:00Z", updated_at: "2026-06-17T08:10:00Z",
    conversations_count: 22, campaigns_received: 12, campaigns_clicked: 5, last_conversation_at: "2026-06-17T08:10:00Z",
    recent_campaigns: [
      { id: "cp5", name: "VIP Exclusive", status: "clicked", sent_at: "2026-06-16T09:00:00Z" },
      { id: "cp6", name: "Promo Juni", status: "delivered", sent_at: "2026-06-15T09:00:00Z" },
    ],
    activities: [],
  },
  {
    id: "c6", name: "Arif Prasetyo", phone: "+62 812-9988-7766", email: "arif@email.com",
    source: "import", tags: [tag("t5")], consent_status: "unknown",
    last_activity_at: "2026-05-20T10:00:00Z", language: "Indonesian", customer_type: "Standard",
    city: "Medan", notes: "", created_at: "2026-04-01T08:00:00Z", updated_at: "2026-05-20T10:00:00Z",
    conversations_count: 1, campaigns_received: 3, campaigns_clicked: 0, last_conversation_at: "2026-05-20T10:00:00Z",
    recent_campaigns: [], activities: [],
  },
  {
    id: "c7", name: "Maya Sari", phone: "+62 858-2233-4455", email: "maya@email.com",
    source: "whatsapp", tags: [tag("t2"), tag("t6")], consent_status: "opt_in",
    last_activity_at: "2026-06-16T14:11:00Z", language: "Indonesian", customer_type: "Standard",
    city: "Jakarta", notes: "", created_at: "2026-03-15T08:00:00Z", updated_at: "2026-06-16T14:11:00Z",
    conversations_count: 6, campaigns_received: 4, campaigns_clicked: 1, last_conversation_at: "2026-06-16T14:11:00Z",
    recent_campaigns: [], activities: [],
  },
  {
    id: "c8", name: "Rizki Ramadhan", phone: "+62 811-6677-8899", email: "rizki@email.com",
    source: "manual", tags: [tag("t4")], consent_status: "opt_in",
    last_activity_at: "2026-06-17T07:11:00Z", language: "Indonesian", customer_type: "Hot Lead",
    city: "Bandung", notes: "Interested in enterprise plan", created_at: "2026-05-01T08:00:00Z", updated_at: "2026-06-17T07:11:00Z",
    conversations_count: 4, campaigns_received: 2, campaigns_clicked: 1, last_conversation_at: "2026-06-17T07:11:00Z",
    recent_campaigns: [], activities: [],
  },
  {
    id: "c9", name: "Tania Wijaya", phone: "+62 822-3344-5566", email: "tania@email.com",
    source: "import", tags: [tag("t2")], consent_status: "opt_out",
    last_activity_at: "2026-06-10T09:00:00Z", language: "Indonesian", customer_type: "Standard",
    city: "Semarang", notes: "", created_at: "2026-04-10T08:00:00Z", updated_at: "2026-06-10T09:00:00Z",
    conversations_count: 2, campaigns_received: 6, campaigns_clicked: 0, last_conversation_at: "2026-06-10T09:00:00Z",
    recent_campaigns: [], activities: [],
  },
  {
    id: "c10", name: "Fajar Nugroho", phone: "+62 878-9900-1122", email: "fajar@email.com",
    source: "whatsapp", tags: [tag("t3"), tag("t2")], consent_status: "opt_in",
    last_activity_at: "2026-06-16T09:50:00Z", language: "Indonesian", customer_type: "Reseller",
    city: "Jakarta", notes: "", created_at: "2026-02-28T08:00:00Z", updated_at: "2026-06-16T09:50:00Z",
    conversations_count: 9, campaigns_received: 8, campaigns_clicked: 2, last_conversation_at: "2026-06-16T09:50:00Z",
    recent_campaigns: [], activities: [],
  },
  {
    id: "c11", name: "Lina Kartika", phone: "+62 813-4455-6677", email: "lina@email.com",
    source: "api", tags: [tag("t1")], consent_status: "opt_in",
    last_activity_at: "2026-06-17T06:41:00Z", language: "English", customer_type: "Premium",
    city: "Jakarta", notes: "", created_at: "2026-01-25T08:00:00Z", updated_at: "2026-06-17T06:41:00Z",
    conversations_count: 14, campaigns_received: 9, campaigns_clicked: 4, last_conversation_at: "2026-06-17T06:41:00Z",
    recent_campaigns: [], activities: [],
  },
  {
    id: "c12", name: "Steven Fernandes", phone: "+62 812-0000-1111", email: "steven@email.com",
    source: "manual", tags: [tag("t2")], consent_status: "opt_in",
    last_activity_at: "2026-06-17T10:00:00Z", language: "English", customer_type: "Premium",
    city: "Jakarta", notes: "Workspace owner contact", created_at: "2026-01-01T08:00:00Z", updated_at: "2026-06-17T10:00:00Z",
    conversations_count: 30, campaigns_received: 15, campaigns_clicked: 8, last_conversation_at: "2026-06-17T10:00:00Z",
    recent_campaigns: [], activities: [],
  },
];

export const CONTACT_SOURCES = [
  { value: "", label: "All Sources" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "import", label: "Import" },
  { value: "manual", label: "Manual" },
  { value: "api", label: "API" },
];

export const IMPORT_FIELD_OPTIONS = [
  { value: "", label: "Skip" },
  { value: "name", label: "Contact Name" },
  { value: "phone", label: "Phone Number" },
  { value: "email", label: "Email" },
  { value: "city", label: "City" },
  { value: "notes", label: "Notes" },
  { value: "customer_type", label: "Customer Type" },
];

export const SAMPLE_CSV_ROWS = [
  { name: "John Doe", phone: "+62812345678", email: "john@email.com", city: "Jakarta" },
  { name: "Jane Smith", phone: "+62898765432", email: "jane@email.com", city: "Bandung" },
  { name: "Ahmad Rizki", phone: "+62811223344", email: "ahmad@email.com", city: "Surabaya" },
  { name: "Siti Nur", phone: "+62855667788", email: "siti@email.com", city: "Jakarta" },
  { name: "Bambang W", phone: "+62899887766", email: "bambang@email.com", city: "Medan" },
  { name: "Rina K", phone: "+62877665544", email: "rina@email.com", city: "Semarang" },
  { name: "Doni P", phone: "+62833445566", email: "doni@email.com", city: "Jakarta" },
  { name: "Eka S", phone: "+62822113344", email: "eka@email.com", city: "Bandung" },
  { name: "Hendra L", phone: "+62866778899", email: "invalid-email", city: "Jakarta" },
  { name: "Wulan A", phone: "", email: "wulan@email.com", city: "Surabaya" },
  { name: "Yoga M", phone: "+62888990011", email: "yoga@email.com", city: "Jakarta" },
  { name: "Putri D", phone: "+62811220033", email: "putri@email.com", city: "Jakarta" },
];
