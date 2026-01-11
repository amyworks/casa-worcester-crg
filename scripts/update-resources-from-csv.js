import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, addDoc, collection, Timestamp } from "firebase/firestore";
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

// Parse CSV line handling quoted fields
function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

// Parse CSV file
function parseCSV(csvText) {
  const lines = csvText.split("\n");
  const headers = parseCSVLine(lines[0]);
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });

    records.push(record);
  }

  return records;
}

// Parse semicolon-separated values into arrays
function parseArrayField(value) {
  if (!value) return [];
  return value.split(";").map(v => v.trim()).filter(Boolean);
}

// Parse boolean field
function parseBooleanField(value) {
  if (!value) return false;
  return value.toLowerCase() === "yes" || value.toLowerCase() === "true";
}

// Map CSV record to Firestore document
function mapToFirestoreDoc(record) {
  return {
    name: record.name || "",
    about: record.about || "",
    servicesOffered: record.servicesOffered || "",
    additionalInfo: record.additionalInfo || "",
    organizationType: record.organizationType || "",
    website: record.website || "",
    amazonWishlistUrl: record.amazonWishlistUrl || "",
    addressLine1: record.addressLine1 || "",
    addressLine2: record.addressLine2 || "",
    city: record.city || "",
    state: record.state || "",
    zipCode: record.zipCode || "",
    contactEmail: record.contactEmail || "",
    contactPhone: record.contactPhone || "",
    contactFax: record.contactFax || "",
    contactVP: record.contactVP || "",
    contactForm: record.contactForm || "",
    contactCrisis: record.contactCrisis || "",
    contactCrisisHours: record.contactCrisisHours || "",
    serviceDomains: parseArrayField(record.serviceDomains),
    accessMethods: parseArrayField(record.accessMethods),
    populationsServed: parseArrayField(record.populationsServed),
    eligibilityConstraints: parseArrayField(record.eligibilityConstraints),
    geographicCoverage: record.geographicCoverage || "",
    geographicRegions: parseArrayField(record.geographicRegions),
    geographicCounties: parseArrayField(record.geographicCounties),
    geographicCities: parseArrayField(record.geographicCities),
    geographicOffices: parseArrayField(record.geographicOffices),
    statewide: parseBooleanField(record.statewide),
    crisisServices: parseBooleanField(record.crisisServices),
    transportationProvided: parseBooleanField(record.transportationProvided),
    spanishSpeaking: parseBooleanField(record.spanishSpeaking),
    interpretationAvailable: parseBooleanField(record.interpretationAvailable),
    logoUrl: record.logoURL || "",
    updatedAt: Timestamp.now(),
    updatedBy: "csv-import",
  };
}

async function updateResources() {
  try {
    // Read CSV file
    const csvPath = path.join(__dirname, "..", "resources-updated-logos.csv");
    const csvText = fs.readFileSync(csvPath, "utf-8");

    console.log("Parsing CSV...");
    const records = parseCSV(csvText);
    console.log(`Found ${records.length} records to process`);

    let updatedCount = 0;
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        const docData = mapToFirestoreDoc(record);

        // Skip if no name
        if (!docData.name) {
          console.log("Skipping record with no name");
          skippedCount++;
          continue;
        }

        if (record.id && record.id.trim()) {
          // Update existing document
          console.log(`Updating: ${docData.name} (${record.id})`);
          await updateDoc(doc(db, "resources", record.id), docData);
          updatedCount++;
        } else {
          // Add new document
          console.log(`Adding new: ${docData.name}`);
          docData.createdAt = Timestamp.now();
          docData.createdBy = "csv-import";
          docData.isActive = true;
          docData.hasManager = false;
          docData.managerId = null;
          await addDoc(collection(db, "resources"), docData);
          addedCount++;
        }
      } catch (error) {
        console.error(`Error processing ${record.name}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n=== Update Complete ===");
    console.log(`✓ Updated: ${updatedCount}`);
    console.log(`✓ Added: ${addedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`✗ Errors: ${errorCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

updateResources();
