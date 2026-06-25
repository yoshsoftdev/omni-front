"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";

import { StepWizard } from "@/components/shared/step-wizard";
import { Button } from "@/components/ui/button";
import { IMPORT_FIELD_OPTIONS } from "@/features/contacts/constants/import";
import { contactService } from "@/features/contacts/services/contact.service";

const WIZARD_STEPS = [
  { id: 1, label: "Upload File" },
  { id: 2, label: "Map Columns" },
  { id: 3, label: "Preview & Import" },
];

const CSV_COLUMNS = ["name", "phone", "email", "city"] as const;

const DEFAULT_MAPPING: Record<string, string> = {
  name: "name",
  phone: "phone",
  email: "email",
  city: "city",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ImportWizard({ onNotify }: { onNotify: (type: "success" | "error", message: string) => void }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>(DEFAULT_MAPPING);
  const [importing, setImporting] = useState(false);
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);

  const validation = useMemo(() => {
    let valid = 0;
    let invalid = 0;
    previewRows.forEach((row) => {
      if (row.phone && (!row.email || isValidEmail(row.email))) valid += 1;
      else invalid += 1;
    });
    return { total: previewRows.length, valid, invalid };
  }, [previewRows]);

  function parseCsvPreview(text: string) {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      setPreviewRows([]);
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1, 11).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      return headers.reduce<Record<string, string>>((acc, header, index) => {
        acc[header] = values[index] ?? "";
        return acc;
      }, {});
    });
    setPreviewRows(rows);
  }

  function handleFileSelect(selected: File) {
    setFile(selected);
    setFileName(selected.name);
    if (selected.name.toLowerCase().endsWith(".csv")) {
      selected.text().then(parseCsvPreview).catch(() => setPreviewRows([]));
    } else {
      setPreviewRows([]);
    }
    onNotify("success", "File selected");
  }

  async function startImport() {
    if (!file) return;
    setImporting(true);
    try {
      const result = file.name.toLowerCase().endsWith(".xlsx")
        ? await contactService.importExcel(file)
        : await contactService.importCSV(file);
      onNotify("success", `Import complete: ${result.created} created, ${result.updated} updated`);
    } catch (err) {
      onNotify("error", err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <StepWizard steps={WIZARD_STEPS} currentStep={step} />

      {step === 1 ? (
        <section className="rounded-xl border bg-card p-8 shadow-sm">
          <div
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) handleFileSelect(dropped);
            }}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">Drag and drop your file here</p>
            <p className="mt-1 text-sm text-muted-foreground">Supported formats: CSV, XLSX (max 10MB)</p>
            {fileName ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                <FileSpreadsheet className="h-4 w-4" />
                {fileName}
                <button type="button" onClick={() => { setFile(null); setFileName(null); setPreviewRows([]); }}><X className="h-3 w-3" /></button>
              </div>
            ) : null}
            <label className="mt-4">
              <Button className="mt-4" variant="outline" asChild>
                <span>Select File</span>
              </Button>
              <input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleFileSelect(selected);
                }}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <Button disabled={!fileName} onClick={() => setStep(2)}>Continue</Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Map Columns</h3>
          <p className="mt-1 text-sm text-muted-foreground">Match your file columns to contact fields.</p>
          <div className="mt-4 space-y-3">
            {CSV_COLUMNS.map((col) => (
              <div key={col} className="flex items-center gap-4 rounded-lg border p-3">
                <span className="w-32 text-sm font-medium capitalize">{col}</span>
                <span className="text-muted-foreground">→</span>
                <select
                  className="h-9 flex-1 rounded-md border px-3 text-sm"
                  value={mapping[col] ?? ""}
                  onChange={(e) => setMapping({ ...mapping, [col]: e.target.value })}
                >
                  {IMPORT_FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value || "skip"} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => setStep(3)}>Continue</Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Preview</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {previewRows.length > 0 ? "First rows from your file." : "Upload a CSV file to preview rows."}
            </p>
            <div className="mt-4 overflow-x-auto">
              {previewRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No preview rows available.</p>
              ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    {Object.keys(previewRows[0] ?? {}).map((key) => (
                      <th key={key} className="p-3 font-medium capitalize">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Object.values(row).map((value, j) => (
                        <td key={j} className="p-3">{value || <span className="text-destructive">—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="text-xs text-muted-foreground">Total Rows</div>
              <div className="mt-1 text-2xl font-semibold">{validation.total}</div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="text-xs text-muted-foreground">Valid Rows</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-600">{validation.valid}</div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="text-xs text-muted-foreground">Invalid Rows</div>
              <div className="mt-1 text-2xl font-semibold text-red-600">{validation.invalid}</div>
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button disabled={importing} onClick={startImport}>
              {importing ? "Importing..." : "Start Import"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
