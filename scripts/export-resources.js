import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config from environment variables
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

async function exportResources() {
  try {
    console.log("Fetching resources from Firestore...");

    const snapshot = await getDocs(collection(db, "resources"));
    const resources = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${resources.length} resources`);

    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, "..", "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = path.join(exportsDir, `resources-${timestamp}.json`);

    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(resources, null, 2));

    console.log(`\nExport complete!`);
    console.log(`Saved to: ${outputPath}`);
    console.log(`Total resources: ${resources.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Error exporting resources:", error);
    process.exit(1);
  }
}

exportResources();
