import Link from "next/link";

export default function NotFound() {
  return (
    <main className="premium-state-page">
      <p className="premium-eyebrow">404 · Not on the menu</p>
      <h1>This dish isn&apos;t<br /><em>on the menu.</em></h1>
      <p>Let&apos;s get you back to something delicious.</p>
      <Link href="/" className="premium-button">Return to home</Link>
    </main>
  );
}
