import {
  type TemplateListItem,
  type TemplateStatus,
  type WhatsAppTemplateMock,
} from "@/features/broadcast/mock/template-legacy-adapters";

export type { TemplateListItem, TemplateStatus, WhatsAppTemplateMock };

export type BroadcastDevice = {
  id: string;
  name: string;
  phone: string;
};

export const mockDevices: BroadcastDevice[] = [
  { id: "dev_1", name: "Skinsure Glow Official", phone: "+62 812-3456-7890" },
];

export const templateLanguageOptions = [
  { value: "all", label: "Semua Bahasa" },
  { value: "Indonesia (ID)", label: "Indonesia (ID)" },
  { value: "English (EN)", label: "English (EN)" },
];

export const templateCategoryOptions = [
  { value: "all", label: "Semua Kategori" },
  { value: "Marketing", label: "Marketing" },
  { value: "Utility", label: "Utility" },
  { value: "Authentication", label: "Authentication" },
];

export const templateStatusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

export type ContactFieldOption = {
  value: string;
  label: string;
};

export const contactFieldOptions: ContactFieldOption[] = [
  { value: "contact_name", label: "Nama Kontak" },
  { value: "customer_name", label: "Nama Customer" },
  { value: "discount", label: "Diskon Persen" },
  { value: "expired_date", label: "Tanggal Expired" },
];

export const mockSampleContactValues: Record<string, string> = {
  name: "Aulia",
  discount: "20%",
  expired_date: "30 April 2024",
};

export type MockContact = {
  id: string;
  name: string;
  phone: string;
};

export const mockContacts: MockContact[] = [
  { id: "c_1", name: "Aulia Putri", phone: "+62 812-3456-7890" },
  { id: "c_2", name: "Nadia Putri", phone: "+62 811-1234-5678" },
  { id: "c_3", name: "Rani", phone: "+62 813-9876-5432" },
];

export const mockTags: { id: string; name: string }[] = [
  { id: "t_1", name: "VIP" },
  { id: "t_2", name: "Prospek" },
];

export type ScheduleStatus = "scheduled" | "running" | "completed" | "cancelled";

export type ScheduledCampaign = {
  id: string;
  name: string;
  description: string;
  wabaName: string;
  wabaPhone: string;
  scheduledAt: string;
  targetContacts: number;
  status: ScheduleStatus;
};

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  scheduled: "TERJADWAL",
  running: "BERJALAN",
  completed: "SELESAI",
  cancelled: "DIBATALKAN",
};

