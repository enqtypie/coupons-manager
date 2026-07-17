"use client";

import { Clock, XCircle } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import { supabase } from "@/app/lib/supabase";
import "../login/auth.css";

export default function PendingPage() {
  const { profile } = useAuth();
  const isRejected = profile?.status === "rejected";

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className={`auth-icon ${isRejected ? "auth-icon--danger" : "auth-icon--pending"}`}>
          {isRejected ? <XCircle size={24} /> : <Clock size={24} />}
        </div>
        <h1 className="auth-title">{isRejected ? "Access Denied" : "Pending Approval"}</h1>
        <p className="auth-subtitle">
          {isRejected
            ? "Your access request was declined. Contact an admin for details."
            : "Your account is waiting for an admin to approve access. You'll be able to sign in once approved."}
        </p>
        <button
          type="button"
          className="auth-submit auth-submit--outline"
          style={{ marginTop: 18 }}
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
