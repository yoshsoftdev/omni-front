"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import { FilterBar, FilterSelect } from "@/components/shared/filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONTACT_SOURCES } from "@/features/contacts/mock-data";
import type { ContactTag } from "@/types/contact";

export function ContactFilterBar({
  search,
  onSearchChange,
  sourceFilter,
  onSourceChange,
  tagFilter,
  onTagChange,
  tags,
  onMoreFilters,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  sourceFilter: string;
  onSourceChange: (value: string) => void;
  tagFilter: string;
  onTagChange: (value: string) => void;
  tags: ContactTag[];
  onMoreFilters: () => void;
}) {
  return (
    <FilterBar>
      <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <FilterSelect
        label="Source"
        value={sourceFilter}
        onChange={onSourceChange}
        options={CONTACT_SOURCES}
      />
      <FilterSelect
        label="Tags"
        value={tagFilter}
        onChange={onTagChange}
        options={[{ value: "", label: "All Tags" }, ...tags.map((t) => ({ value: t.id, label: t.name }))]}
      />
      <Button variant="outline" onClick={onMoreFilters}>
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        More Filters
      </Button>
    </FilterBar>
  );
}
