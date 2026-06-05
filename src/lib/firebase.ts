import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCaNCwrTptNk3i6M8L7pduR0R6aXqLIpLY",
  authDomain: "real-estate-matching-6f6fa.firebaseapp.com",
  projectId: "real-estate-matching-6f6fa",
  storageBucket: "real-estate-matching-6f6fa.firebasestorage.app",
  messagingSenderId: "182565975120",
  appId: "1:182565975120:web:1276e095d7f5d5f2938d55",
  measurementId: "G-S98M8F2X8F",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } catch {
    return getAuth(app);
  }
})();

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
});