"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Profile = {
  id: number;
  email: string;
  display_name: string | null;
  status: "pending" | "approved" | "rejected";
  role: "view" | "edit" | "admin" | null;
};

export type SessionUser = { id: number; email: string };

type AuthContextType = {
  user: SessionUser | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

async function fetchMe(): Promise<Profile | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    const fresh = await fetchMe();
    setProfile(fresh);
  }

  useEffect(() => {
    fetchMe().then((fresh) => {
      setProfile(fresh);
      setLoading(false);
    });
  }, []);

  const user: SessionUser | null = profile ? { id: profile.id, email: profile.email } : null;

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function getInitials(nameOrEmail: string) {
  const trimmed = nameOrEmail.trim();
  if (trimmed.includes(" ")) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const local = trimmed.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || "?";
}

export function displayNameOrEmail(profile: Profile | null, email: string | null | undefined) {
  return profile?.display_name?.trim() || email || "Not signed in";
}

export function roleLabel(role: Profile["role"]) {
  switch (role) {
    case "admin":
      return "Admin";
    case "edit":
      return "Editor";
    case "view":
      return "Viewer";
    default:
      return "Member";
  }
}
