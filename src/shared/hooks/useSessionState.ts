import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const PREFIX = "vutrak.view.";

/**
 * useState that survives leaving the page and coming back in the same browser tab.
 *
 * For list filters and paging: open a lead from a filtered list, come back, and the list is
 * still filtered. Kept in sessionStorage, so it is per tab and gone when the tab closes,
 * and cleared on logout so the next person to sign in does not inherit it. Storage that
 * throws (private mode, blocked site data) just means the state is not remembered.
 */
export function useSessionState<T>(
  key: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.sessionStorage.getItem(PREFIX + key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // Fall through to the initial value.
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Not remembered; the page still works.
    }
  }, [key, value]);

  return [value, setValue];
}

/** Forgets every remembered view, e.g. on logout. */
export function clearSessionState() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const k = window.sessionStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // Nothing to clear.
  }
}
