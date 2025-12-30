import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase/firebase";
import GoogleSignInButton from "./components/GoogleSignInButton";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <GoogleSignInButton />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 12 }}>
        Logged in as <b>{user.email}</b>
        <br />
        UID: <code>{user.uid}</code>
      </div>

      <button type="button" onClick={() => signOut(auth)}>
        Sign out
      </button>
    </div>
  );
}