import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase/firebase";
import { getUserByEmail, createUser } from "../firebase/firestore";

export default function GoogleSignInButton() {
  const navigate = useNavigate();

  const signIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Signed in user:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      });

      // Check if user exists in Firestore users collection by email
      let userRecord = await getUserByEmail(user.email);
      
      console.log("User record from Firestore:", userRecord);

      if (!userRecord) {
        // User not found, redirect to request access
        console.log("No user record found, redirecting to request access");
        navigate("/request-access?reason=no-access");
      } else {
        // User record exists, but we need to make sure their UID is set in Firestore
        // (in case they were pre-approved by email but this is their first login)
        if (userRecord.id !== user.uid) {
          console.log("Updating user record with UID");
          // The user was created by email, now we need to set the document ID to match the UID
          await createUser(user.uid, {
            email: user.email,
            name: user.displayName || userRecord.name,
            agency: userRecord.agency,
            role: userRecord.role,
            isApproved: userRecord.isApproved,
            managedResources: userRecord.managedResources || [],
          });
          // Re-fetch with the correct ID
          userRecord = { ...userRecord, id: user.uid };
        }

        if (!userRecord.isApproved) {
          // User exists but not approved
          console.log("User not approved, redirecting to request access");
          navigate("/request-access?reason=pending");
        } else {
          // User is approved, redirect to browse or admin based on role
          console.log("User approved, redirecting based on role:", userRecord.role);
          if (userRecord.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/browse");
          }
        }
      }
    } catch (e) {
      console.error("Sign-in error:", e);
      alert(e?.message || "Google sign-in failed");
    }
  };

  return (
    <button
      type="button"
      onClick={signIn}
      className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-full font-semibold text-gray-700 hover:border-brand-blue hover:bg-gray-50 transition-all"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Sign in with Google
    </button>
  );
}


