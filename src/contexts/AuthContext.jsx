import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { getUserByEmail } from "../firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRecord, setUserRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user record from Firestore
        try {
          const record = await getUserByEmail(firebaseUser.email);
          setUserRecord(record);
        } catch (error) {
          console.error("Error fetching user record:", error);
          setUserRecord(null);
        }
      } else {
        setUserRecord(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userRecord,
    loading,
    isAdmin: userRecord?.role === "admin" && userRecord?.isApproved,
    isContributor: userRecord?.role === "contributor" && userRecord?.isApproved,
    isManager: userRecord?.role === "manager" && userRecord?.isApproved,
    isApproved: userRecord?.isApproved || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
