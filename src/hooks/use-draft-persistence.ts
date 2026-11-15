"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UseFormReturn } from "react-hook-form";
import { documentSchema, type InvoiceDocument } from "@/types/domain";
import { saveDocument } from "@/lib/db";
import { useUI } from "@/stores/ui";

/** Serializes writes, ignores stale save indicators, and flushes on internal navigation. */
export function useDraftPersistence(
  form: UseFormReturn<InvoiceDocument>,
  doc: InvoiceDocument,
  initial: InvoiceDocument
) {
  const [saveState, setSaveState] = useState("Saved locally");
  const saved = useRef(JSON.stringify(initial));
  const savedStamp = useRef(initial.updatedAt);
  const queue = useRef(Promise.resolve());
  const router = useRouter();
  const write = useCallback(
    (value: InvoiceDocument) => {
      const data = structuredClone(value);
      const snapshot = JSON.stringify(data);
      const operation = queue.current
        .catch(() => {})
        .then(async () => {
          const stamp = new Date(
            Math.max(Date.now(), Date.parse(savedStamp.current) + 1)
          ).toISOString();
          await saveDocument({ ...data, updatedAt: stamp }, savedStamp.current);
          savedStamp.current = stamp;
          saved.current = snapshot;
          if (JSON.stringify(form.getValues()) === snapshot)
            setSaveState("Saved locally");
        });
      queue.current = operation;
      return operation;
    },
    [form]
  );
  useEffect(() => {
    if (JSON.stringify(doc) === saved.current) return;
    setSaveState("Saving…");
    const timer = setTimeout(() => {
      if (!documentSchema.safeParse(doc).success) {
        setSaveState("Fix invalid fields to save");
        return;
      }
      void write(doc).catch((error) =>
        setSaveState(error instanceof Error ? error.message : "Save failed")
      );
    }, 650);
    return () => clearTimeout(timer);
  }, [doc, write]);
  const persist = useCallback(async () => {
    if (!(await form.trigger())) {
      useUI.getState().toast("Check the highlighted fields before saving.");
      return false;
    }
    try {
      await write(form.getValues());
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Save failed";
      setSaveState(message);
      useUI.getState().toast(message);
      return false;
    }
  }, [form, write]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(form.getValues()) !== saved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const navigate = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0
      )
        return;
      const anchor = (e.target as Element).closest?.("a");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      )
        return;
      const url = new URL(anchor.href, window.location.href);
      if (
        url.origin !== location.origin ||
        JSON.stringify(form.getValues()) === saved.current
      )
        return;
      e.preventDefault();
      void persist().then((ok) => {
        if (
          ok ||
          confirm(
            "Some changes cannot be saved. Leave and discard those changes?"
          )
        )
          router.push(url.pathname + url.search + url.hash);
      });
    };
    window.addEventListener("beforeunload", guard);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", guard);
      document.removeEventListener("click", navigate, true);
    };
  }, [form, persist, router]);
  useEffect(
    () => () => {
      const current = form.getValues();
      if (
        JSON.stringify(current) !== saved.current &&
        documentSchema.safeParse(current).success
      )
        void write(current).catch(() =>
          useUI
            .getState()
            .toast(
              "Your last changes could not be saved. Please reopen this document."
            )
        );
    },
    [form, write]
  );
  return { saveState, persist };
}
