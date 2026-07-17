import { describe, expect, it } from "vitest";

import { normalizeContact } from "@/features/contacts/mappers/contact.mapper";
import { contactProviderKinds } from "@/features/contacts/utils/contact-identity";

describe("normalizeContact linked contacts", () => {
  it("normalizes bidirectional link summaries from the API", () => {
    const contact = normalizeContact({
      id: "contact-a",
      contact_name: "Contact A",
      customer_name: "Contact A",
      phone: "+621111111",
      source: "manual",
      marketing_status: "unknown",
      tags: [],
      custom_fields: [],
      created_at: "2026-07-15T00:00:00Z",
      updated_at: "2026-07-15T00:00:00Z",
      conversations_count: 0,
      linked_contacts: [{
        link_id: "link-ab",
        id: "contact-b",
        contact_name: "Contact B",
        customer_name: "Contact B",
        phone: "+622222222",
        provider_kinds: ["whatsapp", "instagram"],
        linked_at: "2026-07-15T01:00:00Z",
      }],
    });

    expect(contact.linked_contacts).toEqual([{
      link_id: "link-ab",
      id: "contact-b",
      contact_name: "Contact B",
      customer_name: "Contact B",
      phone: "+622222222",
      email: undefined,
      avatar_url: undefined,
      provider_kinds: ["whatsapp", "instagram"],
      linked_at: "2026-07-15T01:00:00Z",
    }]);
  });

  it("defaults missing linked contacts to an empty list", () => {
    const contact = normalizeContact({
      id: "contact-a",
      contact_name: "Contact A",
      customer_name: "Contact A",
    });

    expect(contact.linked_contacts).toEqual([]);
  });

  it("keeps linked-contact channels out of the current contact badges", () => {
    const contact = normalizeContact({
      id: "contact-a",
      contact_name: "Contact A",
      customer_name: "Contact A",
      providers: [
        {
          id: "wa",
          contact_id: "contact-a",
          provider: "whatsapp",
          provider_user_id: "wa-user",
          connected_at: "2026-07-15T00:00:00Z",
          status: "active",
          is_source_of_truth: true,
        },
        {
          id: "ig",
          contact_id: "contact-b",
          provider: "instagram",
          provider_user_id: "ig-user",
          connected_at: "2026-07-15T00:00:00Z",
          status: "active",
          is_source_of_truth: false,
        },
      ],
      linked_contacts: [{
        link_id: "link-ab",
        id: "contact-b",
        contact_name: "Contact B",
        customer_name: "Contact B",
        phone: "",
        provider_kinds: ["whatsapp", "instagram"],
        linked_at: "2026-07-15T01:00:00Z",
      }],
    });

    expect(contactProviderKinds(contact)).toEqual(["whatsapp"]);
  });
});
