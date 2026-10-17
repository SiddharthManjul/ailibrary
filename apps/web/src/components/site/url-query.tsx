"use client";

import { Suspense, useLayoutEffect } from "react";
import { useSearchParams } from "next/navigation";

function QueryObserver({ onChange }: { onChange: (query: string) => void }) {
  const query = useSearchParams().toString();

  useLayoutEffect(() => { onChange(query); }, [onChange, query]);

  return null;
}

export function URLQuery({ onChange }: { onChange: (query: string) => void }) {
  return <Suspense fallback={null}><QueryObserver onChange={onChange} /></Suspense>;
}
