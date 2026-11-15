/** Contact fields an import column can map to; mirrors the backend (`internal/contact/import.go`). */
export const IMPORT_FIELD_OPTIONS = [
  { value: "", label: "Skip" },
  { value: "name", label: "Name" },
  { value: "phone", label: "Phone Number" },
  { value: "email", label: "Email" },
  { value: "city", label: "City" },
  { value: "company", label: "Company" },
  { value: "notes", label: "Notes" },
];
