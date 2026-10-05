export const qualificationLimits = {
  name: 60,
  email: 200,
  company: 120,
  productUrl: 240,
  objective: 1000,
  messageBytes: 5000
} as const;

export const partnershipSource = 'rbx-engineering-partnership';

export interface QualificationInput {
  name: string;
  email: string;
  company: string;
  productUrl: string;
  stage: string;
  objective: string;
  timeframe: string;
  budget: string;
  commercialConsent: boolean;
  website: string;
}

interface OfferTerms {
  monthlyPriceBRL: number;
  monthlyHours: number;
  version: string;
}

export type QualificationError = 'required' | 'length' | 'url' | 'consent' | 'verification';

const stages = ['production', 'pilot', 'planning'] as const;
const timeframes = ['next-month', 'next-quarter', 'exploring'] as const;
const budgets = ['yes', 'review'] as const;
const byteLength = (value: string) => new TextEncoder().encode(value).byteLength;

/**
 * Comms accepts one plain-text message, not a separate qualification schema.
 * Keep the offer version and all answers together, without scoring or quoting
 * from the lead's budget. Go's contact handler caps strings by UTF-8 bytes.
 */
export function buildQualificationSubmission(
  input: QualificationInput,
  locale: 'pt-BR' | 'en',
  terms: OfferTerms,
  altcha: string | null,
  attribution: Record<string, string> = {}
) {
  const fields = {
    name: input.name.trim(),
    email: input.email.trim(),
    company: input.company.trim(),
    productUrl: input.productUrl.trim(),
    objective: input.objective.trim()
  };

  if (
    !fields.name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) ||
    !fields.company ||
    !fields.objective ||
    !stages.some((value) => value === input.stage) ||
    !timeframes.some((value) => value === input.timeframe) ||
    !budgets.some((value) => value === input.budget)
  ) {
    return { ok: false, error: 'required' as QualificationError } as const;
  }

  if (
    Object.entries(fields).some(
      ([field, value]) => value.length > qualificationLimits[field as keyof typeof fields]
    ) ||
    byteLength(fields.name) > 200 ||
    byteLength(fields.email) > 200
  ) {
    return { ok: false, error: 'length' as QualificationError } as const;
  }

  if (fields.productUrl) {
    try {
      const url = new URL(fields.productUrl);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
        return { ok: false, error: 'url' as QualificationError } as const;
      }
    } catch {
      return { ok: false, error: 'url' as QualificationError } as const;
    }
  }

  if (!input.commercialConsent) {
    return { ok: false, error: 'consent' as QualificationError } as const;
  }
  if (!altcha?.trim()) {
    return { ok: false, error: 'verification' as QualificationError } as const;
  }

  const message = [
    'RBX Engineering Partnership',
    `Offer version: ${terms.version}`,
    `Reference price: BRL ${terms.monthlyPriceBRL}/month`,
    `Reserved capacity: ${terms.monthlyHours} hours/month`,
    `Company / product: ${fields.company}`,
    `Public product URL: ${fields.productUrl || '(not provided)'}`,
    `Stage: ${input.stage}`,
    `Timeframe: ${input.timeframe}`,
    `Budget fit: ${input.budget === 'yes' ? 'reference price fits' : 'needs evaluation'}`,
    '',
    'Objective / need:',
    fields.objective,
    ...(Object.keys(attribution).length > 0
      ? [
          '',
          'Campaign context:',
          ...Object.entries(attribution).map(([key, value]) => `${key}: ${value}`)
        ]
      : [])
  ].join('\n');

  if (byteLength(message) > qualificationLimits.messageBytes) {
    return { ok: false, error: 'length' as QualificationError } as const;
  }

  return {
    ok: true,
    payload: {
      name: fields.name,
      email: fields.email,
      message,
      source: partnershipSource,
      language: locale === 'en' ? 'en' : 'pt',
      response_preference: 'email',
      whatsapp_opt_in: false,
      commercial_consent: true,
      altcha,
      website: input.website
    }
  } as const;
}
