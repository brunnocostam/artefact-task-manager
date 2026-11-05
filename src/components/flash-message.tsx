"use client";

import { useEffect } from "react";

export type Flash = { type: "success" | "error"; text: string };

export function FlashMessage({ flash, onDismiss }: { flash: Flash | null; onDismiss: () => void }) {
  useEffect(() => {
    if (flash?.type !== "success") return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [flash, onDismiss]);

  if (!flash) return null;

  const styles =
    flash.type === "success"
      ? "border-green-300 bg-green-50 text-green-800"
      : "border-red-300 bg-red-50 text-red-800";

  return (
    <div role={flash.type === "error" ? "alert" : "status"} className={`mb-4 flex items-start justify-between gap-4 rounded border px-4 py-3 text-sm ${styles}`}>
      <span>{flash.text}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss message" className="font-bold">
        ×
      </button>
    </div>
  );
}
