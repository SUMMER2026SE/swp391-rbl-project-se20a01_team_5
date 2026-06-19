"use client";

import { useState } from "react";
import { AuthScreens } from "@/components/bus/auth-screens";
import { AppShell } from "@/components/bus/app-shell";
import {
  ProfileScreen,
  NotificationsScreen,
  SupportScreen,
  SettingsScreen,
  MyUniversityScreen,
} from "@/components/bus/common-screens";
import { StudentModule } from "@/components/bus/roles/student-module";
import { DriverModule } from "@/components/bus/roles/driver-module";
import { AssistantModule } from "@/components/bus/roles/assistant-module";
import { CoordinatorModule } from "@/components/bus/roles/coordinator-module";
import { AdminModule } from "@/components/bus/roles/admin-module";
import { UniversityAdminModule } from "@/components/bus/roles/university-admin-module";
import { NAV_CONFIG } from "@/components/bus/nav-config";
import type { Role } from "@/lib/types";
import { clearTokens, getAccessToken } from "@/lib/api/client";

function mapStoredRole(role?: string | null): Role {
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

function getInitialSession() {
  if (typeof window === "undefined" || !getAccessToken()) {
    return { authed: false, role: "student" as Role, activeId: "stu-dashboard" };
  }

  const role = mapStoredRole(localStorage.getItem("user_role"));
  return { authed: true, role, activeId: NAV_CONFIG[role][0].id };
}

export default function Page() {
  const initialSession = getInitialSession();
  const [authed, setAuthed] = useState(initialSession.authed);
  const [role, setRole] = useState<Role>(initialSession.role);
  const [activeId, setActiveId] = useState<string>(initialSession.activeId);

  const handleSwitchRole = (r: Role) => {
    setRole(r);
    setActiveId(NAV_CONFIG[r][0].id);
  };

  const handleLogin = (r: Role) => {
    setRole(r);
    setActiveId(NAV_CONFIG[r][0].id);
    setAuthed(true);
  };

  const renderContent = () => {
    // Shared common screens
    if (activeId === "stu-university") return <MyUniversityScreen />;
    if (activeId.endsWith("-profile")) return <ProfileScreen role={role} />;
    if (activeId.endsWith("-notifications")) return <NotificationsScreen />;
    if (activeId === "stu-support") return <SupportScreen />;
    if (activeId === "stu-settings") return <SettingsScreen />;

    // Role-specific modules
    switch (role) {
      case "student":
        return <StudentModule activeId={activeId} onNavigate={setActiveId} />;
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

  if (!authed) {
    return <AuthScreens onLogin={handleLogin} />;
  }

  return (
    <AppShell
      role={role}
      activeId={activeId}
      onNavigate={setActiveId}
      onSwitchRole={handleSwitchRole}
      onLogout={() => {
        clearTokens();
        setAuthed(false);
      }}
    >
      {renderContent()}
    </AppShell>
  );
}
