"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contactService } from "@/features/contacts/services/contact.service";
import type { Tag } from "@/types/tag";

interface AddContactFormProps {
  tags: Tag[];
  onCreated: () => void;
}

export function AddContactForm({ tags, onCreated }: AddContactFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(tagId: string) {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await contactService.create({
        contact_name: name.trim(),
        customer_name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        tag_ids: tagIds,
      });
      setName("");
      setPhone("");
      setEmail("");
      setNotes("");
      setTagIds([]);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create contact");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-medium">Add contact</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input id="contact-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="628123456789" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-notes">Notes</Label>
          <Input id="contact-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: tagIds.includes(tag.id) ? tag.color : "transparent",
                color: tagIds.includes(tag.id) ? "#fff" : tag.color,
                border: `1px solid ${tag.color}`,
              }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : null}

      <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Add contact"}</Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
