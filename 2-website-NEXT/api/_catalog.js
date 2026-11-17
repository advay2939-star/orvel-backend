/* ═══════════════════════════════════════════════════════════════
   Orvel — the catalogue.

   ONE definition of what Orvel sells. Every server route imports
   from here. If a price changes, it changes here and nowhere else.

   The page (index.html) shows prices for display only; the server
   never trusts them. If the two ever disagree, this file wins and
   create-order logs the mismatch.

   PRICES ARE PER CURRENCY, in that currency's minor unit — cents
   for USD, paise for INR. Razorpay reads `amount` as minor units
   of whatever `currency` says, so a single number cannot serve
   both: 9900 is $99.00 and also ₹99.00.

   A null means "not sold in this currency yet". Routes must fail
   closed on null. Never convert with a hardcoded rate and never
   fall back to another currency's figure.
═══════════════════════════════════════════════════════════════ */

export const CATALOG = {
  sleep: {
    name:   'Sleep',
    tracks: 2,
    amounts: { USD: 6900, INR: null },
    includes: ['Wind-down', 'Sleep'],
  },
  full: {
    name:   'Full Day',
    tracks: 4,
    amounts: { USD: 9900, INR: null },
    includes: ['Morning', 'Focus', 'Wind-down', 'Sleep'],
  },
  complete: {
    name:   'Complete',
    tracks: 5,
    amounts: { USD: 14900, INR: null },
    includes: ['Morning', 'Focus', 'Afternoon Reset', 'Wind-down', 'Sleep'],
  },
};

export const SUBSCRIPTION = {
  name:      'Orvel Refresh',
  amounts:   { USD: 1500, INR: null },
  trialDays: 30,
};

export const CURRENCIES = new Set(['USD', 'INR']);

export const DEFAULT_CURRENCY = 'USD';

export const isPackage  = id => Object.prototype.hasOwnProperty.call(CATALOG, id);
export const planName   = id => CATALOG[id]?.name   ?? id;
export const trackCount = id => CATALOG[id]?.tracks ?? null;

/* Authoritative amount, or null if this package isn't priced in
   this currency. Callers must treat null as a hard stop. */
export function amountFor(packageId, currency) {
  const plan = CATALOG[packageId];
  if (!plan) return null;
  const amt = plan.amounts?.[currency];
  return Number.isFinite(amt) && amt > 0 ? amt : null;
}
