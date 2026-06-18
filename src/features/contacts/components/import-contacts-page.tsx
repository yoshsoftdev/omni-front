"use client";

import { ContactsNav } from "@/features/contacts/components/contacts-nav";
import { ImportWizard } from "@/features/contacts/components/import/import-wizard";
import { useToast } from "@/hooks/use-toast";

export function ImportContactsPage() {
  const { notify, Toast } = useToast();

  return (
    <div className="space-y-6">
      <Toast />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">Manage your contact database, segments, and tags.</p>
      </div>
      <ContactsNav />
      <div>
        <h2 className="text-lg font-semibold">Import Contacts</h2>
        <p className="text-sm text-muted-foreground">Upload a CSV or XLSX file to import contacts.</p>
      </div>
      <ImportWizard onNotify={notify} />
    </div>
  );
}
