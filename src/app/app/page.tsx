import { Suspense } from "react";
import Editor from "@/components/documents/editor";
export default function Page() {
  return (
    <Suspense fallback={<p>Opening workspace…</p>}>
      <Editor />
    </Suspense>
  );
}
