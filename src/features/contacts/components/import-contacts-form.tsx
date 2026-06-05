"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { contactService } from "@/features/contacts/services/contact.service";
import type { ContactImportResult } from "@/types/contact";

interface ImportContactsFormProps {
  onImported: () => void;
}

export function ImportContactsForm({ onImported }: ImportContactsFormProps) {
  const [loading, setLoading] = useState<"csv" | "excel" | null>(null);
  const [result, setResult] = useState<ContactImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(type: "csv" | "excel", file: File) {
    setError(null);
    setResult(null);
    setLoading(type);
    try {
      const data =
        type === "csv"
          ? await contactService.importCSV(file)
          : await contactService.importExcel(file);
      setResult(data);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <h2 className="text-sm font-medium">Import contacts</h2>
        <p className="text-xs text-muted-foreground">
          Columns: name, phone, email, notes. Header row is optional.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <label>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport("csv", file);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" disabled={loading !== null} asChild>
            <span>{loading === "csv" ? "Importing CSV..." : "Import CSV"}</span>
          </Button>
        </label>
        <label>
          <input
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport("excel", file);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" size="sm" disabled={loading !== null} asChild>
            <span>{loading === "excel" ? "Importing Excel..." : "Import Excel"}</span>
          </Button>
        </label>
      </div>
      {result ? (
        <p className="text-sm text-muted-foreground">
          Created {result.created}, updated {result.updated}, skipped {result.skipped}.
        </p>
      ) : null}
      {result?.errors?.length ? (
        <ul className="text-xs text-destructive">
          {result.errors.slice(0, 5).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
