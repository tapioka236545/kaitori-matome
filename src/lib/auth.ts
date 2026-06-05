"use client";

import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";

let uidPromise: Promise<string> | null = null;

function withTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = 10000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label}がタイムアウトしました`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function getUid(): Promise<string> {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }

  if (!uidPromise) {
    uidPromise = withTimeout(
      signInAnonymously(auth).then((result) => result.user.uid),
      "匿名認証"
    ).finally(() => {
      uidPromise = null;
    });
  }

  return uidPromise;
}