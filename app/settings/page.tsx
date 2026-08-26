"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import AuthGuard from "@/app/components/AuthGuard";
import NotificationSettings from "@/app/components/NotificationSettings";
import { useAuth, getInitials, roleLabel, displayNameOrEmail, type Profile } from "@/app/lib/auth-context";
import "../coupons-tracker/coupons-tracker.css";
import "./settings.css";

type Role = "view" | "edit" | "admin";

const STATUS_CLASS: Record<Profile["status"], string> = {
  approved: "status-active",
  pending: "status-pending",
  rejected: "status-expired",
};

function SettingsContent() {
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const isAdmin = myProfile?.role === "admin";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [nameInput, setNameInput] = useState(myProfile?.display_name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // Keep the input in sync when the loaded display name changes (e.g. after refreshProfile()).
  const [prevDisplayName, setPrevDisplayName] = useState(myProfile?.display_name ?? null);
  if ((myProfile?.display_name ?? null) !== prevDisplayName) {
    setPrevDisplayName(myProfile?.display_name ?? null);
    setNameInput(myProfile?.display_name ?? "");
  }

  async function loadProfiles() {
    setLoading(true);
    const res = await fetch("/api/profiles", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setProfiles(data.profiles as Profile[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetch("/api/profiles", { cache: "no-store" });
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setProfiles(data.profiles as Profile[]);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  async function handleSaveName() {
    if (!user) return;
    setSavingName(true);
    setNameSaved(false);
    const res = await fetch("/api/profiles/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: nameInput.trim() || null }),
    });
    setSavingName(false);
    if (res.ok) {
      await refreshProfile();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    }
  }

  async function updateProfile(id: number, body: { status?: string; role?: Role | null }) {
    await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await loadProfiles();
  }

  async function handleApprove(id: number, role: Role | null) {
    await updateProfile(id, { status: "approved", role: role ?? "view" });
  }

  async function handleReject(id: number) {
    await updateProfile(id, { status: "rejected" });
  }

  async function handleRoleChange(id: number, role: Role) {
    await updateProfile(id, { role });
  }

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="tracker-header">
          <h1 className="tracker-title">Settings</h1>
        </div>

        <section className="settings-section">
          <h2 className="settings-section-title">My Profile</h2>
          <div className="profile-row">
            <div className="profile-avatar">
              {getInitials(displayNameOrEmail(myProfile, user?.email))}
            </div>
            <div className="profile-info">
              <p className="profile-email">{user?.email}</p>
              <div className="profile-badges">
                {myProfile && (
                  <span className={`status-badge ${STATUS_CLASS[myProfile.status]}`}>
                    {myProfile.status}
                  </span>
                )}
                <span
                  className={`role-pill${
                    myProfile?.role === "edit" ? " role-pill--edit" : myProfile?.role === "view" ? " role-pill--view" : ""
                  }`}
                >
                  {roleLabel(myProfile?.role ?? null)}
                </span>
              </div>
            </div>
          </div>

          <div className="name-edit-row">
            <label className="name-edit-label">
              Display Name
              <input
                type="text"
                className="name-edit-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Mark J."
                maxLength={60}
              />
            </label>
            <button
              className="btn-primary name-edit-save"
              type="button"
              onClick={handleSaveName}
              disabled={savingName || nameInput.trim() === (myProfile?.display_name ?? "")}
            >
              {savingName ? "Saving..." : nameSaved ? "Saved ✓" : "Save"}
            </button>
          </div>
        </section>

        <NotificationSettings />

        {isAdmin && (
          <section className="settings-section">
            <h2 className="settings-section-title">User Access</h2>
            <p className="settings-section-sub">Approve sign-ins and manage roles.</p>

            {loading ? (
              <p className="settings-empty">Loading users...</p>
            ) : profiles.length === 0 ? (
              <p className="settings-empty">No accounts yet.</p>
            ) : (
              <div className="table-card users-table-card">
                <table className="coupons-table users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Status</th>
                      <th>Role</th>
                      <th aria-hidden="true"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => {
                      const isSelf = p.id === user?.id;
                      const canReject = p.status === "pending";
                      const canApprove = p.status !== "approved";
                      return (
                        <tr key={p.id}>
                          <td data-label="User">
                            <div className="user-cell">
                              <span className="user-cell-name">
                                {p.display_name || p.email}
                                {isSelf && <span className="self-tag">(you)</span>}
                              </span>
                              {p.display_name && <span className="user-cell-email">{p.email}</span>}
                            </div>
                          </td>
                          <td data-label="Status">
                            <span className={`status-badge ${STATUS_CLASS[p.status]}`}>{p.status}</span>
                          </td>
                          <td data-label="Role">
                            <select
                              value={p.role ?? ""}
                              disabled={isSelf}
                              onChange={(e) => handleRoleChange(p.id, e.target.value as Role)}
                            >
                              <option value="" disabled>Select role</option>
                              <option value="view">View-only</option>
                              <option value="edit">Edit</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td data-label="">
                            <div className="row-actions">
                              {canApprove && (
                                <button
                                  className="row-action"
                                  type="button"
                                  disabled={isSelf}
                                  onClick={() => handleApprove(p.id, p.role)}
                                >
                                  Approve
                                </button>
                              )}
                              {canReject && (
                                <button
                                  className="row-action row-action--danger"
                                  type="button"
                                  disabled={isSelf}
                                  onClick={() => handleReject(p.id)}
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}