import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  PhotoIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { addResource, uploadResourceLogo } from "../firebase/firestore";
import {
  getRegionNames,
  getCountyNamesInRegion,
  getCitiesInCounty,
} from "../data/massachusettsGeography";

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

export default function AddResource() {
  const navigate = useNavigate();
  const { userRecord, isAdmin } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    organizationType: "",
    serviceDomains: [],
    logoUrl: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "MA",
    zipCode: "",
    contactPhone: "",
    contactFax: "",
    contactEmail: "",
    website: "",
    amazonWishlistUrl: "",
    statewide: false,
    geographicCities: [],
    geographicRegions: [],
    geographicCounties: [],
    populationsServed: [],
    accessMethods: [],
    eligibilityConstraints: [],
    about: "",
    servicesOffered: "",
    additionalInfo: "",
    crisisServices: false,
    spanishSpeaking: false,
    transportationProvided: false,
    interpretationAvailable: false,
    entryStatus: "stub", // Default new entries to stub (incomplete)
    isUnavailable: false, // Separate availability flag
  });

  // Logo upload state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  // Geographic selection state
  const [openRegions, setOpenRegions] = useState({});
  const [openCounties, setOpenCounties] = useState({});

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-2xl font-bold text-brand-blue-dark mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You must be an administrator to add new resources.
          </p>
        </div>
      </div>
    );
  }

  // Handle logo file selection
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.warning("Please select an image file");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("Image must be less than 2MB");
        return;
      }
      setLogoFile(file);
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
      logoInputRef.current.value = "";
    }
  };

  // Update a single field
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle an item in an array field
  const toggleArrayItem = (field, item) => {
    setFormData((prev) => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter((i) => i !== item)
        : [...currentArray, item];
      return { ...prev, [field]: newArray };
    });
  };

  // Geographic selection helpers
  const toggleRegion = (regionName) => {
    setOpenRegions((prev) => ({ ...prev, [regionName]: !prev[regionName] }));
  };

  const toggleCounty = (countyKey) => {
    setOpenCounties((prev) => ({ ...prev, [countyKey]: !prev[countyKey] }));
  };

  const isCitySelected = (cityName) => {
    return formData.geographicCities.some((c) => c.city === cityName);
  };

  const isCountyFullySelected = (regionName, countyName) => {
    const cities = getCitiesInCounty(regionName, countyName);
    return cities.every((cityData) => isCitySelected(cityData.name));
  };

  const isCountyPartiallySelected = (regionName, countyName) => {
    const cities = getCitiesInCounty(regionName, countyName);
    return (
      cities.some((cityData) => isCitySelected(cityData.name)) &&
      !isCountyFullySelected(regionName, countyName)
    );
  };

  const isRegionFullySelected = (regionName) => {
    const countyNames = getCountyNamesInRegion(regionName);
    return countyNames.every((countyName) =>
      isCountyFullySelected(regionName, countyName)
    );
  };

  const isRegionPartiallySelected = (regionName) => {
    const countyNames = getCountyNamesInRegion(regionName);
    return (
      countyNames.some((countyName) => {
        const cities = getCitiesInCounty(regionName, countyName);
        return cities.some((cityData) => isCitySelected(cityData.name));
      }) && !isRegionFullySelected(regionName)
    );
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
      setFormData((prev) => ({
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

      setFormData((prev) => ({
        ...prev,
        statewide: true,
        geographicCities: allCities,
        geographicRegions: allRegions,
        geographicCounties: allCounties,
      }));
    }
  };

  const toggleRegionSelection = (regionName) => {
    const isSelected = isRegionFullySelected(regionName);
    const countyNames = getCountyNamesInRegion(regionName);

    setFormData((prev) => {
      let currentCities = prev.geographicCities || [];
      let currentRegions = prev.geographicRegions || [];
      let currentCounties = prev.geographicCounties || [];

      if (isSelected) {
        currentCities = currentCities.filter((c) => c.region !== regionName);
        currentRegions = currentRegions.filter((r) => r !== regionName);
        currentCounties = currentCounties.filter((c) => c.region !== regionName);
      } else {
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
        if (!currentRegions.includes(regionName)) {
          currentRegions.push(regionName);
        }
        countyNames.forEach((countyName) => {
          if (
            !currentCounties.some(
              (c) => c.region === regionName && c.county === countyName
            )
          ) {
            currentCounties.push({ region: regionName, county: countyName });
          }
        });
      }

      return {
        ...prev,
        geographicCities: currentCities,
        geographicRegions: currentRegions,
        geographicCounties: currentCounties,
      };
    });
  };

  const toggleCountySelection = (regionName, countyName) => {
    const isSelected = isCountyFullySelected(regionName, countyName);
    const cities = getCitiesInCounty(regionName, countyName);

    setFormData((prev) => {
      let currentCities = prev.geographicCities || [];
      let currentRegions = prev.geographicRegions || [];
      let currentCounties = prev.geographicCounties || [];

      if (isSelected) {
        currentCities = currentCities.filter(
          (c) => !(c.county === countyName && c.region === regionName)
        );
        currentCounties = currentCounties.filter(
          (c) => !(c.region === regionName && c.county === countyName)
        );
        const allCountiesInRegion = getCountyNamesInRegion(regionName);
        const stillFullySelected = allCountiesInRegion.every((cn) =>
          cn === countyName
            ? false
            : currentCounties.some(
                (c) => c.region === regionName && c.county === cn
              )
        );
        if (!stillFullySelected) {
          currentRegions = currentRegions.filter((r) => r !== regionName);
        }
      } else {
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
        if (
          !currentCounties.some(
            (c) => c.region === regionName && c.county === countyName
          )
        ) {
          currentCounties.push({ region: regionName, county: countyName });
        }
        const allCountiesInRegion = getCountyNamesInRegion(regionName);
        const allSelected = allCountiesInRegion.every((cn) =>
          currentCounties.some(
            (c) => c.region === regionName && c.county === cn
          )
        );
        if (allSelected && !currentRegions.includes(regionName)) {
          currentRegions.push(regionName);
        }
      }

      return {
        ...prev,
        geographicCities: currentCities,
        geographicRegions: currentRegions,
        geographicCounties: currentCounties,
      };
    });
  };

  const toggleCity = (cityName, zipCodes, countyName, regionName) => {
    const exists = formData.geographicCities.some((c) => c.city === cityName);

    if (!exists) {
      setOpenRegions((prev) => ({ ...prev, [regionName]: true }));
      setOpenCounties((prev) => ({
        ...prev,
        [`${regionName}-${countyName}`]: true,
      }));
    }

    setFormData((prev) => {
      let newCities = prev.geographicCities || [];
      let newRegions = prev.geographicRegions || [];
      let newCounties = prev.geographicCounties || [];

      if (exists) {
        newCities = newCities.filter((c) => c.city !== cityName);

        const allCitiesInCounty = getCitiesInCounty(regionName, countyName);
        const countyStillFull = allCitiesInCounty.every((cityData) =>
          cityData.name === cityName
            ? false
            : newCities.some((c) => c.city === cityData.name)
        );
        if (!countyStillFull) {
          newCounties = newCounties.filter(
            (c) => !(c.region === regionName && c.county === countyName)
          );
        }
        if (!countyStillFull) {
          newRegions = newRegions.filter((r) => r !== regionName);
        }
      } else {
        newCities = [
          ...newCities,
          { city: cityName, zipCodes, county: countyName, region: regionName },
        ];

        const allCitiesInCounty = getCitiesInCounty(regionName, countyName);
        const countyNowFull = allCitiesInCounty.every((cityData) =>
          newCities.some((c) => c.city === cityData.name)
        );
        if (
          countyNowFull &&
          !newCounties.some(
            (c) => c.region === regionName && c.county === countyName
          )
        ) {
          newCounties = [
            ...newCounties,
            { region: regionName, county: countyName },
          ];
        }

        if (countyNowFull) {
          const allCountiesInRegion = getCountyNamesInRegion(regionName);
          const regionNowFull = allCountiesInRegion.every((cn) =>
            newCounties.some(
              (c) => c.region === regionName && c.county === cn
            )
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
        geographicCounties: newCounties,
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Organization name is required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Create the resource first to get the ID
      const resourceData = {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: userRecord?.id || null,
        updatedAt: new Date().toISOString(),
        updatedBy: userRecord?.id || null,
      };

      const docRef = await addResource(resourceData);

      // If there's a logo file, upload it and update the resource
      if (logoFile) {
        setUploadingLogo(true);
        try {
          const logoUrl = await uploadResourceLogo(docRef.id, logoFile);
          // The uploadResourceLogo function handles updating the resource
          resourceData.logoUrl = logoUrl;
        } catch (uploadError) {
          console.error("Error uploading logo:", uploadError);
          // Continue without logo if upload fails
        }
        setUploadingLogo(false);
      }

      // Navigate to the new resource's detail page
      navigate(`/resource/${docRef.id}`);
    } catch (err) {
      console.error("Error creating resource:", err);
      setError("Failed to create resource. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white px-6 py-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-[36px] font-bold text-brand-blue-dark mb-8">
          Add New Resource
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Entry Status Section */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              Entry Status
            </h2>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              {/* Complete vs Stub - Radio buttons */}
              <div className="flex flex-wrap gap-4 mb-2">
                {Object.entries(ENTRY_STATUSES).map(([statusKey, statusInfo]) => (
                  <label key={statusKey} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="entryStatus"
                      value={statusKey}
                      checked={formData.entryStatus === statusKey}
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
                  checked={formData.isUnavailable}
                  onChange={(e) => updateField("isUnavailable", e.target.checked)}
                  className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red rounded"
                />
                <span className="text-sm text-gray-700">Currently Unavailable</span>
              </label>
            </div>
          </section>

          {/* Section 1: Basic Info (Logo + Name + Org Type + Service Domains) */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              Basic Information
            </h2>

            <div className="flex items-start gap-4 mb-6">
              {/* Logo Upload */}
              <div className="flex-shrink-0">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />

                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
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
                {uploadingLogo && (
                  <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                )}
              </div>

              {/* Name and Org Type */}
              <div className="flex-1 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Enter organization name"
                    className="w-full text-xl font-bold text-brand-blue-dark px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Organization Type
                  </label>
                  <select
                    value={formData.organizationType}
                    onChange={(e) =>
                      updateField("organizationType", e.target.value)
                    }
                    className="w-full text-sm text-gray-600 px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Organization Type</option>
                    {ORGANIZATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Service Domains */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Service Categories
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_DOMAINS.map((domain) => (
                  <label key={domain} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.serviceDomains.includes(domain)}
                      onChange={() => toggleArrayItem("serviceDomains", domain)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">{domain}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Address */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              Address
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={formData.addressLine1}
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
                  value={formData.addressLine2}
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
                    value={formData.city}
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
                    value={formData.state}
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
                    value={formData.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                    placeholder="ZIP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Contact Information */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              Contact Information
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      updateField("contactPhone", e.target.value)
                    }
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
                    value={formData.contactFax}
                    onChange={(e) => updateField("contactFax", e.target.value)}
                    placeholder="(555) 555-5555"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
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
                  value={formData.website}
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
                  value={formData.amazonWishlistUrl}
                  onChange={(e) =>
                    updateField("amazonWishlistUrl", e.target.value)
                  }
                  placeholder="https://www.amazon.com/hz/wishlist/ls/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Service Area */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              Service Area
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select the communities this organization serves.
            </p>
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
                <div
                  key={regionName}
                  className="border-b border-gray-200 last:border-b-0 pb-2 last:pb-0"
                >
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
                                checked={isCountyFullySelected(
                                  regionName,
                                  countyName
                                )}
                                ref={(el) => {
                                  if (el) {
                                    el.indeterminate = isCountyPartiallySelected(
                                      regionName,
                                      countyName
                                    );
                                  }
                                }}
                                onChange={() =>
                                  toggleCountySelection(regionName, countyName)
                                }
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
                                {getCitiesInCounty(regionName, countyName).map(
                                  (cityData) => (
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
                                  )
                                )}
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
          </section>

          {/* Section 5: Populations Served */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              Populations Served
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {POPULATIONS_SERVED.map((pop) => (
                <label key={pop} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.populationsServed.includes(pop)}
                    onChange={() => toggleArrayItem("populationsServed", pop)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-sm text-gray-700">{pop}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Section 6: Access & Eligibility */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              Access & Eligibility
            </h2>
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
                        checked={formData.accessMethods.includes(method)}
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
                        checked={formData.eligibilityConstraints.includes(
                          constraint
                        )}
                        onChange={() =>
                          toggleArrayItem("eligibilityConstraints", constraint)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      <span className="text-sm text-gray-700">{constraint}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Special Features */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              Special Features
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.crisisServices}
                  onChange={(e) =>
                    updateField("crisisServices", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="text-sm text-gray-700">Crisis Services</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.spanishSpeaking}
                  onChange={(e) =>
                    updateField("spanishSpeaking", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="text-sm text-gray-700">Spanish Speaking</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.transportationProvided}
                  onChange={(e) =>
                    updateField("transportationProvided", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="text-sm text-gray-700">
                  Transportation Provided
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.interpretationAvailable}
                  onChange={(e) =>
                    updateField("interpretationAvailable", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <span className="text-sm text-gray-700">
                  Interpretation Available
                </span>
              </label>
            </div>
          </section>

          {/* Section 8: About & Services */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              About & Services
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  About
                </label>
                <textarea
                  value={formData.about}
                  onChange={(e) => updateField("about", e.target.value)}
                  placeholder="Describe the organization..."
                  rows={4}
                  className="w-full text-sm text-gray-700 leading-relaxed px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Services Offered
                </label>
                <textarea
                  value={formData.servicesOffered}
                  onChange={(e) =>
                    updateField("servicesOffered", e.target.value)
                  }
                  placeholder="List the services this organization provides..."
                  rows={4}
                  className="w-full text-sm text-gray-700 leading-relaxed px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </section>

          {/* Section 9: Additional Information */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-brand-blue-dark mb-4">
              Additional Information
            </h2>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => updateField("additionalInfo", e.target.value)}
              placeholder="Any additional information about this resource..."
              rows={4}
              className="w-full text-sm text-gray-700 leading-relaxed px-3 py-2 border border-gray-300 rounded-md"
            />
          </section>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-brand-red text-white font-semibold rounded hover:bg-brand-red-hover transition-colors disabled:bg-gray-400"
            >
              {saving ? "Creating..." : "Create Resource"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={saving}
              className="px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded hover:bg-gray-400 transition-colors disabled:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
