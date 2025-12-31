import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
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

// Helper function to parse CSV manually (simple parser)
function parseCSV(csvText) {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip instruction rows
    if (
      line.includes("For consideration for inclusion") ||
      line.includes("TO SEARCH BY KEYWORD")
    ) {
      continue;
    }

    const values = parseCSVLine(line);
    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });

      // Only process rows with a name
      if (record["Name of Organizatio}BN"]) {
        records.push(record);
      }
    }
  }

  return records;
}

// Parse a CSV line handling quoted fields
function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
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

// Map CSV data to Firestore resource model
function mapToResourceModel(csvRecord) {
  const name = csvRecord["Name of Organizatio}BN"] || "";
  const category = csvRecord["Category"] || "";
  const geography = csvRecord["Geography Served"] || "";
  const location = csvRecord["Location of Organization"] || "";
  const website = csvRecord["Website"] || "";
  const orgType = csvRecord["Type of Organization"] || "";
  const services = csvRecord["Service(s)/About"] || "";
  const requirements = csvRecord["Special Requirements"] || "";
  const whoCanRequest = csvRecord["Who Can Request"] || "";
  const howToRequest = csvRecord["How to Request"] || "";
  const contactEmail = csvRecord["Contact Email"] || "";
  const contactPhone = csvRecord["Contact Phone"] || "";
  const description = csvRecord["Details/Description"] || "";
  const notes = csvRecord["Notes"] || "";

  // Parse location (many have city, state, zip in one field)
  const { address, city, state, zipCode } = parseLocation(location);

  // Map categories to service domains
  const serviceDomains = mapCategoryToServiceDomains(category);

  // Map geography to geographic coverage
  const geographicCoverage = mapGeographyToCoverage(geography);

  // Map organization type
  const organizationType = mapOrganizationType(orgType);

  // Map populations served
  const populationsServed = inferPopulationsServed(
    category,
    services,
    description
  );

  // Map access methods
  const accessMethods = inferAccessMethods(
    howToRequest,
    requirements,
    whoCanRequest
  );

  // Map eligibility constraints
  const eligibilityConstraints = inferEligibilityConstraints(
    requirements,
    whoCanRequest
  );

  // Determine boolean flags
  const crisisServices = inferCrisisServices(category, services, description);
  const spanishSpeaking = inferSpanishSpeaking(services, description, notes);

  return {
    name,
    website,
    contactEmail,
    contactPhone,
    address,
    city,
    state,
    zipCode,
    about: services,
    servicesOffered: description,
    additionalInfo: [requirements, whoCanRequest, howToRequest, notes]
      .filter(Boolean)
      .join(" | "),
    serviceDomains,
    populationsServed,
    geographicCoverage,
    organizationType,
    accessMethods,
    eligibilityConstraints,
    crisisServices,
    spanishSpeaking,
    transportationProvided: false, // Default, needs manual review
    interpretationAvailable: false, // Default, needs manual review
    logoUrl: "",
    isActive: true,
    hasManager: false,
    managerId: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: "system-import",
    updatedBy: "system-import",
  };
}

// Helper: Parse location string
function parseLocation(locationStr) {
  if (!locationStr) return { address: "", city: "", state: "", zipCode: "" };

  // Try to extract city, state, zip
  const zipMatch = locationStr.match(/\b\d{5}\b/);
  const stateMatch = locationStr.match(/\b[A-Z]{2}\b/);

  let address = locationStr;
  let city = "";
  let state = stateMatch ? stateMatch[0] : "";
  let zipCode = zipMatch ? zipMatch[0] : "";

  // Simple heuristic: everything before state abbreviation is address/city
  if (stateMatch) {
    const parts = locationStr.split(stateMatch[0]);
    if (parts[0]) {
      const addressParts = parts[0].split(",").map((p) => p.trim());
      if (addressParts.length > 1) {
        city = addressParts[addressParts.length - 1];
        address = addressParts.slice(0, -1).join(", ");
      } else {
        address = parts[0].trim();
      }
    }
  }

  return { address, city, state, zipCode };
}

