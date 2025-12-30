import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "casa-worcester-crg.firebaseapp.com",
  projectId: "casa-worcester-crg",
  storageBucket: "casa-worcester-crg.firebasestorage.app",
  messagingSenderId: "109596330242",
  appId: "1:109596330242:web:28cefcaebdf6e361245a1b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);