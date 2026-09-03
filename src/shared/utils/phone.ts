/**
 * Splitting a typed phone number into dial code + local number.
 *
 * The old implementation used /^(\+\d{1,3})(.+)$/, which is greedy: "+918012380123"
 * matched "+918" and left "012380123". Every Indian number typed without a space lost
 * its leading digit to the country code, and because the edit form re-joins the two
 * halves into one string, simply re-saving a correct lead corrupted it.
 *
 * Dial codes are not a fixed width (1-4 digits) and no arithmetic rule separates them,
 * so the only correct approach is a longest-prefix match against the real list.
 */

/**
 * ITU dial codes, longest first so the prefix match never stops at a shorter code that
 * happens to be a prefix of the right one (e.g. +1 vs +1246, +7 vs +7940).
 */
const DIAL_CODES: readonly string[] = [
  // 4-digit
  "1242", "1246", "1264", "1268", "1284", "1340", "1345", "1441", "1473", "1649",
  "1664", "1670", "1671", "1684", "1721", "1758", "1767", "1784", "1809", "1829",
  "1849", "1868", "1869", "1876", "1939",
  // 3-digit
  "212", "213", "216", "218", "220", "221", "222", "223", "224", "225", "226", "227",
  "228", "229", "230", "231", "232", "233", "234", "235", "236", "237", "238", "239",
  "240", "241", "242", "243", "244", "245", "246", "248", "249", "250", "251", "252",
  "253", "254", "255", "256", "257", "258", "260", "261", "262", "263", "264", "265",
  "266", "267", "268", "269", "290", "291", "297", "298", "299", "350", "351", "352",
  "353", "354", "355", "356", "357", "358", "359", "370", "371", "372", "373", "374",
  "375", "376", "377", "378", "380", "381", "382", "383", "385", "386", "387", "389",
  "420", "421", "423", "500", "501", "502", "503", "504", "505", "506", "507", "508",
  "509", "590", "591", "592", "593", "594", "595", "596", "597", "598", "599", "670",
  "672", "673", "674", "675", "676", "677", "678", "679", "680", "681", "682", "683",
  "685", "686", "687", "688", "689", "690", "691", "692", "850", "852", "853", "855",
  "856", "880", "886", "960", "961", "962", "963", "964", "965", "966", "967", "968",
  "970", "971", "972", "973", "974", "975", "976", "977", "992", "993", "994", "995",
  "996", "998",
  // 2-digit
  "20", "27", "30", "31", "32", "33", "34", "36", "39", "40", "41", "43", "44", "45",
  "46", "47", "48", "49", "51", "52", "53", "54", "55", "56", "57", "58", "60", "61",
  "62", "63", "64", "65", "66", "81", "82", "84", "86", "90", "91", "92", "93", "94",
  "95", "98",
  // 1-digit
  "1", "7",
].sort((left, right) => right.length - left.length);

/** Used when a number carries no "+" prefix and no code can be inferred. */
export const DEFAULT_DIAL_CODE = "+91";

export type SplitPhone = {
  /** Always "+"-prefixed, e.g. "+91". */
  countryCode: string;
  /** Digits only, no country code. */
  phoneNo: string;
};

/**
 * Splits a typed number into its dial code and local part.
 *
 * - "+918012380123" / "+91 80123 80123" / "+91-8012380123" → { "+91", "8012380123" }
 * - "08012380123" (no code) → { DEFAULT_DIAL_CODE, "08012380123" }
 *
 * With a leading "+" the dial code is matched against the real code list, longest first.
 * A "+" number whose prefix matches nothing keeps everything as the local number rather
 * than inventing a code, so no digit is ever silently swallowed.
 */
export function splitPhoneNumber(
  raw: string,
  defaultCountryCode: string = DEFAULT_DIAL_CODE,
): SplitPhone {
  const trimmed = (raw ?? "").trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return { countryCode: defaultCountryCode, phoneNo: "" };
  }

  if (!hasPlus) {
    return { countryCode: defaultCountryCode, phoneNo: digits };
  }

  const code = DIAL_CODES.find(
    // The local part must survive the split — a code that consumes the whole number is
    // not a code, it is the number.
    (candidate) => digits.startsWith(candidate) && digits.length > candidate.length,
  );

  return code
    ? { countryCode: `+${code}`, phoneNo: digits.slice(code.length) }
    : { countryCode: defaultCountryCode, phoneNo: digits };
}

/** "+91" + "8012380123" → "+91 8012380123". Blank parts are dropped. */
export function joinPhoneNumber(
  countryCode: string | null | undefined,
  phoneNo: string | null | undefined,
): string {
  return [countryCode?.trim(), phoneNo?.trim()].filter(Boolean).join(" ");
}
