import { useEffect, useSyncExternalStore } from "react";

/**
 * Lets a list page (Leads, Students) take over the search box in the top bar.
 *
 * Normally that box searches leads, students and applications and shows a drop-down of matches. On a
 * list page that is the wrong thing: the person is already looking at the table, so the box should
 * narrow the table itself, live, as they type. A page registers while it is on screen; the top bar
 * sees the registration, shows the page's placeholder and writes what is typed into [value], and the
 * page filters its rows with it. Leaving the page unregisters and clears the text.
 */
type PageSearchState = { placeholder: string | null; value: string };

let state: PageSearchState = { placeholder: null, value: "" };
const listeners = new Set<() => void>();

function setState(next: PageSearchState) {
  if (next.placeholder === state.placeholder && next.value === state.value) return;
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const pageSearch = {
  setValue(value: string) {
    setState({ ...state, value });
  },
  /** Returns the function that unregisters. */
  register(placeholder: string) {
    setState({ placeholder, value: "" });
    return () => setState({ placeholder: null, value: "" });
  },
};

export function usePageSearchState() {
  return useSyncExternalStore(subscribe, () => state);
}

/** For a list page: registers its search and returns the text currently typed into it. */
export function useRegisterPageSearch(placeholder: string) {
  useEffect(() => pageSearch.register(placeholder), [placeholder]);
  return usePageSearchState().value;
}
