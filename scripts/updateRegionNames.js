// Script to update region names in Firebase
// Run with: npm run update:regions

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

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

const REGION_UPDATES = {
  "Central": "Central Mass",
  "Western": "Western Mass"
};

async function updateRegionNames() {
  console.log("Fetching resources...");
  const snapshot = await getDocs(collection(db, "resources"));

  let updatedCount = 0;

  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    let needsUpdate = false;
    const updates = {};

    // Check geographicCities array
    if (data.geographicCities && Array.isArray(data.geographicCities)) {
      const updatedCities = data.geographicCities.map(city => {
        if (city.region && REGION_UPDATES[city.region]) {
          needsUpdate = true;
          return { ...city, region: REGION_UPDATES[city.region] };
        }
        return city;
      });
      if (needsUpdate) {
        updates.geographicCities = updatedCities;
      }
    }

    // Check geographicRegions array
    if (data.geographicRegions && Array.isArray(data.geographicRegions)) {
      const updatedRegions = data.geographicRegions.map(region => {
        if (REGION_UPDATES[region]) {
          needsUpdate = true;
          return REGION_UPDATES[region];
        }
        return region;
      });
      if (needsUpdate) {
        updates.geographicRegions = updatedRegions;
      }
    }

    // Check geographicCounties array (has region property)
    if (data.geographicCounties && Array.isArray(data.geographicCounties)) {
      const updatedCounties = data.geographicCounties.map(county => {
        if (county.region && REGION_UPDATES[county.region]) {
          needsUpdate = true;
          return { ...county, region: REGION_UPDATES[county.region] };
        }
        return county;
      });
      if (needsUpdate) {
        updates.geographicCounties = updatedCounties;
      }
    }

    if (needsUpdate) {
      console.log(`Updating resource: ${data.name || docSnapshot.id}`);
      await updateDoc(doc(db, "resources", docSnapshot.id), updates);
      updatedCount++;
    }
  }

  console.log(`\nDone! Updated ${updatedCount} resources.`);
  process.exit(0);
}

updateRegionNames().catch(error => {
  console.error("Error updating region names:", error);
  process.exit(1);
});
