"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirect: false,
      });
      if (!result || result.error) {
        setError("Username/email or password was not accepted.");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Sign in is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <p className="section-label">Moz Deli Foods</p>
        <h1>Restaurant<br /><em>admin.</em></h1>
        <label>Username or email<input name="email" type="text" autoComplete="username" required maxLength={254} /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={200} /></label>
        {error && <p className="checkout-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
    </main>
  );
}