// Helper: Map category to service domains
function mapCategoryToServiceDomains(category) {
  const domains = [];
  const lower = category.toLowerCase();

  if (lower.includes("domestic violence")) domains.push("Domestic Violence & Safety");
  if (lower.includes("foster")) domains.push("Foster Care & Child Welfare");
  if (lower.includes("housing") || lower.includes("shelter")) domains.push("Housing & Shelter");
  if (lower.includes("food") || lower.includes("nutrition")) domains.push("Food & Nutrition");
  if (lower.includes("clothing")) domains.push("Clothing & Basic Needs");
  if (lower.includes("hygiene")) domains.push("Hygiene & Personal Care");
  if (lower.includes("mental health") || lower.includes("behavioral")) domains.push("Healthcare & Mental Health");
  if (lower.includes("substance") || lower.includes("recovery") || lower.includes("addiction")) domains.push("Substance Use & Recovery");
  if (lower.includes("legal")) domains.push("Legal Aid & Advocacy");
  if (lower.includes("education") || lower.includes("school") || lower.includes("tutoring")) domains.push("Education & Youth Programs");
  if (lower.includes("employment") || lower.includes("job")) domains.push("Employment & Job Training");
  if (lower.includes("immigrant") || lower.includes("refugee")) domains.push("Immigration & Refugee Support");
  if (lower.includes("disability") || lower.includes("special needs")) domains.push("Disability & Accessibility Support");
  if (lower.includes("financial")) domains.push("Financial Assistance");
  if (lower.includes("youth") || lower.includes("mentoring")) domains.push("Parenting & Family Support");
  if (lower.includes("bicycle") || lower.includes("essentials") || lower.includes("birthday") || lower.includes("gifts")) domains.push("Community & Mutual Aid");

  return domains.length > 0 ? domains : ["Community & Mutual Aid"];
}

// Helper: Map geography to coverage
function mapGeographyToCoverage(geography) {
  const lower = geography.toLowerCase();

  if (lower.includes("nationwide") || lower.includes("nationally") || lower.includes("all of massachusetts") || lower.includes("massachusetts")) return "Statewide";
  if (lower.includes("county") || lower.includes("worcester county")) return "County-wide";
  if (lower.includes("city") || lower.includes("worcester,")) return "City-specific";
  if (lower.includes("regional") || lower.includes("central mass") || lower.includes("western mass")) return "Regional";
  if (lower.includes("multi-state") || lower.includes("national")) return "Multi-state / National";

  return "County-wide"; // Default
}

// Helper: Map organization type
function mapOrganizationType(orgType) {
  const lower = orgType.toLowerCase();

  if (lower.includes("nonprofit") || lower.includes("non-profit")) return "Nonprofit Organization";
  if (lower.includes("government")) return "Government Agency";
  if (lower.includes("community")) return "Community-Based Organization";
  if (lower.includes("faith")) return "Faith-Based Organization";
  if (lower.includes("mutual aid") || lower.includes("grassroots")) return "Mutual Aid / Grassroots";
  if (lower.includes("healthcare") || lower.includes("health")) return "Healthcare Provider";
  if (lower.includes("education")) return "Educational Organization";

  return "Nonprofit Organization"; // Default
}

// Helper: Infer populations served
function inferPopulationsServed(category, services, description) {
  const populations = [];
  const text = `${category} ${services} ${description}`.toLowerCase();

  if (text.includes("infant") || text.includes("toddler")) populations.push("Infants and toddlers");
  if (text.includes("young children") || text.includes("child")) populations.push("Young children");
  if (text.includes("adolescent") || text.includes("teen") || text.includes("youth")) populations.push("Adolescents");
  if (text.includes("transition") || text.includes("aging out")) populations.push("Transition-Age Youth");
  if (text.includes("adult") || text.includes("men") || text.includes("women")) populations.push("Adults");
  if (text.includes("family") || text.includes("families")) populations.push("Families");
  if (text.includes("domestic violence") || text.includes("survivor")) populations.push("Survivors of Domestic Violence");
  if (text.includes("foster") || text.includes("kinship")) populations.push("Foster / Kinship Families");
  if (text.includes("disability") || text.includes("special needs")) populations.push("Individuals with Disabilities");
  if (text.includes("immigrant") || text.includes("refugee")) populations.push("Immigrants / Refugees");
  if (text.includes("justice") || text.includes("incarceration") || text.includes("re-entry")) populations.push("Justice-Involved Individuals");
  if (text.includes("low-income") || text.includes("homeless") || text.includes("poverty")) populations.push("Low-Income / Housing-Insecure Individuals");

  return populations.length > 0 ? populations : ["Families"];
}

