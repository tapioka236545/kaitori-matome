"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "kaitorikun_admin_logged_in";

/**
 * 必ず自分用の文字列に変更してください
 * 例: "kataoka-admin-2026"
 */
const ADMIN_PASSCODE = "kaitorikun-admin-2026";

function notifyAdminAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("admin-auth-changed"));
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function loginAdmin(passcode: string): boolean {
  if (typeof window === "undefined") return false;

  if (passcode === ADMIN_PASSCODE) {
    localStorage.setItem(STORAGE_KEY, "1");
    notifyAdminAuthChanged();
    return true;
  }

  return false;
}

export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  notifyAdminAuthChanged();
}

export function useAdminStatus(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const sync = () => {
      setIsAdmin(isAdminLoggedIn());
    };

    sync();

    window.addEventListener("storage", sync);
    window.addEventListener("admin-auth-changed", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("admin-auth-changed", sync);
    };
  }, []);

  return isAdmin;
}