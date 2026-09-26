import { useCallback, useEffect, useRef, useState } from "react";

const MIN_WIDTH = 220;
const MAX_WIDTH = 620;
const DEFAULT_WIDTH = 290;
const STEP = 24;
const STORAGE_KEY = "universities-browse:list-width";

function clamp(width: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)));
}

function readStoredWidth() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_WIDTH;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? clamp(parsed) : DEFAULT_WIDTH;
  } catch {
    // Private windows and blocked site data throw on access rather than returning null.
    return DEFAULT_WIDTH;
  }
}

/**
 * Width of a drag-resizable column, remembered per browser.
 *
 * Returns props to spread onto the divider itself: pointer drag for the mouse, arrow keys
 * for the keyboard, and double-click to go back to the default. The width is only written
 * to storage when a drag ends, so a drag costs one write rather than one per frame.
 */
export function useResizableColumn() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const widthRef = useRef(width);

  // Read after mount rather than in the initial state, so the first render matches on a
  // server-rendered or pre-hydrated pass and no layout jump is queued behind it.
  useEffect(() => {
    const stored = readStoredWidth();
    widthRef.current = stored;
    setWidth(stored);
  }, []);

  const persist = useCallback((next: number) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Nothing to do — the width still applies for this session.
    }
  }, []);

  const apply = useCallback((next: number) => {
    const clamped = clamp(next);
    widthRef.current = clamped;
    setWidth(clamped);
    return clamped;
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Ignore anything but a primary-button drag, so a right-click cannot strand the
      // move listener with no matching pointerup.
      if (event.button !== 0) return;
      event.preventDefault();

      const startX = event.clientX;
      const startWidth = widthRef.current;
      setIsDragging(true);

      const onMove = (moveEvent: PointerEvent) => {
        apply(startWidth + moveEvent.clientX - startX);
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        setIsDragging(false);
        persist(widthRef.current);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
      window.addEventListener("pointercancel", onUp, { once: true });
    },
    [apply, persist],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      persist(apply(widthRef.current + (event.key === "ArrowRight" ? STEP : -STEP)));
    },
    [apply, persist],
  );

  const handleDoubleClick = useCallback(() => {
    persist(apply(DEFAULT_WIDTH));
  }, [apply, persist]);

  return {
    width,
    isDragging,
    resizeHandleProps: {
      "aria-label": "Resize the institution list",
      "aria-orientation": "vertical" as const,
      "aria-valuemax": MAX_WIDTH,
      "aria-valuemin": MIN_WIDTH,
      "aria-valuenow": width,
      role: "separator",
      tabIndex: 0,
      onDoubleClick: handleDoubleClick,
      onKeyDown: handleKeyDown,
      onPointerDown: handlePointerDown,
    },
  };
}