// Helper: Infer access methods
function inferAccessMethods(howToRequest, requirements, whoCanRequest) {
  const methods = [];
  const text = `${howToRequest} ${requirements} ${whoCanRequest}`.toLowerCase();

  if (text.includes("self-referral") || text.includes("anyone")) methods.push("Self-Referral");
  if (text.includes("professional referral") || text.includes("referral required")) methods.push("Professional Referral Required");
  if (text.includes("agency referral") || text.includes("dcf") || text.includes("social worker")) methods.push("Agency Referral Only");
  if (text.includes("walk-in") || text.includes("walk in")) methods.push("Walk-In");
  if (text.includes("appointment")) methods.push("Appointment Required");
  if (text.includes("online") || text.includes("website") || text.includes("form")) methods.push("Online Request");
  if (text.includes("phone") || text.includes("call")) methods.push("Phone Request");
  if (text.includes("crisis") || text.includes("emergency") || text.includes("24/7")) methods.push("Emergency / Crisis Access");

  return methods.length > 0 ? methods : ["Phone Request"];
}

// Helper: Infer eligibility constraints
function inferEligibilityConstraints(requirements, whoCanRequest) {
  const constraints = [];
  const text = `${requirements} ${whoCanRequest}`.toLowerCase();

  if (text.includes("age") || text.includes("14-19") || text.includes("under")) constraints.push("Age Restrictions");
  if (text.includes("income") || text.includes("low-income")) constraints.push("Income-Based Eligibility");
  if (text.includes("residency") || text.includes("resident") || text.includes("massachusetts")) constraints.push("Residency Requirements");
  if (text.includes("documentation") || text.includes("application")) constraints.push("Documentation Required");
  if (text.includes("waitlist")) constraints.push("Waitlist Likely");
  if (text.includes("limited") || text.includes("capacity")) constraints.push("Limited Capacity");
  if (text.includes("emergency") || text.includes("crisis only")) constraints.push("Emergency-Only");

  return constraints;
}

// Helper: Infer crisis services
function inferCrisisServices(category, services, description) {
  const text = `${category} ${services} ${description}`.toLowerCase();
  return text.includes("crisis") || text.includes("emergency") || text.includes("24/7") || text.includes("hotline");
}

// Helper: Infer Spanish speaking
function inferSpanishSpeaking(services, description, notes) {
  const text = `${services} ${description} ${notes}`.toLowerCase();
  return text.includes("spanish") || text.includes("español");
}

// Main import function
async function importResources() {
  try {
    // Read CSV file
    const csvPath = path.join(__dirname, "..", "data-src.csv");
    const csvText = fs.readFileSync(csvPath, "utf-8");

    // Parse CSV
    console.log("Parsing CSV...");
    const records = parseCSV(csvText);
    console.log(`Found ${records.length} records to import`);

    // Transform and import each record
    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        const resource = mapToResourceModel(record);
        
        // Skip if no name
        if (!resource.name) {
          console.log("Skipping record with no name");
          continue;
        }

        console.log(`Importing: ${resource.name}`);
        await addDoc(collection(db, "resources"), resource);
        successCount++;
      } catch (error) {
        console.error(`Error importing ${record["Name of Organizatio}BN"]}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n=== Import Complete ===");
    console.log(`✓ Successfully imported: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run import
importResources();
