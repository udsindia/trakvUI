/**
 * Tuition currencies the course form offers, with an approximate rupee rate for each.
 *
 * The rate only places a course on the tuition slider (lakhs of rupees) and in the
 * "≈ ₹ x lakh" hint; the course keeps its own currency and amount, so a stale rate moves a
 * course a little along the slider and never changes a price anyone reads.
 *
 * Mirrors TuitionCurrencies.INR_RATE on the server, which filters by the same numbers:
 * keep the two in step, or the slider will drop courses whose printed price is in range.
 */
export const TUITION_CURRENCIES: ReadonlyArray<{ code: string; name: string; inrRate: number }> = [
  { code: "GBP", name: "British pound", inrRate: 105 },
  { code: "EUR", name: "Euro", inrRate: 90 },
  { code: "USD", name: "US dollar", inrRate: 83 },
  { code: "AUD", name: "Australian dollar", inrRate: 55 },
  { code: "CAD", name: "Canadian dollar", inrRate: 60 },
  { code: "NZD", name: "New Zealand dollar", inrRate: 50 },
  { code: "CHF", name: "Swiss franc", inrRate: 98 },
  { code: "SEK", name: "Swedish krona", inrRate: 8 },
  { code: "DKK", name: "Danish krone", inrRate: 12 },
  { code: "NOK", name: "Norwegian krone", inrRate: 8 },
  { code: "PLN", name: "Polish złoty", inrRate: 21 },
  { code: "CZK", name: "Czech koruna", inrRate: 3.6 },
  { code: "HUF", name: "Hungarian forint", inrRate: 0.23 },
  { code: "SGD", name: "Singapore dollar", inrRate: 62 },
  { code: "MYR", name: "Malaysian ringgit", inrRate: 18 },
  { code: "HKD", name: "Hong Kong dollar", inrRate: 10.6 },
  { code: "CNY", name: "Chinese yuan", inrRate: 11.5 },
  { code: "JPY", name: "Japanese yen", inrRate: 0.55 },
  { code: "KRW", name: "South Korean won", inrRate: 0.06 },
  { code: "AED", name: "UAE dirham", inrRate: 23 },
  { code: "INR", name: "Indian rupee", inrRate: 1 },
];

/** The rate used for a currency this table does not know (matches the server). */
export const FALLBACK_INR_RATE = 80;

const RATE_BY_CODE: Record<string, number> = Object.fromEntries(
  TUITION_CURRENCIES.map((c) => [c.code, c.inrRate]),
);

export function inrRateFor(currency: string | null | undefined): number {
  return RATE_BY_CODE[(currency ?? "GBP").toUpperCase()] ?? FALLBACK_INR_RATE;
}
