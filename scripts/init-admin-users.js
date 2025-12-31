import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const adminUsers = [
  {
    id: "admin-yupamyworks", // Temporary ID until first login
    email: "yupamyworks@gmail.com",
    name: "Amy Works",
    agency: "CASA Worcester",
    role: "admin",
    isApproved: true,
    managedResources: [],
    createdAt: new Date().toISOString(),
    approvedBy: "system",
  },
  {
    id: "admin-acoleman", // Temporary ID until first login
    email: "acoleman@fxmtechgroup.com",
    name: "Alicia Coleman",
    agency: "FxM Tech Group",
    role: "admin",
    isApproved: true,
    managedResources: [],
    createdAt: new Date().toISOString(),
    approvedBy: "system",
  },
];

async function initializeAdminUsers() {
  console.log("Initializing admin users...");

  for (const user of adminUsers) {
    try {
      const { id, ...userData } = user;
      await setDoc(doc(db, "users", id), userData);
      console.log(`✓ Created admin user: ${id}`);
    } catch (error) {
      console.error(`✗ Failed to create user ${user.id}:`, error);
    }
  }

  console.log("\nAdmin users initialized successfully!");
  process.exit(0);
}

initializeAdminUsers().catch((error) => {
  console.error("Error initializing admin users:", error);
  process.exit(1);
});
