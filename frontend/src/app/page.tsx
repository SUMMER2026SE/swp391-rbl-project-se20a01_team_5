"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthScreens } from "@/components/bus/auth-screens";
import { AppShell } from "@/components/bus/app-shell";
import {
  NotificationsScreen,
  ProfileScreen,
  SupportScreen,
} from "@/components/bus/common-screens";
import { StudentModule } from "@/components/bus/roles/student-module";
import { DriverModule } from "@/components/bus/roles/driver-module";
import { AssistantModule } from "@/components/bus/roles/assistant-module";
import { CoordinatorModule } from "@/components/bus/roles/coordinator-module";
import { AdminModule } from "@/components/bus/roles/admin-module";
import { UniversityAdminModule } from "@/components/bus/roles/university-admin-module";
import { NAV_CONFIG } from "@/components/bus/nav-config";
import { authApi, clearTokens, getAccessToken, getStoredRole, profileApi, type UserProfile } from "@/lib/api/client";
import type { Role } from "@/lib/types";
import { motion } from "framer-motion";

function mapBackendRole(role?: string | null): Role {
  switch ((role || "").toUpperCase()) {
    case "DRIVER":
      return "driver";
    case "CONDUCTOR":
      return "assistant";
    case "DISPATCHER":
      return "coordinator";
    case "ADMIN":
      return "admin";
    case "UNIVERSITY_ADMIN":
      return "university_admin";
    default:
      return "student";
  }
}

function firstNav(role: Role) {
  return NAV_CONFIG[role]?.[0]?.id ?? "stu-dashboard";
}

export default function Page() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [activeId, setActiveId] = useState(firstNav("student"));
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const loadProfile = useCallback(async (fallbackRole?: Role) => {
    const me = await profileApi.me();
    const resolvedRole = mapBackendRole(me.role) || fallbackRole || "student";
    setProfile(me);
    setRole(resolvedRole);
    setActiveId((current) => {
      const exists = NAV_CONFIG[resolvedRole].some((item) => item.id === current);
      return exists ? current : firstNav(resolvedRole);
    });
    setAuthed(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      if (!getAccessToken()) {
        if (mounted) setReady(true);
        return;
      }
      const storedRole = mapBackendRole(getStoredRole());
      try {
        await loadProfile(storedRole);
      } catch {
        clearTokens();
        if (mounted) {
          setAuthed(false);
          setProfile(null);
          setRole("student");
          setActiveId(firstNav("student"));
        }
      } finally {
        if (mounted) setReady(true);
      }
    };
    boot();
    return () => {
      mounted = false;
    };
  }, [loadProfile]);

  const handleLogin = async (r: Role) => {
    setRole(r);
    setActiveId(firstNav(r));
    setAuthed(true);
    try {
      await loadProfile(r);
    } catch {
      setProfile(null);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Session cleanup should still happen when the token is already expired.
    } finally {
      clearTokens();
      setAuthed(false);
      setProfile(null);
      setRole("student");
      setActiveId(firstNav("student"));
    }
  };

  const renderContent = () => {
    if (activeId.endsWith("-profile")) return <ProfileScreen />;
    if (activeId.endsWith("-notifications")) return <NotificationsScreen />;
    if (activeId === "stu-support") return <SupportScreen />;
    if (activeId === "stu-settings") return <ProfileScreen />;

    switch (role) {
      case "student":
        return (
          <StudentModule
            activeId={activeId}
            onNavigate={setActiveId}
            onProfileRefresh={() => loadProfile("student")}
          />
        );
      case "driver":
        return <DriverModule activeId={activeId} onNavigate={setActiveId} />;
      case "assistant":
        return <AssistantModule activeId={activeId} onNavigate={setActiveId} />;
      case "coordinator":
        return <CoordinatorModule activeId={activeId} onNavigate={setActiveId} />;
      case "admin":
        return <AdminModule activeId={activeId} onNavigate={setActiveId} />;
      case "university_admin":
        return <UniversityAdminModule activeId={activeId} onNavigate={setActiveId} />;
      default:
        return null;
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <motion.div
          animate={{ scale: [0.98, 1.02, 0.98], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-6"
        >
          <img src="/logo.png" alt="UniBus Logo" className="h-20 w-auto object-contain shrink-0" />
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-container-high">
            <motion.div
              className="h-full bg-[#beff50]"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!authed) {
    return <AuthScreens onLogin={handleLogin} />;
  }

  return (
    <AppShell
      role={role}
      activeId={activeId}
      profile={profile}
      onNavigate={setActiveId}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AppShell>
  );
}
