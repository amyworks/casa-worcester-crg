import { useState, useRef, useEffect } from "react";
import {
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  PrinterIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../../contexts/AuthContext";
import { updateResource, uploadResourceLogo } from "../../firebase/firestore";
import {
  getRegionNames,
  getCountyNamesInRegion,
  getCitiesInCounty,
  getCitiesInRegion,
  MA_GEOGRAPHIC_DATA,
} from "../../data/massachusettsGeography";

// Filter options from data model
const SERVICE_DOMAINS = [
  "Housing & Shelter",
  "Domestic Violence & Safety",
  "Foster Care & Child Welfare",
  "Parenting & Family Support",
  "Food & Nutrition",
  "Clothing & Basic Needs",
  "Hygiene & Personal Care",
  "Healthcare & Mental Health",
  "Substance Use & Recovery",
  "Legal Aid & Advocacy",
  "Education & Youth Programs",
  "Employment & Job Training",
  "Immigration & Refugee Support",
  "Disability & Accessibility Support",
  "Financial Assistance",
  "Community & Mutual Aid",
  "Training & Resources",
];

const POPULATIONS_SERVED = [
  "Infants and toddlers",
  "Young children",
  "Adolescents",
  "Transition-Age Youth",
  "Women / Mothers",
  "Men / Fathers",
  "Parents",
  "Foster Parents",
  "Families",
  "LGBTQIA+",
  "BIPOC",
  "AAPI",
  "Middle Eastern",
  "Latina/Hispanic",
  "Elderly",
  "Survivors of Domestic Violence",
  "Foster / Kinship Families",
  "Individuals with Disabilities",
  "Immigrants / Refugees",
  "Justice-Involved Individuals",
  "Low-Income / Housing-Insecure Individuals",
];

const ACCESS_METHODS = [
  "Self-Referral",
  "Professional Referral Required",
  "Agency Referral Only",
  "Walk-In",
  "Appointment Required",
  "Online Request",
  "Phone Request",
  "Emergency / Crisis Access",
];

const ELIGIBILITY_CONSTRAINTS = [
  "Age Restrictions",
  "Income-Based Eligibility",
  "Residency Requirements",
  "Documentation Required",
  "Waitlist Likely",
  "Limited Capacity",
  "Emergency-Only",
];

const ORGANIZATION_TYPES = [
  "Nonprofit Organization",
  "Government Agency",
  "Community-Based Organization",
  "Faith-Based Organization",
  "Mutual Aid / Grassroots",
  "Healthcare Provider",
  "Educational Organization",
];

// Entry status options (Complete vs Stub - mutually exclusive)
const ENTRY_STATUSES = {
  complete: { label: "Complete", description: "Entry is fully complete" },
  stub: { label: "Stub", description: "Entry needs more information" },
};

export default function ResourceGuideEntry({ resource, isEditing: externalIsEditing, onEditingChange }) {
  const { userRecord } = useAuth();
  const [internalIsEditing, setInternalIsEditing] = useState(false);

  // Use external editing state if provided, otherwise use internal
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;
  const setIsEditing = onEditingChange || setInternalIsEditing;
  const [editedData, setEditedData] = useState({ ...resource });
  const [saving, setSaving] = useState(false);

  // Sync editedData with resource when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Migrate legacy 'address' field to 'addressLine1' if needed
      const data = { ...resource };
      if (data.address && !data.addressLine1) {
        data.addressLine1 = data.address;
      }
      setEditedData(data);
    }
  }, [isEditing, resource]);

  // State for logo upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  // State for communities served toggle (view mode)
  const [showCommunities, setShowCommunities] = useState(false);

  // State for collapsible geographic sections - auto-expand based on existing selections
  const [openRegions, setOpenRegions] = useState(() => {
    const cities = resource.geographicCities || [];
    const regions = {};
    cities.forEach((c) => {
      if (c.region) regions[c.region] = true;
    });
    return regions;
  });
  const [openCounties, setOpenCounties] = useState(() => {
    const cities = resource.geographicCities || [];
    const counties = {};
    cities.forEach((c) => {
      if (c.region && c.county) {
        counties[`${c.region}-${c.county}`] = true;
      }
    });
    return counties;
  });

  const {
    id,
    name,
    logoUrl,
    about,
    servicesOffered,
    serviceDomains = [],
    populationsServed = [],
    address, // Legacy field - for backwards compatibility
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    contactPhone,
    contactFax,
    contactEmail,
    website,
    crisisServices,
    spanishSpeaking,
    transportationProvided,
    interpretationAvailable,
    geographicCities = [], // Array of {city, zipCodes, county, region}
    organizationType,
    accessMethods = [],
    eligibilityConstraints = [],
    additionalInfo,
    amazonWishlistUrl,
    entryStatus = "complete", // "complete" or "stub"
    isUnavailable = false, // separate boolean for availability
  } = isEditing ? editedData : resource;

  // Handle logo file selection
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2MB');
        return;
      }
      setLogoFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  // Clear selected logo
  const handleClearLogo = () => {
    setLogoFile(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  // Remove existing logo
  const handleRemoveLogo = () => {
    updateField('logoUrl', '');
    handleClearLogo();
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let newLogoUrl = editedData.logoUrl;

      // Upload new logo if one was selected
      if (logoFile) {
        setUploadingLogo(true);
        try {
          newLogoUrl = await uploadResourceLogo(id, logoFile);
        } catch (uploadError) {
          console.error("Error uploading logo:", uploadError);
          alert("Failed to upload logo. Please try again.");
          setUploadingLogo(false);
          setSaving(false);
          return;
        }
        setUploadingLogo(false);
      }

      // Prepare data for save - clear legacy address field if addressLine1 is set
      const dataToSave = {
        ...editedData,
        logoUrl: newLogoUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: userRecord?.id || null,
      };

      // If addressLine1 exists (even empty string), clear the legacy address field
      if ('addressLine1' in dataToSave) {
        dataToSave.address = null; // Clear legacy field
      }

      await updateResource(id, dataToSave);

      // Update the original resource object
      Object.assign(resource, dataToSave);

      // Clear logo upload state
      handleClearLogo();

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving resource:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData({ ...resource });
    handleClearLogo();
    setIsEditing(false);
  };

  const updateField = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    setEditedData((prev) => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      return { ...prev, [field]: newArray };
    });
  };

  // Toggle region visibility
  const toggleRegion = (regionName) => {
    setOpenRegions((prev) => ({ ...prev, [regionName]: !prev[regionName] }));
  };

  // Toggle county visibility
  const toggleCounty = (countyKey) => {
    setOpenCounties((prev) => ({ ...prev, [countyKey]: !prev[countyKey] }));
  };

  // Check if a city is selected
  const isCitySelected = (cityName) => {
    const cities = editedData.geographicCities || [];
    return cities.some((c) => c.city === cityName);
  };

  // Check if all cities in a county are selected
  const isCountyFullySelected = (regionName, countyName) => {
    const cities = getCitiesInCounty(regionName, countyName);
    return cities.every((cityData) => isCitySelected(cityData.name));
  };

  // Check if any cities in a county are selected
  const isCountyPartiallySelected = (regionName, countyName) => {
    const cities = getCitiesInCounty(regionName, countyName);
    return cities.some((cityData) => isCitySelected(cityData.name)) && !isCountyFullySelected(regionName, countyName);
  };

  // Check if all cities in a region are selected
  const isRegionFullySelected = (regionName) => {
    const countyNames = getCountyNamesInRegion(regionName);
    return countyNames.every((countyName) => isCountyFullySelected(regionName, countyName));
  };

  // Check if any cities in a region are selected
  const isRegionPartiallySelected = (regionName) => {
    const countyNames = getCountyNamesInRegion(regionName);
    return countyNames.some((countyName) => {
      const cities = getCitiesInCounty(regionName, countyName);
      return cities.some((cityData) => isCitySelected(cityData.name));
    }) && !isRegionFullySelected(regionName);
  };

  // Check if all regions are fully selected (statewide)
  const isStatewideSelected = () => {
    const allRegions = getRegionNames();
    return allRegions.every((regionName) => isRegionFullySelected(regionName));
  };

  // Check if some but not all regions are selected (partial statewide)
  const isStatewidePartiallySelected = () => {
    const allRegions = getRegionNames();
    const hasAny = allRegions.some((regionName) => {
      const countyNames = getCountyNamesInRegion(regionName);
      return countyNames.some((countyName) => {
        const cities = getCitiesInCounty(regionName, countyName);
        return cities.some((cityData) => isCitySelected(cityData.name));
      });
    });
    return hasAny && !isStatewideSelected();
  };

  // Toggle statewide selection
  const toggleStatewide = () => {
    const isCurrentlyStatewide = isStatewideSelected();

    if (isCurrentlyStatewide) {
      // Deselect all
      setEditedData((prev) => ({
        ...prev,
        statewide: false,
        geographicCities: [],
        geographicRegions: [],
        geographicCounties: [],
      }));
    } else {
      // Select all regions, counties, and cities
      const allRegions = getRegionNames();
      const allCities = [];
      const allCounties = [];

      allRegions.forEach((regionName) => {
        const countyNames = getCountyNamesInRegion(regionName);
        countyNames.forEach((countyName) => {
          allCounties.push({ region: regionName, county: countyName });
          const cities = getCitiesInCounty(regionName, countyName);
          cities.forEach((cityData) => {
            allCities.push({
              city: cityData.name,
              zipCodes: cityData.zipCodes,
              county: countyName,
              region: regionName,
            });
          });
        });
      });

      setEditedData((prev) => ({
        ...prev,
        statewide: true,
        geographicCities: allCities,
        geographicRegions: allRegions,
        geographicCounties: allCounties,
      }));
    }
  };

  // Toggle entire region
  const toggleRegionSelection = (regionName) => {
    const isSelected = isRegionFullySelected(regionName);
    const countyNames = getCountyNamesInRegion(regionName);
    
    setEditedData((prev) => {
      let currentCities = prev.geographicCities || [];
      let currentRegions = prev.geographicRegions || [];
      let currentCounties = prev.geographicCounties || [];
      
      if (isSelected) {
        // Deselect all cities in this region
        currentCities = currentCities.filter((c) => c.region !== regionName);
        // Remove region from fully selected regions
        currentRegions = currentRegions.filter((r) => r !== regionName);
        // Remove all counties in this region from fully selected counties
        currentCounties = currentCounties.filter((c) => c.region !== regionName);
      } else {
        // Select all cities in this region
        countyNames.forEach((countyName) => {
          const cities = getCitiesInCounty(regionName, countyName);
          cities.forEach((cityData) => {
            if (!currentCities.some((c) => c.city === cityData.name)) {
              currentCities.push({
                city: cityData.name,
                zipCodes: cityData.zipCodes,
                county: countyName,
                region: regionName,
              });
            }
          });
        });
        // Add region to fully selected regions
        if (!currentRegions.includes(regionName)) {
          currentRegions.push(regionName);
        }
        // Add all counties in this region to fully selected counties
        countyNames.forEach((countyName) => {
          if (!currentCounties.some((c) => c.region === regionName && c.county === countyName)) {
            currentCounties.push({ region: regionName, county: countyName });
          }
        });
      }
      
      return { 
        ...prev, 
        geographicCities: currentCities,
        geographicRegions: currentRegions,
        geographicCounties: currentCounties
      };
    });
  };

  // Toggle entire county
  const toggleCountySelection = (regionName, countyName) => {
    const isSelected = isCountyFullySelected(regionName, countyName);
    const cities = getCitiesInCounty(regionName, countyName);
    
    setEditedData((prev) => {
      let currentCities = prev.geographicCities || [];
      let currentRegions = prev.geographicRegions || [];
      let currentCounties = prev.geographicCounties || [];
      
      if (isSelected) {
        // Deselect all cities in this county
        currentCities = currentCities.filter(
          (c) => !(c.county === countyName && c.region === regionName)
        );
        // Remove county from fully selected counties
        currentCounties = currentCounties.filter(
          (c) => !(c.region === regionName && c.county === countyName)
        );
        // Check if region is still fully selected after removing this county
        const allCountiesInRegion = getCountyNamesInRegion(regionName);
        const stillFullySelected = allCountiesInRegion.every((cn) =>
          cn === countyName ? false : currentCounties.some((c) => c.region === regionName && c.county === cn)
        );
        if (!stillFullySelected) {
          currentRegions = currentRegions.filter((r) => r !== regionName);
        }
      } else {
        // Select all cities in this county
        cities.forEach((cityData) => {
          if (!currentCities.some((c) => c.city === cityData.name)) {
            currentCities.push({
              city: cityData.name,
              zipCodes: cityData.zipCodes,
              county: countyName,
              region: regionName,
            });
          }
        });
        // Add county to fully selected counties
        if (!currentCounties.some((c) => c.region === regionName && c.county === countyName)) {
          currentCounties.push({ region: regionName, county: countyName });
        }
        // Check if all counties in region are now selected
        const allCountiesInRegion = getCountyNamesInRegion(regionName);
        const allSelected = allCountiesInRegion.every((cn) =>
          currentCounties.some((c) => c.region === regionName && c.county === cn)
        );
        if (allSelected && !currentRegions.includes(regionName)) {
          currentRegions.push(regionName);
        }
      }
      
      return { 
        ...prev, 
        geographicCities: currentCities,
        geographicRegions: currentRegions,
        geographicCounties: currentCounties
      };
    });
  };

  // Toggle city selection
  const toggleCity = (cityName, zipCodes, countyName, regionName) => {
    const currentCities = editedData.geographicCities || [];
    const exists = currentCities.some((c) => c.city === cityName);

    // Auto-expand the region and county when adding a city
    if (!exists) {
      setOpenRegions((prev) => ({ ...prev, [regionName]: true }));
      setOpenCounties((prev) => ({ ...prev, [`${regionName}-${countyName}`]: true }));
    }

    setEditedData((prev) => {
      let newCities = prev.geographicCities || [];
      let newRegions = prev.geographicRegions || [];
      let newCounties = prev.geographicCounties || [];

      if (exists) {
        // Remove city
        newCities = newCities.filter((c) => c.city !== cityName);

        // Check if county is still fully selected
        const allCitiesInCounty = getCitiesInCounty(regionName, countyName);
        const countyStillFull = allCitiesInCounty.every((cityData) =>
          cityData.name === cityName ? false : newCities.some((c) => c.city === cityData.name)
        );
        if (!countyStillFull) {
          newCounties = newCounties.filter(
            (c) => !(c.region === regionName && c.county === countyName)
          );
        }

        // Check if region is still fully selected
        if (!countyStillFull) {
          newRegions = newRegions.filter((r) => r !== regionName);
        }
      } else {
        // Add city
        newCities = [...newCities, { city: cityName, zipCodes, county: countyName, region: regionName }];

        // Check if county is now fully selected
        const allCitiesInCounty = getCitiesInCounty(regionName, countyName);
        const countyNowFull = allCitiesInCounty.every((cityData) =>
          newCities.some((c) => c.city === cityData.name)
        );
        if (countyNowFull && !newCounties.some((c) => c.region === regionName && c.county === countyName)) {
          newCounties = [...newCounties, { region: regionName, county: countyName }];
        }

        // Check if region is now fully selected
        if (countyNowFull) {
          const allCountiesInRegion = getCountyNamesInRegion(regionName);
          const regionNowFull = allCountiesInRegion.every((cn) =>
            newCounties.some((c) => c.region === regionName && c.county === cn)
          );
          if (regionNowFull && !newRegions.includes(regionName)) {
            newRegions = [...newRegions, regionName];
          }
        }
      }

      return {
        ...prev,
        geographicCities: newCities,
        geographicRegions: newRegions,
        geographicCounties: newCounties
      };
    });
  };

  // Use addressLine1, or fall back to legacy address field
  const displayAddressLine1 = addressLine1 || address;

  // Check if we have any address info to display
  const hasAddress = displayAddressLine1 || addressLine2 || city || state || zipCode;

  // Collect all badge indicators
  const badges = [];
  if (crisisServices) badges.push("Crisis Services");
  if (spanishSpeaking) badges.push("Spanish Speaking");
  if (transportationProvided) badges.push("Transportation");
  if (interpretationAvailable) badges.push("Interpretation Available");

  return (
    <article className={`border-b border-gray-200 pb-8 mb-8 last:border-b-0 relative ${isUnavailable && !isEditing ? "opacity-50" : ""}`}>

      {/* Save/Cancel Buttons - Top */}
      {isEditing && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-red text-white font-semibold rounded hover:bg-brand-red-hover transition-colors disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400 transition-colors disabled:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Entry Status Selection - Edit Mode */}
      {isEditing && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Entry Status</h4>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            {/* Complete vs Stub - Radio buttons */}
            <div className="flex flex-wrap gap-4 mb-2">
              {Object.entries(ENTRY_STATUSES).map(([statusKey, statusInfo]) => (
                <label key={statusKey} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="entryStatus"
                    value={statusKey}
                    checked={(editedData.entryStatus || "complete") === statusKey}
                    onChange={(e) => updateField("entryStatus", e.target.value)}
                    className="h-4 w-4 border-gray-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <span className="text-sm text-gray-700">{statusInfo.label}</span>
                </label>
              ))}
            </div>

            {/* Unavailable - Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer mt-3">
              <input
                type="checkbox"
                checked={editedData.isUnavailable || false}
                onChange={(e) => updateField("isUnavailable", e.target.checked)}
                className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red rounded"
              />
              <span className="text-sm text-gray-700">Currently Unavailable</span>
            </label>
          </div>
        </div>
      )}

      {/* Header with Logo (left) and Name (right) - aligned to top */}
      <div className="flex items-start gap-4 mb-2 mt-[50px]">
        {/* Logo or placeholder - with upload in edit mode */}
        {isEditing ? (
          <div className="flex-shrink-0">
            {/* Hidden file input */}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
            />

            {/* Logo preview or upload button */}
            {logoPreview || logoUrl ? (
              <div className="relative">
                <img
                  src={logoPreview || logoUrl}
                  alt={`${name} logo`}
                  className="w-20 h-20 object-contain border border-gray-200 rounded"
                />
                <button
                  type="button"
                  onClick={handleClearLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-brand-blue text-white rounded-full p-1 hover:bg-brand-blue-dark"
                >
                  <PhotoIcon className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:border-brand-blue hover:text-brand-blue transition-colors"
              >
                <PhotoIcon className="h-6 w-6" />
                <span className="text-xs mt-1">Add Logo</span>
              </button>
            )}
            {logoUrl && !logoPreview && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="mt-1 text-xs text-red-500 hover:text-red-700"
              >
                Remove logo
              </button>
            )}
            {uploadingLogo && (
              <p className="text-xs text-gray-500 mt-1">Uploading...</p>
            )}
          </div>
        ) : logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="max-w-[150px] h-auto flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-gray-400">
              {name?.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1">
          {isEditing ? (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full text-2xl font-bold text-brand-blue-dark mb-2 px-3 py-2 border border-gray-300 rounded-md"
              />
              <select
                value={organizationType || ""}
                onChange={(e) => updateField("organizationType", e.target.value)}
                className="w-full text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Organization Type</option>
                {ORGANIZATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <h2 className="text-[36px] font-bold text-brand-blue-dark leading-tight">
                {name}
              </h2>
              {organizationType && (
                <p className="text-[18px] font-medium text-gray-600">{organizationType}</p>
              )}
              {/* Service Domains as pipe-separated text */}
              {serviceDomains.length > 0 && (
                <p className="text-xs mt-4">
                  {serviceDomains.map((domain, index) => (
                    <span key={domain}>
                      <span className="text-brand-red">{domain}</span>
                      {index < serviceDomains.length - 1 && (
                        <span className="text-brand-gray"> | </span>
                      )}
                    </span>
                  ))}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Address below name - displayed as separate lines */}
      {!isEditing && hasAddress && (
        <div className="text-sm text-gray-600">
          {displayAddressLine1 && <p>{displayAddressLine1}</p>}
          {addressLine2 && <p>{addressLine2}</p>}
          {(city || state || zipCode) && (
            <p>
              {city}{city && state ? ", " : ""}{state}{(city || state) && zipCode ? " " : ""}{zipCode}
            </p>
          )}
        </div>
      )}

      {/* Contact Info with icons - vertical layout with 30px spacing from address */}
      {!isEditing && (contactPhone || contactFax || contactEmail || website) && (
        <div className="mt-[30px] space-y-1 mb-4">
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex items-start gap-2 hover:text-brand-red transition-colors"
            >
              <PhoneIcon className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700">{contactPhone}</span>
            </a>
          )}
          {contactFax && (
            <div className="flex items-start gap-2">
              <PrinterIcon className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700">{contactFax}</span>
            </div>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 hover:text-brand-red transition-colors"
            >
              <GlobeAltIcon className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700">{website}</span>
            </a>
          )}
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-start gap-2 hover:text-brand-red transition-colors"
            >
              <EnvelopeIcon className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <span className="text-sm font-bold text-gray-700">{contactEmail}</span>
            </a>
          )}
        </div>
      )}

      {/* Amazon Wishlist Button */}
      {!isEditing && amazonWishlistUrl && (
        <div className="mb-4">
          <a
            href={amazonWishlistUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition-colors"
          >
            <img src="/icons/amazon.png" alt="" className="h-4 w-4 flex-shrink-0" />
            Amazon Wishlist
          </a>
        </div>
      )}


      {/* Service Area Section - shows region/county/cities with county map */}
      {!isEditing && geographicCities?.length > 0 && (
        <div className="mt-[35px] mb-6 p-4 bg-gray-50 rounded-lg">
          {/* Top row: Region/County on left, Map on right */}
          <div className="flex items-start justify-between gap-4">
            {/* Region/County list on left */}
            <div className="flex-1">
              <h3 className="text-[18px] font-bold text-brand-blue-dark mb-2">
                Service Area
              </h3>
              {(() => {
                const selectedRegions = resource.geographicRegions || [];
                const uniqueRegions = [...new Set(geographicCities.map(c => c.region))];
                const uniqueCounties = [...new Set(geographicCities.map(c => c.county))];
                const allRegionNames = getRegionNames();

                // Check if statewide (all regions selected)
                const isStadewide = resource.statewide === true ||
                  (selectedRegions.length === allRegionNames.length &&
                   allRegionNames.every(r => selectedRegions.includes(r)));

                if (isStadewide) {
                  return (
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-brand-blue-dark">Statewide</p>
                      <p className="text-gray-500">All Massachusetts communities</p>
                    </div>
                  );
                }

                // Determine if we should show full region data
                let showFullRegion = false;

                // If geographicRegions explicitly set
                if (selectedRegions.length > 0 && uniqueRegions.length === 1) {
                  showFullRegion = true;
                }
                // Or if multiple counties within one region
                else if (uniqueCounties.length > 1 && uniqueRegions.length === 1) {
                  showFullRegion = true;
                }
                // Or if all counties in the region are represented (fallback for legacy data)
                else if (uniqueRegions.length === 1) {
                  const regionName = uniqueRegions[0];
                  const regionData = MA_GEOGRAPHIC_DATA[regionName];
                  if (regionData) {
                    const allCountiesInRegion = Object.keys(regionData.counties);
                    const hasAllCounties = allCountiesInRegion.every(county =>
                      uniqueCounties.includes(county)
                    );
                    if (hasAllCounties) {
                      showFullRegion = true;
                    }
                  }
                }

                // If full region selected, show ALL counties from geography data
                if (showFullRegion) {
                  const regionName = uniqueRegions[0];
                  const regionData = MA_GEOGRAPHIC_DATA[regionName];
                  const allCounties = regionData ? Object.keys(regionData.counties) : [];

                  return (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>{regionName}</p>
                      {allCounties.map((county) => (
                        <p key={county}>{county} County</p>
                      ))}
                    </div>
                  );
                }

                // Otherwise use what's stored in geographicCities
                return (
                  <div className="text-sm text-gray-700 space-y-1">
                    {uniqueRegions.map((region) => (
                      <p key={region}>{region}</p>
                    ))}
                    {uniqueCounties.map((county) => (
                      <p key={county}>{county} County</p>
                    ))}
                  </div>
                );
              })()}
            </div>
            {/* Map image on right - show region map if multiple counties or region is fully selected, otherwise county map */}
            {(() => {
              const uniqueCounties = [...new Set(geographicCities.map(c => c.county))];
              const uniqueRegions = [...new Set(geographicCities.map(c => c.region))];
              const selectedRegions = resource.geographicRegions || [];
              const allRegionNames = getRegionNames();

              // Check if statewide - show Massachusetts state map
              const isStatewide = resource.statewide === true ||
                (selectedRegions.length === allRegionNames.length &&
                 allRegionNames.every(r => selectedRegions.includes(r)));

              if (isStatewide) {
                return (
                  <img
                    src="/regions/statewide.png"
                    alt="Statewide - All Massachusetts"
                    className="h-auto object-contain flex-shrink-0"
                    style={{ maxWidth: 'min(540px, 50%)' }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                );
              }

              // Special case: Western Mass + Berkshires combined
              const hasWesternMass = uniqueRegions.includes("Western Mass") || selectedRegions.includes("Western Mass");
              const hasBerkshires = uniqueRegions.includes("Berkshires") || selectedRegions.includes("Berkshires");

              if (hasWesternMass && hasBerkshires) {
                return (
                  <img
                    src="/regions/western-berks.png"
                    alt="Western Mass & Berkshires"
                    className="h-auto object-contain flex-shrink-0"
                    style={{ maxWidth: 'min(540px, 50%)' }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                );
              }

              // Check if we should show region map
              let showRegionMap = false;

              // If geographicRegions explicitly set
              if (selectedRegions.length > 0 && uniqueRegions.length === 1) {
                showRegionMap = true;
              }
              // Or if multiple counties within one region
              else if (uniqueCounties.length > 1 && uniqueRegions.length === 1) {
                showRegionMap = true;
              }
              // Or if all counties in the region are represented (fallback for legacy data)
              else if (uniqueRegions.length === 1) {
                const regionName = uniqueRegions[0];
                const regionData = MA_GEOGRAPHIC_DATA[regionName];
                if (regionData) {
                  const allCountiesInRegion = Object.keys(regionData.counties);
                  const hasAllCounties = allCountiesInRegion.every(county =>
                    uniqueCounties.includes(county)
                  );
                  if (hasAllCounties) {
                    showRegionMap = true;
                  }
                }
              }

              if (showRegionMap) {
                const region = uniqueRegions[0];
                return (
                  <img
                    src={`/regions/${region.toLowerCase().replace(/\s+/g, "-")}.png`}
                    alt={region}
                    className="h-auto object-contain flex-shrink-0"
                    style={{ maxWidth: 'min(540px, 50%)' }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                );
              }

              // Otherwise show first county's map
              if (geographicCities[0]?.county) {
                return (
                  <img
                    src={`/counties/${geographicCities[0].county.toLowerCase().replace(/\s+/g, "-")}.png`}
                    alt={`${geographicCities[0].county} County`}
                    className="h-auto object-contain flex-shrink-0"
                    style={{ maxWidth: 'min(540px, 50%)' }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                );
              }

              return null;
            })()}
          </div>

          {/* Communities served - full width below, collapsible */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowCommunities(!showCommunities)}
              className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-brand-blue transition-colors"
            >
              {showCommunities ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
              Communities served
              {(() => {
                const selectedRegions = resource.geographicRegions || [];
                const uniqueRegions = [...new Set(geographicCities.map(c => c.region))];
                const uniqueCounties = [...new Set(geographicCities.map(c => c.county))];
                const allRegionNames = getRegionNames();

                // Check if statewide
                const isStatewide = resource.statewide === true ||
                  (selectedRegions.length === allRegionNames.length &&
                   allRegionNames.every(r => selectedRegions.includes(r)));

                if (isStatewide) {
                  // Count all cities in Massachusetts
                  let totalCities = 0;
                  allRegionNames.forEach((regionName) => {
                    totalCities += getCitiesInRegion(regionName).length;
                  });
                  return <span className="text-gray-400 font-normal ml-1">({totalCities})</span>;
                }

                let showFullRegion = false;
                if (selectedRegions.length > 0 && uniqueRegions.length === 1) {
                  showFullRegion = true;
                } else if (uniqueCounties.length > 1 && uniqueRegions.length === 1) {
                  showFullRegion = true;
                } else if (uniqueRegions.length === 1) {
                  const regionName = uniqueRegions[0];
                  const regionData = MA_GEOGRAPHIC_DATA[regionName];
                  if (regionData) {
                    const allCountiesInRegion = Object.keys(regionData.counties);
                    if (allCountiesInRegion.every(county => uniqueCounties.includes(county))) {
                      showFullRegion = true;
                    }
                  }
                }
                const count = showFullRegion
                  ? getCitiesInRegion(uniqueRegions[0]).length
                  : geographicCities.length;
                return <span className="text-gray-400 font-normal ml-1">({count})</span>;
              })()}
            </button>
            {showCommunities && (
              <div className="mt-2">
                {(() => {
                  const selectedRegions = resource.geographicRegions || [];
                  const uniqueRegions = [...new Set(geographicCities.map(c => c.region))];
                  const uniqueCounties = [...new Set(geographicCities.map(c => c.county))];
                  const allRegionNames = getRegionNames();

                  // Check if statewide
                  const isStatewide = resource.statewide === true ||
                    (selectedRegions.length === allRegionNames.length &&
                     allRegionNames.every(r => selectedRegions.includes(r)));

                  if (isStatewide) {
                    // Show all cities grouped by region
                    return (
                      <div className="space-y-3">
                        {allRegionNames.map((regionName) => (
                          <div key={regionName}>
                            <p className="text-xs font-semibold text-brand-blue-dark mb-1">{regionName}</p>
                            <div className="flex flex-wrap gap-1">
                              {getCitiesInRegion(regionName).map((cityData, index) => (
                                <span key={index} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                  {cityData.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  let showFullRegion = false;
                  if (selectedRegions.length > 0 && uniqueRegions.length === 1) {
                    showFullRegion = true;
                  } else if (uniqueCounties.length > 1 && uniqueRegions.length === 1) {
                    showFullRegion = true;
                  } else if (uniqueRegions.length === 1) {
                    const regionName = uniqueRegions[0];
                    const regionData = MA_GEOGRAPHIC_DATA[regionName];
                    if (regionData) {
                      const allCountiesInRegion = Object.keys(regionData.counties);
                      if (allCountiesInRegion.every(county => uniqueCounties.includes(county))) {
                        showFullRegion = true;
                      }
                    }
                  }

                  const citiesToShow = showFullRegion
                    ? getCitiesInRegion(uniqueRegions[0])
                    : geographicCities;

                  return (
                    <div className="flex flex-wrap gap-1">
                      {citiesToShow.map((cityData, index) => (
                        <span key={index} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                          {cityData.name || cityData.city}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Populations Served - Plum Pills */}
      {!isEditing && populationsServed.length > 0 && (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Populations Served
          </h3>
          <div className="flex flex-wrap gap-2">
            {populationsServed.map((pop) => (
              <span
                key={pop}
                className="px-3 py-1 bg-brand-plum text-white text-xs font-medium rounded-full"
              >
                {pop}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Access & Eligibility (moved before About) - two column layout */}
      {!isEditing && (accessMethods.length > 0 || eligibilityConstraints.length > 0) && (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Access & Eligibility
          </h3>
          <div className="grid grid-cols-2 gap-6">
            {accessMethods.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  How to Access:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {accessMethods.map((method) => (
                    <li key={method}>{method}</li>
                  ))}
                </ul>
              </div>
            )}
            {eligibilityConstraints.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Eligibility:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {eligibilityConstraints.map((constraint) => (
                    <li key={constraint}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Special Features Badges */}
      {!isEditing && badges.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="px-3 py-1 bg-brand-plum text-white text-xs font-semibold rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* About / Description */}
      <div className="mt-[35px] mb-4">
        <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
          About
        </h3>
        {isEditing ? (
          <textarea
            value={about || ""}
            onChange={(e) => updateField("about", e.target.value)}
            rows={4}
            className="w-full text-sm text-gray-700 leading-relaxed px-3 py-2 border border-gray-300 rounded-md"
          />
        ) : (
          about && <p className="text-sm text-gray-700 leading-relaxed">{about}</p>
        )}
      </div>

      {/* Services Offered */}
      <div className="mt-[35px] mb-4">
        <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
          Services Offered
        </h3>
        {isEditing ? (
          <textarea
            value={servicesOffered || ""}
            onChange={(e) => updateField("servicesOffered", e.target.value)}
            rows={4}
            className="w-full text-sm text-gray-700 leading-relaxed px-3 py-2 border border-gray-300 rounded-md"
          />
        ) : (
          servicesOffered && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {servicesOffered}
            </p>
          )
        )}
      </div>

      {/* Service Domains - Edit Mode Only */}
      {isEditing && (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Service Categories
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_DOMAINS.map((domain) => (
              <label key={domain} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(editedData.serviceDomains || []).includes(domain)}
                  onChange={() => toggleArrayItem("serviceDomains", domain)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="text-sm text-gray-700">{domain}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Populations Served - Edit Mode Only */}
      {isEditing && (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Populations Served
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {POPULATIONS_SERVED.map((pop) => (
              <label key={pop} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(editedData.populationsServed || []).includes(pop)}
                  onChange={() => toggleArrayItem("populationsServed", pop)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="text-sm text-gray-700">{pop}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Contact Information - Edit Mode Only */}
      {isEditing && (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Contact Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={editedData.addressLine1 ?? ""}
                onChange={(e) => updateField("addressLine1", e.target.value)}
                placeholder="Street address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={editedData.addressLine2 || ""}
                onChange={(e) => updateField("addressLine2", e.target.value)}
                placeholder="Suite, unit, building, floor, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={editedData.city || ""}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={editedData.state || ""}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={editedData.zipCode || ""}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                  placeholder="ZIP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={editedData.contactPhone || ""}
                onChange={(e) => updateField("contactPhone", e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Fax
              </label>
              <input
                type="tel"
                value={editedData.contactFax || ""}
                onChange={(e) => updateField("contactFax", e.target.value)}
                placeholder="(555) 555-5555"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editedData.contactEmail || ""}
                onChange={(e) => updateField("contactEmail", e.target.value)}
                placeholder="contact@organization.org"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Website
              </label>
              <input
                type="url"
                value={editedData.website || ""}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://example.org"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Amazon Wishlist URL
              </label>
              <input
                type="url"
                value={editedData.amazonWishlistUrl || ""}
                onChange={(e) => updateField("amazonWishlistUrl", e.target.value)}
                placeholder="https://www.amazon.com/hz/wishlist/ls/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Access & Eligibility - Edit Mode Only */}
      {isEditing && (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Access & Eligibility
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                How to Access:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ACCESS_METHODS.map((method) => (
                  <label key={method} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(editedData.accessMethods || []).includes(method)}
                      onChange={() => toggleArrayItem("accessMethods", method)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Eligibility Constraints:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ELIGIBILITY_CONSTRAINTS.map((constraint) => (
                  <label key={constraint} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(editedData.eligibilityConstraints || []).includes(constraint)}
                      onChange={() => toggleArrayItem("eligibilityConstraints", constraint)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">{constraint}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      {isEditing ? (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Additional Information
          </h3>
          <textarea
            value={additionalInfo || ""}
            onChange={(e) => updateField("additionalInfo", e.target.value)}
            placeholder="Additional information about this resource..."
            rows={4}
            className="w-full text-sm text-gray-700 leading-relaxed px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      ) : (
        additionalInfo && (
          <div className="mt-[35px] mb-4">
            <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
              Additional Information
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {additionalInfo}
            </p>
          </div>
        )
      )}

      {/* Communities Served - Edit Mode Only */}
      {isEditing && (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Communities served
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-300 rounded-md p-3">
            {/* Statewide option */}
            <div className="border-b-2 border-brand-blue pb-3 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStatewideSelected()}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = isStatewidePartiallySelected();
                    }
                  }}
                  onChange={toggleStatewide}
                  className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="text-sm font-bold text-brand-blue-dark">
                  Statewide (All Massachusetts)
                </span>
              </label>
            </div>

            {getRegionNames().map((regionName) => (
              <div key={regionName} className="border-b border-gray-200 last:border-b-0 pb-2 last:pb-0">
                {/* Region Checkbox and Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isRegionFullySelected(regionName)}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = isRegionPartiallySelected(regionName);
                      }
                    }}
                    onChange={() => toggleRegionSelection(regionName)}
                    className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red"
                  />
                  <button
                    type="button"
                    onClick={() => toggleRegion(regionName)}
                    className="flex items-center gap-1 flex-1 text-left py-1 hover:bg-gray-50 rounded"
                  >
                    {openRegions[regionName] ? (
                      <ChevronDownIcon className="h-4 w-4 text-brand-blue" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4 text-brand-blue" />
                    )}
                    <span className="text-sm font-semibold text-brand-blue-dark">
                      {regionName}
                    </span>
                  </button>
                </div>

                {/* Counties in Region */}
                {openRegions[regionName] && (
                  <div className="ml-6 mt-1 space-y-1">
                    {getCountyNamesInRegion(regionName).map((countyName) => {
                      const countyKey = `${regionName}-${countyName}`;
                      return (
                        <div key={countyKey}>
                          {/* County Checkbox and Toggle */}
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isCountyFullySelected(regionName, countyName)}
                              ref={(el) => {
                                if (el) {
                                  el.indeterminate = isCountyPartiallySelected(regionName, countyName);
                                }
                              }}
                              onChange={() => toggleCountySelection(regionName, countyName)}
                              className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red"
                            />
                            <button
                              type="button"
                              onClick={() => toggleCounty(countyKey)}
                              className="flex items-center gap-1 flex-1 text-left py-1 hover:bg-gray-50 rounded"
                            >
                              {openCounties[countyKey] ? (
                                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                {countyName} County
                              </span>
                            </button>
                          </div>

                          {/* Cities in County */}
                          {openCounties[countyKey] && (
                            <div className="ml-6 mt-1 space-y-1">
                              {getCitiesInCounty(regionName, countyName).map((cityData) => (
                                <label
                                  key={cityData.name}
                                  className="flex items-center gap-2 py-1 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isCitySelected(cityData.name)}
                                    onChange={() =>
                                      toggleCity(
                                        cityData.name,
                                        cityData.zipCodes,
                                        countyName,
                                        regionName
                                      )
                                    }
                                    className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red"
                                  />
                                  <span className="text-sm text-gray-700">
                                    {cityData.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save/Cancel Buttons - Bottom */}
      {isEditing && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-red text-white font-semibold rounded hover:bg-brand-red-hover transition-colors disabled:bg-gray-400"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400 transition-colors disabled:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      )}
    </article>
  );
}
