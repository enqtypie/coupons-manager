"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import NotificationPrompt from "./NotificationPrompt";

export default function AuthGuard({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: ("view" | "edit" | "admin")[];
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!profile || profile.status !== "approved") {
      router.replace("/pending");
      return;
    }
    if (requireRole && profile.role && !requireRole.includes(profile.role)) {
      router.replace("/dashboard");
    }
  }, [user, profile, loading, router, requireRole]);

  if (loading || !user || !profile || profile.status !== "approved") {
    return <p style={{ padding: 24 }}>Loading...</p>;
  }

  return (
    <>
      <NotificationPrompt />
      {children}
    </>
  );
}