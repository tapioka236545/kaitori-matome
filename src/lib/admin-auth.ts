"use client";

import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const snap = await getDoc(doc(db, "admin_users", user.uid));
  return snap.exists() && snap.data().active === true;
}

export async function loginAdmin(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);

  const ok = await isCurrentUserAdmin();
  if (!ok) {
    await signOut(auth);
    throw new Error("管理者権限がありません");
  }
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
  await signInAnonymously(auth);
}

export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async () => {
      try {
        const ok = await isCurrentUserAdmin();
        setIsAdmin(ok);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { isAdmin, loading };
}