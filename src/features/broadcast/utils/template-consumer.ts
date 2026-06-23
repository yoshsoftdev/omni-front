/**
 * Validates that Template domain satisfies campaign consumer needs.
 * Uses templateQueryService — never imports mock data directly.
 */
import { toTemplateListItem, toWhatsAppTemplateMock } from "@/features/broadcast/mock/template-legacy-adapters";
import { templateQueryService } from "@/features/broadcast/services/template-query.service";
import type { Template } from "@/features/broadcast/types/template";

/** Campaign wizard: list picker + full template for variable mapping / preview */
export type CampaignWizardTemplateList = ReturnType<typeof toTemplateListItem>;
export type CampaignWizardTemplateDetail = ReturnType<typeof toWhatsAppTemplateMock>;

export function adaptTemplateForCampaignWizardList(template: Template): CampaignWizardTemplateList {
  return toTemplateListItem(template);
}

export function adaptTemplateForCampaignWizardDetail(template: Template): CampaignWizardTemplateDetail {
  return toWhatsAppTemplateMock(template);
}

/** Campaign card: list row + optional full preview */
export type CampaignCardTemplate = CampaignWizardTemplateList;
export type CampaignCardTemplatePreview = CampaignWizardTemplateDetail;

export function adaptTemplateForCampaignCard(template: Template): {
  list: CampaignCardTemplate;
  detail: CampaignCardTemplatePreview;
} {
  return {
    list: toTemplateListItem(template),
    detail: toWhatsAppTemplateMock(template),
  };
}

/** Campaign detail: resolve template by campaign.template_id */
export async function resolveTemplateForCampaignDetail(
  templateId: string,
  templateName?: string,
): Promise<Template | undefined> {
  const byId = await templateQueryService.getTemplateById(templateId);
  if (byId) return byId;
  if (templateName) {
    return templateQueryService.getTemplateByName(templateName);
  }
  return undefined;
}

export async function validateTemplateConsumers(): Promise<void> {
  const templates = await templateQueryService.getTemplates();
  templates.forEach((template) => {
    adaptTemplateForCampaignWizardList(template);
    adaptTemplateForCampaignWizardDetail(template);
    adaptTemplateForCampaignCard(template);
    if (!template.preview.trim()) {
      throw new Error(`Template ${template.id} is missing preview data`);
    }
  });
}
