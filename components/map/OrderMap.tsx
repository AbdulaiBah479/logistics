"use client";

import dynamic from "next/dynamic";
import type { LeafletMapProps } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] w-full items-center justify-center rounded-xl bg-zinc-100 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
      Loading map…
    </div>
  ),
});

export function OrderMap(props: LeafletMapProps) {
  return <LeafletMap {...props} />;
}
