import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";

const meta: Meta = { title: "UI/Primitives" };
export default meta;
type Story = StoryObj;

export const Buttons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Primary</Button>
      <Button variant="outline">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="secondary">Muted</Button>
      <Button variant="destructive">Danger</Button>
      <Button disabled>Disabled</Button>
      <Button size="sm">Small</Button>
    </div>
  ),
};

export const FormFields: Story = {
  render: () => (
    <div className="grid max-w-sm gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Campaign name</Label>
        <Input id="name" placeholder="November promo" />
      </div>
      <div className="grid gap-1.5">
        <Label>Status</Label>
        <Select defaultValue="active">
          <SelectTrigger aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input disabled value="Read only" readOnly aria-label="Read only" />
    </div>
  ),
};

export const SelectOpen: Story = {
  render: () => (
    <div className="h-48 max-w-sm">
      <Select defaultValue="en" defaultOpen>
        <SelectTrigger aria-label="Language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="id">Indonesia</SelectItem>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="ms" disabled>
            Malay (soon)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const InPageTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="max-w-lg">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="recipients">Recipients</TabsTrigger>
        <TabsTrigger value="errors">Errors</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-sm text-muted-foreground">
        Delivery summary for this campaign.
      </TabsContent>
    </Tabs>
  ),
};

export const DialogOpen: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete segment?</DialogTitle>
          <DialogDescription>Contacts stay; only the saved rules are removed.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button variant="destructive">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const DropdownOpen: Story = {
  render: () => (
    <div className="flex h-40 justify-end">
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>
            <Pencil /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

export const TooltipHint: Story = {
  render: () => (
    <div className="pt-10">
      <Tooltip content="Rotating creates a new secret; the old one stops working.">
        <Button variant="outline">Rotate key</Button>
      </Tooltip>
    </div>
  ),
};

export const Skeletons: Story = {
  render: () => (
    <div className="max-w-md space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  ),
};
