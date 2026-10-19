"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

const useCommittedEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface UseControllableStateOptions<T> {
  /** A defined value selects controlled mode. Undefined selects local state. */
  value?: T | undefined;
  defaultValue: T;
  onChange?: ((value: T) => void) | undefined;
}

/**
 * Local state survives temporary controlled mode. Defaults are read once.
 * Changes to props never emit onChange; equal requests are ignored.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: UseControllableStateOptions<T>): readonly [T, Dispatch<SetStateAction<T>>] {
  const [localValue, setLocalValue] = useState(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : localValue;
  const committed = useRef({ value: currentValue, controlled, onChange });

  useCommittedEffect(() => {
    committed.current = { value: currentValue, controlled, onChange };
  }, [currentValue, controlled, onChange]);

  const setValue = useCallback<Dispatch<SetStateAction<T>>>((update) => {
    const current = committed.current;
    const next = typeof update === "function"
      ? (update as (previous: T) => T)(current.value)
      : update;
    if (Object.is(current.value, next)) return;
    // Advance local requests synchronously so batched functional updates compose.
    // Controlled requests always derive from the last committed owner value.
    if (!current.controlled) {
      current.value = next;
      setLocalValue(next);
    }
    current.onChange?.(next);
  }, []);

  return [currentValue, setValue] as const;
}
