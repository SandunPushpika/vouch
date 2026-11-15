"use client";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/shared";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Empty
      title="Your workspace couldn’t open"
      description="Check that your browser allows local storage. Your saved data has not been deleted."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
