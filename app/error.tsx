"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Route error", error.digest ?? "No error digest available.");
  }, [error]);

  return (
    <main className="premium-state-page">
      <p className="premium-eyebrow">A little pause</p>
      <h1>Something went wrong<br /><em>at the table.</em></h1>
      <p>We couldn&apos;t load this page just now. Please try again or return to the home page.</p>
      <div className="premium-state-actions">
        <Link href="/" className="premium-button">Return to home</Link>
        <button type="button" className="premium-button-outline" onClick={retry}>Try again</button>
      </div>
    </main>
  );
}
