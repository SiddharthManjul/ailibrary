"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import type { RefCallback } from "react";

const useMeasuredEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface ContainerSize<T extends HTMLElement = HTMLDivElement> {
  ref: RefCallback<T>;
  width: number;
  height: number;
}

/** Measures the wrapper's border box. Zero is the SSR and detached state. */
export function useContainerSize<T extends HTMLElement = HTMLDivElement>(): ContainerSize<T> {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useCallback<RefCallback<T>>((node) => setElement(node), []);

  useMeasuredEffect(() => {
    if (!element) {
      setSize((previous) => previous.width === 0 && previous.height === 0
        ? previous
        : { width: 0, height: 0 });
      return;
    }
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setSize((previous) => previous.width === width && previous.height === height
        ? previous
        : { width, height });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element, { box: "border-box" });
    return () => observer.disconnect();
  }, [element]);

  return { ref, ...size };
}
