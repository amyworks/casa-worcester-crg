import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/firebase";

export default function GoogleSignInButton() {
  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Google sign-in failed");
    }
  };

  return (
    <button type="button" onClick={signIn}>
      Sign in with Google
    </button>
  );
}
