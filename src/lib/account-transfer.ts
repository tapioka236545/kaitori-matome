"use client";

import { auth } from "@/lib/firebase";
import { getUid } from "@/lib/auth";
import { EmailAuthProvider, linkWithCredential } from "firebase/auth";

export async function linkAnonymousUserToEmail(
  email: string,
  password: string
) {
  await getUid();

  const user = auth.currentUser;

  if (!user) {
    throw new Error("ユーザー情報を取得できませんでした");
  }

  if (!user.isAnonymous) {
    return {
      uid: user.uid,
      alreadyLinked: true,
    };
  }

  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(user, credential);

  return {
    uid: result.user.uid,
    alreadyLinked: false,
  };
}