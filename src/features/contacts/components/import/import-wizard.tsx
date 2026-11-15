"use client";

import Link from "next/link";
import { useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";

import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/shared/data-table";
import { ErrorState } from "@/components/shared/empty-state";
import { FilterSelect } from "@/components/shared/filter-bar";
import { StepWizard } from "@/components/shared/step-wizard";
import { Button } from "@/components/ui/button";
import { IMPORT_FIELD_OPTIONS } from "@/features/contacts/constants/import";
import { contactService } from "@/features/contacts/services/contact.service";
import { guessImportField, previewCsv } from "@/features/contacts/utils/import-csv";
import { formatApiErrorMessage } from "@/services/api/errors";
import type { ContactImportResult } from "@/types/contact";

const WIZARD_STEPS = [
  { id: 1, label: "Upload File" },
  { id: 2, label: "Map Columns" },
  { id: 3, label: "Preview & Import" },
];

const MAX_BYTES = 10 * 1024 * 1024;

type CsvPreview = ReturnType<typeof previewCsv>;

export function ImportWizard({ onNotify }: { onNotify: (type: "success" | "error", message: string) => void }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  // CSV only: the browser cannot read .xlsx, so Excel files rely on the server's header matching.
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ContactImportResult | null>(null);

  const isExcel = Boolean(file?.name.toLowerCase().endsWith(".xlsx"));
  const phoneColumn = Object.entries(mapping).find(([, field]) => field === "phone")?.[0];
  const mappedColumns = preview?.headers.filter((header) => mapping[header]) ?? [];

  function clearFile() {
    setFile(null);
    setPreview(null);
    setMapping({});
    setResult(null);
    setImportError(null);
  }

  function handleFileSelect(selected: File) {
    clearFile();
    setFileError(null);
    const name = selected.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".xlsx")) {
      setFileError("Choose a .csv or .xlsx file.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setFileError("File is larger than 10 MB.");
      return;
    }
    setFile(selected);
    if (name.endsWith(".csv")) {
      selected
        .text()
        .then((text) => {
          const next = previewCsv(text);
          setPreview(next);
          setMapping(Object.fromEntries(next.headers.map((header) => [header, guessImportField(header)])));
        })
        .catch(() => setFileError("Could not read the file."));
    }
  }

  async function startImport() {
    if (!file) return;
    setImporting(true);
    setImportError(null);
    try {
      const imported = await contactService.importFile(file, isExcel ? undefined : mapping);
      setResult(imported);
      onNotify("success", `Import finished: ${imported.created} created, ${imported.updated} updated`);
    } catch (err) {
      setImportError(formatApiErrorMessage(err));
    } finally {
      setImporting(false);
    }
  }

  if (result) {
    return <ImportResultReport result={result} onImportAnother={() => { clearFile(); setStep(1); }} />;
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
            <p className="mt-1 text-sm text-muted-foreground">CSV or XLSX, up to 10 MB and 5,000 rows</p>
            {file ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
                <button type="button" onClick={clearFile} aria-label="Remove file">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null}
            <label className="mt-4">
              <Button variant="outline" asChild>
                <span>Select File</span>
              </Button>
              <input
                type="file"
                accept=".csv,.xlsx"
                aria-label="Contacts file"
                className="sr-only"
                onChange={(e) => {
                  const selected = e.target.files?.[0];
                  if (selected) handleFileSelect(selected);
                  e.target.value = "";
                }}
              />
            </label>
            {fileError ? (
              <p role="alert" className="mt-3 text-sm text-error-foreground">
                {fileError}
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex justify-end">
            <Button disabled={!file} onClick={() => setStep(isExcel ? 3 : 2)}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 && preview ? (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Map Columns</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Match each column in your file to a contact field. Rows are matched to existing contacts by phone number.
          </p>
          <div className="mt-4 space-y-3">
            {preview.headers.map((header) => (
              <div key={header} className="flex items-center gap-4 rounded-lg border p-3">
                <span className="w-40 truncate text-sm font-medium" title={header}>
                  {header || "(no header)"}
                </span>
                <span className="text-muted-foreground" aria-hidden>
                  →
                </span>
                <FilterSelect
                  label={`Field for column ${header}`}
                  value={mapping[header] ?? ""}
                  onChange={(value) => setMapping({ ...mapping, [header]: value })}
                  options={IMPORT_FIELD_OPTIONS}
                  className="h-9 flex-1"
                />
              </div>
            ))}
          </div>
          {!phoneColumn ? (
            <p role="alert" className="mt-3 text-sm text-error-foreground">
              Map one column to Phone Number to continue.
            </p>
          ) : null}
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button disabled={!phoneColumn} onClick={() => setStep(3)}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Preview</h3>
            {isExcel ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Excel files are matched by header names (name, phone, email, city, company, notes). A sheet without
                headers is read as name, phone, email, notes.
              </p>
            ) : preview && preview.rows.length > 0 ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  First {preview.rows.length} of {preview.totalRows} rows, as they will be imported.
                </p>
                <DataTable className="mt-4">
                  <DataTableHead>
                    <DataTableRow>
                      {mappedColumns.map((header) => (
                        <DataTableHeaderCell key={header}>
                          {IMPORT_FIELD_OPTIONS.find((o) => o.value === mapping[header])?.label}
                        </DataTableHeaderCell>
                      ))}
                    </DataTableRow>
                  </DataTableHead>
                  <DataTableBody>
                    {preview.rows.map((row, i) => (
                      <DataTableRow key={i}>
                        {mappedColumns.map((header) => {
                          const value = row[preview.headers.indexOf(header)] ?? "";
                          return (
                            <DataTableCell key={header}>
                              {value || <span className="text-muted-foreground">—</span>}
                            </DataTableCell>
                          );
                        })}
                      </DataTableRow>
                    ))}
                  </DataTableBody>
                </DataTable>
              </>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">The file has no data rows.</p>
            )}
          </div>

          {importing ? (
            <div role="status" aria-live="polite" className="rounded-xl border bg-card p-4 text-sm shadow-sm">
              <p className="font-medium">
                Importing{preview ? ` ${preview.totalRows.toLocaleString()} rows` : ""}… keep this page open.
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
              </div>
            </div>
          ) : null}
          {importError ? <ErrorState message={importError} onRetry={() => void startImport()} className="p-6" /> : null}

          <div className="flex justify-between">
            <Button variant="outline" disabled={importing} onClick={() => setStep(isExcel ? 1 : 2)}>
              Back
            </Button>
            <Button disabled={importing || (!isExcel && !preview?.totalRows)} onClick={() => void startImport()}>
              {importing ? "Importing..." : "Start Import"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ImportResultReport({
  result,
  onImportAnother,
}: {
  result: ContactImportResult;
  onImportAnother: () => void;
}) {
  const errors = result.errors ?? [];
  return (
    <section className="space-y-4" aria-label="Import result">
      <div className="grid gap-4 sm:grid-cols-3">
        <ResultStat label="Created" value={result.created} className="text-success-foreground" />
        <ResultStat label="Updated" value={result.updated} />
        <ResultStat label="Skipped" value={result.skipped} className={result.skipped ? "text-error-foreground" : ""} />
      </div>
      {errors.length > 0 ? (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="font-semibold">Skipped rows</h3>
          <p className="mt-1 text-sm text-muted-foreground">Fix these lines in your file and import it again.</p>
          <DataTable className="mt-4">
            <DataTableHead>
              <DataTableRow>
                <DataTableHeaderCell>Line</DataTableHeaderCell>
                <DataTableHeaderCell>Reason</DataTableHeaderCell>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {errors.map((error) => (
                <DataTableRow key={`${error.line}-${error.message}`}>
                  <DataTableCell className="tabular-nums">{error.line}</DataTableCell>
                  <DataTableCell>{error.message}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onImportAnother}>
          Import another file
        </Button>
        <Button asChild>
          <Link href="/contacts">View contacts</Link>
        </Button>
      </div>
    </section>
  );
}

function ResultStat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${className ?? ""}`}>{value.toLocaleString()}</div>
    </div>
  );
}