export const scheduleTabs = [
  { value: "all", label: "Semua" },
  { value: "scheduled", label: "Terjadwal" },
  { value: "running", label: "Berjalan" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
] as const;

export const mockScheduledCampaigns: ScheduledCampaign[] = [
  {
    id: "sch_1",
    name: "Promo Hydrabalance April 2024",
    description: "Kampanye promo produk Hydrabalance",
    wabaName: "Skinsure Glow Official",
    wabaPhone: "+62 812-3456-7890",
    scheduledAt: "2024-04-15T09:00:00Z",
    targetContacts: 1250,
    status: "scheduled",
  },
  {
    id: "sch_2",
    name: "Flash Sale Weekend",
    description: "Broadcast flash sale akhir pekan",
    wabaName: "Skinsure Glow Official",
    wabaPhone: "+62 812-3456-7890",
    scheduledAt: "2024-04-12T14:30:00Z",
    targetContacts: 890,
    status: "running",
  },
  {
    id: "sch_3",
    name: "Order Confirmation Batch",
    description: "Notifikasi konfirmasi pesanan",
    wabaName: "Skinsure Glow Official",
    wabaPhone: "+62 812-3456-7890",
    scheduledAt: "2024-04-10T08:00:00Z",
    targetContacts: 456,
    status: "completed",
  },
  {
    id: "sch_4",
    name: "VIP Customer Greeting",
    description: "Sapaan pelanggan VIP bulanan",
    wabaName: "Skinsure Glow Official",
    wabaPhone: "+62 812-3456-7890",
    scheduledAt: "2024-04-18T10:00:00Z",
    targetContacts: 320,
    status: "scheduled",
  },
  {
    id: "sch_5",
    name: "Payment Reminder Q2",
    description: "Pengingat pembayaran tagihan",
    wabaName: "Skinsure Glow Official",
    wabaPhone: "+62 812-3456-7890",
    scheduledAt: "2024-04-08T11:00:00Z",
    targetContacts: 210,
    status: "completed",
  },
  {
    id: "sch_6",
    name: "New Product Launch",
    description: "Peluncuran produk baru",
    wabaName: "Skinsure Glow Official",
    wabaPhone: "+62 812-3456-7890",
    scheduledAt: "2024-04-20T16:00:00Z",
    targetContacts: 2100,
    status: "scheduled",
  },
  {
    id: "sch_7",
    name: "Survey Kepuasan Pelanggan",
    description: "Undangan mengisi survei",
    wabaName: "Skinsure Glow Official",
    wabaPhone: "+62 812-3456-7890",
    scheduledAt: "2024-04-05T13:00:00Z",
    targetContacts: 580,
    status: "cancelled",
  },
  {
    id: "sch_8",
    name: "Restock Notification",
    description: "Notifikasi stok kembali tersedia",
    wabaName: "Skinsure Glow Official",
    wabaPhone: "+62 812-3456-7890",
    scheduledAt: "2024-04-11T07:30:00Z",
    targetContacts: 745,
    status: "running",
  },
];

export type PerformanceDataPoint = {
  date: string;
  label: string;
  sent: number;
  read: number;
  failed: number;
};

export type CampaignReportRow = {
  id: string;
  name: string;
  status: ScheduleStatus;
  sent: number;
  read: number;
  failed: number;
};

export type ReportKPI = {
  totalCampaigns: number;
  totalSent: number;
  deliveredRate: number;
  readRate: number;
  failedRate: number;
  changes: {
    campaigns: { value: string; direction: "up" | "down" };
    sent: { value: string; direction: "up" | "down" };
    delivered: { value: string; direction: "up" | "down" };
    read: { value: string; direction: "up" | "down" };
    failed: { value: string; direction: "up" | "down" };
  };
};

export type DeliveryBreakdown = {
  label: string;
  value: number;
};

export type HourlyPerformance = {
  hour: number;
  count: number;
};

export type CampaignReportDetail = {
  id: string;
  name: string;
  status: ScheduleStatus;
  wabaName: string;
  wabaPhone: string;
  templateName: string;
  language: string;
  category: string;
  createdBy: string;
  createdAt: string;
  targetContacts: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryBreakdown: DeliveryBreakdown[];
  hourlyPerformance: HourlyPerformance[];
};

export const reportDateRangeOptions = [
  { value: "7d", label: "7 hari terakhir" },
  { value: "30d", label: "30 hari terakhir" },
  { value: "month", label: "Bulan ini" },
];

export const reportWabaOptions = [
  { value: "all", label: "Semua WABA" },
  { value: "dev_1", label: "Skinsure Glow Official" },
];

export const mockReportKPI: ReportKPI = {
  totalCampaigns: 24,
  totalSent: 18420,
  deliveredRate: 96.4,
  readRate: 72.8,
  failedRate: 3.6,
  changes: {
    campaigns: { value: "+12%", direction: "up" },
    sent: { value: "+8.4%", direction: "up" },
    delivered: { value: "+1.2%", direction: "up" },
    read: { value: "+3.5%", direction: "up" },
    failed: { value: "-0.8%", direction: "down" },
  },
};

export const mockPerformanceTimeline: PerformanceDataPoint[] = [
  { date: "2024-04-02", label: "2 Apr", sent: 1200, read: 820, failed: 48 },
  { date: "2024-04-03", label: "3 Apr", sent: 1580, read: 1100, failed: 62 },
  { date: "2024-04-04", label: "4 Apr", sent: 1420, read: 980, failed: 55 },
  { date: "2024-04-05", label: "5 Apr", sent: 1890, read: 1320, failed: 71 },
  { date: "2024-04-06", label: "6 Apr", sent: 2100, read: 1540, failed: 80 },
  { date: "2024-04-07", label: "7 Apr", sent: 1750, read: 1280, failed: 65 },
  { date: "2024-04-08", label: "8 Apr", sent: 2480, read: 1820, failed: 92 },
];

export const mockCampaignReports: CampaignReportRow[] = [
  { id: "rpt_1", name: "Promo Hydrabalance April 2024", status: "completed", sent: 1250, read: 910, failed: 45 },
  { id: "rpt_2", name: "Flash Sale Weekend", status: "running", sent: 890, read: 620, failed: 32 },
  { id: "rpt_3", name: "Order Confirmation Batch", status: "completed", sent: 456, read: 380, failed: 12 },
  { id: "rpt_4", name: "VIP Customer Greeting", status: "scheduled", sent: 0, read: 0, failed: 0 },
  { id: "rpt_5", name: "Payment Reminder Q2", status: "completed", sent: 210, read: 165, failed: 8 },
];

export const mockCampaignReportDetails: Record<string, CampaignReportDetail> = {
  rpt_1: {
    id: "rpt_1",
    name: "Promo Hydrabalance April 2024",
    status: "completed",
    wabaName: "Skinsure Glow Official",
    wabaPhone: "+62 812-3456-7890",
    templateName: "promo_hydrabalance_apr2024",
    language: "Indonesia (ID)",
    category: "Marketing",
    createdBy: "Aulia Putri",
    createdAt: "2024-04-08T08:30:00Z",
    targetContacts: 1250,
    sent: 1245,
    delivered: 1200,
    read: 910,
    failed: 45,
    deliveryBreakdown: [
      { label: "Terkirim", value: 1245 },
      { label: "Terkirim (Delivered)", value: 1200 },
      { label: "Terbaca", value: 910 },
      { label: "Gagal", value: 45 },
    ],
    hourlyPerformance: [
      { hour: 0, count: 12 },
      { hour: 1, count: 8 },
      { hour: 2, count: 5 },
      { hour: 3, count: 4 },
      { hour: 4, count: 6 },
      { hour: 5, count: 10 },
      { hour: 6, count: 18 },
      { hour: 7, count: 42 },
      { hour: 8, count: 95 },
      { hour: 9, count: 180 },
      { hour: 10, count: 220 },
      { hour: 11, count: 195 },
      { hour: 12, count: 160 },
      { hour: 13, count: 140 },
      { hour: 14, count: 125 },
      { hour: 15, count: 110 },
      { hour: 16, count: 98 },
      { hour: 17, count: 85 },
      { hour: 18, count: 72 },
      { hour: 19, count: 55 },
      { hour: 20, count: 40 },
      { hour: 21, count: 28 },
      { hour: 22, count: 18 },
      { hour: 23, count: 12 },
    ],
  },
};

