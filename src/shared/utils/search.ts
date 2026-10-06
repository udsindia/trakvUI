const DIGITS_ONLY = /\D/g;

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Whether a table row matches what the user typed in its search box.
 *
 * The box matches against every column the row shows, not just the name, and works the way people type:
 *  - words can come in any order ("smith john" finds "John Smith"), and every word must match something;
 *  - a number matches a phone however it is written ("98765 43210", "+91-98765-43210" and "9876543210" all find
 *    "+919876543210"), once at least three digits are typed.
 */
export function matchesSearch(query: string, fields: ReadonlyArray<string | number | null | undefined>) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  const texts = fields
    .filter((field): field is string | number => field !== null && field !== undefined && field !== "")
    .map((field) => normalize(String(field)));
  const haystack = texts.join(" | ");
  const digitHaystack = texts.map((text) => text.replace(DIGITS_ONLY, "")).filter(Boolean);

  const wholeQueryDigits = normalizedQuery.replace(DIGITS_ONLY, "");
  const isPhoneLike = wholeQueryDigits.length >= 3 && /^[\d\s+()\-.]+$/.test(normalizedQuery);
  if (isPhoneLike && digitHaystack.some((digits) => digits.includes(wholeQueryDigits))) {
    return true;
  }

  return normalizedQuery.split(" ").every((word) => {
    if (haystack.includes(word)) return true;
    const wordDigits = word.replace(DIGITS_ONLY, "");
    return wordDigits.length >= 3 && /^[\d+()\-.]+$/.test(word) && digitHaystack.some((digits) => digits.includes(wordDigits));
  });
}
