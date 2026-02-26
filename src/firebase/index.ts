import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// 🔐 Firebase config (from .env.local)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔑 Export Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// 👤 Get user role from Firestore
export const getUserRole = async (uid: string) => {
  try {
    const userSnap = await getDoc(doc(db, "users", uid));

    if (userSnap.exists()) {
      return userSnap.data().role;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
};