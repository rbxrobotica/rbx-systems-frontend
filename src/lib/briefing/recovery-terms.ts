export type RecoveredOrder = {
  reused?: boolean;
  status?: string;
  plan_id?: string;
  currency?: string;
  payment_method?: string;
  billing_cycle?: string;
  amount?: number;
  seats?: number;
  checkout_url?: string;
};

export type RecoveryPlan = {
  id: string;
  currency: string;
  billing: string;
  audience: string;
};

/** Parse only complete original terms before an explicit buyer confirmation. */
export function originalRecoveredPaymentURL(
  data: RecoveredOrder,
  plan: RecoveryPlan,
  method: string,
  minTeamSeats: number,
  maxTeamSeats: number
): string | null {
  if (
    !data.reused ||
    data.status !== 'pending' ||
    data.plan_id !== plan.id ||
    data.currency !== plan.currency ||
    data.payment_method !== method ||
    data.billing_cycle !== (plan.billing === 'monthly' ? 'MONTHLY' : 'YEARLY') ||
    !Number.isSafeInteger(data.amount) ||
    (data.amount ?? 0) <= 0 ||
    !Number.isSafeInteger(data.seats) ||
    (plan.audience === 'team'
      ? (data.seats ?? 0) < minTeamSeats || (data.seats ?? 0) > maxTeamSeats
      : data.seats !== 1) ||
    !data.checkout_url
  ) {
    return null;
  }
  try {
    const url = new URL(data.checkout_url);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}
