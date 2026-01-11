import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { getUserByEmail, updateUser } from "../firebase/firestore";

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
    let unsubscribeFirestore = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous Firestore listener
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (firebaseUser) {
        // First fetch to get the user document ID
        try {
          const record = await getUserByEmail(firebaseUser.email);
          if (record?.id) {
            // Sync photoURL from Firebase Auth to Firestore if missing or changed
            if (firebaseUser.photoURL && record.photoURL !== firebaseUser.photoURL) {
              await updateUser(record.id, { photoURL: firebaseUser.photoURL });
            }

            // Set up real-time listener for user document
            unsubscribeFirestore = onSnapshot(
              doc(db, "users", record.id),
              (docSnapshot) => {
                if (docSnapshot.exists()) {
                  setUserRecord({ id: docSnapshot.id, ...docSnapshot.data() });
                }
              },
              (error) => {
                console.error("Error listening to user record:", error);
              }
            );
          } else {
            setUserRecord(record);
          }
        } catch (error) {
          console.error("Error fetching user record:", error);
          setUserRecord(null);
        }
      } else {
        setUserRecord(null);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  // Basic user roles (all have same browse/bookmark permissions)
  const basicUserRoles = ["volunteer", "general", "casa-volunteer", "casa-staff", "agency-affiliate"];

  // Helper to check if user can edit a specific resource (considers locking)
  const canEditResource = (resource) => {
    if (!userRecord?.isApproved) return false;

    // Superadmins can always edit
    if (userRecord.role === "admin") return true;

    // If resource is locked
    if (resource?.isLocked) {
      // Only assigned manager can edit (besides superadmin)
      if (userRecord.role === "manager" && resource.assignedManagerId === userRecord.id) {
        return true;
      }
      return false;
    }

    // Unlocked resources: Contributors and Managers can edit
    if (["contributor", "manager"].includes(userRecord.role)) return true;

    return false;
  };

  const value = {
    user,
    userRecord,
    loading,
    isAdmin: userRecord?.role === "admin" && userRecord?.isApproved,
    isContributor: userRecord?.role === "contributor" && userRecord?.isApproved,
    isManager: userRecord?.role === "manager" && userRecord?.isApproved,
    // isBasicUser covers all non-privileged roles (for permission checks)
    isBasicUser: basicUserRoles.includes(userRecord?.role) && userRecord?.isApproved,
    // Legacy alias
    isVolunteer: basicUserRoles.includes(userRecord?.role) && userRecord?.isApproved,
    isApproved: userRecord?.isApproved || false,
    // Helper to check if user can edit resources (admin, manager, or contributor)
    canEditResources: userRecord?.isApproved && ["admin", "manager", "contributor"].includes(userRecord?.role),
    // Helper to check if user can edit a specific resource (considers locking)
    canEditResource,
    // Bookmarks
    bookmarks: userRecord?.bookmarks || [],
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
