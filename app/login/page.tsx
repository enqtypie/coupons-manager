"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, Lock, Loader2, Mail, Tag } from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import "./auth.css";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/dashboard");
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setAccountCreated(true);
  }

  if (accountCreated) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-icon auth-icon--pending">
            <Clock size={24} />
          </div>
          <h1 className="auth-title">Account Created</h1>
          <p className="auth-subtitle">
            Your account for <strong>{email}</strong> is waiting for an admin to approve
            access. You&apos;ll be able to sign in with your password once approved.
          </p>
          <button
            type="button"
            className="auth-submit auth-submit--outline"
            style={{ marginTop: 18 }}
            onClick={() => {
              setAccountCreated(false);
              switchMode("signin");
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-icon auth-icon--brand">
          <Tag size={22} />
        </div>
        <h1 className="auth-title">Coupons Manager</h1>
        <p className="auth-subtitle">
          Jet&apos;s Pizza — US Operations.{" "}
          {mode === "signin" ? "Sign in with your work email." : "Create an account with your work email."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          <label>
            Work Email
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><Mail size={15} /></span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@loke.com"
                autoFocus
                required
              />
            </div>
          </label>
          <label>
            Password
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><Lock size={15} /></span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                minLength={6}
                required
              />
            </div>
          </label>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={15} className="spin" />
                {mode === "signin" ? "Signing in..." : "Creating account..."}
              </>
            ) : mode === "signin" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signin" ? (
            <>
              Need an account?{" "}
              <button type="button" className="auth-link" onClick={() => switchMode("signup")}>
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" className="auth-link" onClick={() => switchMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
