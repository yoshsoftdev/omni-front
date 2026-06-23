import type { Segment } from "@/features/segments/types/segment";

export const MOCK_SEGMENTS: Segment[] = [
  {
    id: "s1",
    name: "VIP Customer",
    description: "Customers tagged as VIP with high engagement",
    color: "#8B5CF6",
    contact_count: 1240,
    updated_at: "2026-06-17T08:00:00Z",
    created_at: "2026-01-15T08:00:00Z",
    rules: [
      { id: "r1", field: "tag", operator: "equals", value: "VIP" },
      { id: "r2", field: "consent_status", operator: "equals", value: "opt_in" },
    ],
  },
  {
    id: "s2",
    name: "Jakarta Customer",
    description: "Customers located in Jakarta",
    color: "#3B82F6",
    contact_count: 3890,
    updated_at: "2026-06-16T14:00:00Z",
    created_at: "2026-02-01T08:00:00Z",
    rules: [
      { id: "r3", field: "city", operator: "equals", value: "Jakarta" },
      { id: "r4", field: "tag", operator: "equals", value: "Customer" },
    ],
  },
  {
    id: "s3",
    name: "Reseller",
    description: "All reseller partners",
    color: "#F59E0B",
    contact_count: 320,
    updated_at: "2026-06-15T10:00:00Z",
    created_at: "2026-02-15T08:00:00Z",
    rules: [{ id: "r5", field: "tag", operator: "equals", value: "Reseller" }],
  },
  {
    id: "s4",
    name: "Inactive 30 Days",
    description: "No activity in the last 30 days",
    color: "#EF4444",
    contact_count: 2150,
    updated_at: "2026-06-17T06:00:00Z",
    created_at: "2026-03-01T08:00:00Z",
    rules: [{ id: "r6", field: "last_activity", operator: "less_than", value: "30" }],
  },
];

export const SEGMENT_GENDER_STATS = [
  { label: "Female", value: 58, color: "#8B5CF6" },
  { label: "Male", value: 40, color: "#3B82F6" },
  { label: "Unknown", value: 2, color: "#D1D5DB" },
];

export const SEGMENT_CITY_STATS = [
  { city: "Jakarta", count: 1240 },
  { city: "Bandung", count: 680 },
  { city: "Surabaya", count: 520 },
  { city: "Medan", count: 310 },
  { city: "Semarang", count: 240 },
];

export const SEGMENT_GROWTH_STATS = [
  { month: "Jan", count: 980 },
  { month: "Feb", count: 1050 },
  { month: "Mar", count: 1100 },
  { month: "Apr", count: 1180 },
  { month: "May", count: 1210 },
  { month: "Jun", count: 1240 },
];
