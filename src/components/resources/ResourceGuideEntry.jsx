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
  BookmarkIcon,
} from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { updateResource, uploadResourceLogo, addBookmark, removeBookmark } from "../../firebase/firestore";
import {
  getRegionNames,
  getCountyNamesInRegion,
  getCitiesInCounty,
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
  "Online Resource",
];

export default function ResourceGuideEntry({ resource, isEditing: externalIsEditing, onEditingChange }) {
  const { userRecord, user, bookmarks } = useAuth();
  const toast = useToast();
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [bookmarkSaving, setBookmarkSaving] = useState(false);
  const [showBookmarkTooltip, setShowBookmarkTooltip] = useState(false);

  const isBookmarked = bookmarks.includes(resource.id);

  const handleBookmarkClick = async () => {
    if (!user || bookmarkSaving) return;

    setBookmarkSaving(true);
    try {
      if (isBookmarked) {
        await removeBookmark(user.uid, resource.id);
      } else {
        await addBookmark(user.uid, resource.id);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setBookmarkSaving(false);
    }
  };

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
    contactVP,
    contactForm,
    contactCrisis,
    contactCrisisHours,
    website,
    crisisServices,
    spanishSpeaking,
    transportationProvided,
    interpretationAvailable,
    geographicCities = [], // Array of {city, zipCodes, county, region}
    geographicOffices = [], // Array of city names where org has offices
    organizationType,
    accessMethods = [],
    eligibilityConstraints = [],
    additionalInfo,
    amazonWishlistUrl,
    isUnavailable = false, // boolean for availability
  } = isEditing ? editedData : resource;

  // Handle logo file selection
  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.warning('Please select an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.warning('Image must be less than 2MB');
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
          toast.error("Failed to upload logo. Please try again.");
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
      toast.success("Changes saved");
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error("Failed to save changes. Please try again.");
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

      if (exists) {
        // Remove city
        newCities = newCities.filter((c) => c.city !== cityName);
      } else {
        // Add city
        newCities = [...newCities, { city: cityName, zipCodes, county: countyName, region: regionName }];
      }

      return {
        ...prev,
        geographicCities: newCities,
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

      {/* Availability Status - Edit Mode */}
      {isEditing && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Availability</h4>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
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

      {/* Header with Name (left) and Logo (right) - aligned to top */}
      <div className="flex items-start gap-4 mb-2 mt-[50px]">
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

              {/* Special Features Checkboxes */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">Special Features:</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editedData.crisisServices === true}
                      onChange={(e) => updateField("crisisServices", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">Crisis Services</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editedData.spanishSpeaking === true}
                      onChange={(e) => updateField("spanishSpeaking", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">Spanish Speaking</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editedData.interpretationAvailable === true}
                      onChange={(e) => updateField("interpretationAvailable", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">Interpretation Available</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editedData.transportationProvided === true}
                      onChange={(e) => updateField("transportationProvided", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">Transportation Offered</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editedData.autismServices === true}
                      onChange={(e) => updateField("autismServices", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">Autism Services</span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3">
                {/* Bookmark button - left of agency name (icon only) */}
                {user && (
                  <div
                    className="relative flex-shrink-0 mt-2"
                    onMouseEnter={() => setShowBookmarkTooltip(true)}
                    onMouseLeave={() => setShowBookmarkTooltip(false)}
                  >
                    <button
                      onClick={handleBookmarkClick}
                      disabled={bookmarkSaving}
                      className="transition-opacity hover:opacity-80 disabled:opacity-50"
                    >
                      {isBookmarked ? (
                        <BookmarkIcon className="h-7 w-7" style={{ color: "#F2AF29" }} />
                      ) : (
                        <BookmarkOutlineIcon className="h-7 w-7 text-gray-400" />
                      )}
                    </button>
                    {showBookmarkTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                        {isBookmarked ? "Saved" : "Save this resource"}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <h2 className="text-[36px] font-bold text-brand-blue-dark leading-tight">
                    {name}
                  </h2>
                  {organizationType && (
                    <p className="text-[18px] font-medium text-gray-600">{organizationType}</p>
                  )}
                </div>
              </div>
              {/* Special Features Pills */}
              {(resource.crisisServices || resource.spanishSpeaking || resource.interpretationAvailable || resource.transportationProvided || resource.autismServices) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {resource.crisisServices && (
                    <span className="px-3 py-1 bg-brand-plum text-white text-xs font-medium rounded-full">Crisis Services</span>
                  )}
                  {resource.spanishSpeaking && (
                    <span className="px-3 py-1 bg-brand-plum text-white text-xs font-medium rounded-full">Spanish Speaking</span>
                  )}
                  {resource.interpretationAvailable && (
                    <span className="px-3 py-1 bg-brand-plum text-white text-xs font-medium rounded-full">Interpretation Available</span>
                  )}
                  {resource.transportationProvided && (
                    <span className="px-3 py-1 bg-brand-plum text-white text-xs font-medium rounded-full">Transportation Offered</span>
                  )}
                  {resource.autismServices && (
                    <span className="px-3 py-1 bg-brand-plum text-white text-xs font-medium rounded-full">Autism Services</span>
                  )}
                </div>
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
        ) : null}
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
      {!isEditing && (contactPhone || contactFax || contactEmail || contactVP || contactForm || website) && (
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
          {contactVP && (
            <div className="flex items-start gap-2">
              <PhoneIcon className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700"><span className="font-bold">VP/TTY:</span> {contactVP}</span>
            </div>
          )}
          {contactFax && (
            <div className="flex items-start gap-2">
              <PrinterIcon className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700"><span className="font-bold">Fax:</span> {contactFax}</span>
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
          {contactForm && (
            <div className="flex items-start gap-2">
              <GlobeAltIcon className="h-4 w-4 text-brand-blue flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">
                <span className="font-bold">Online contact form:</span>{" "}
                <a
                  href={contactForm}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:text-brand-red transition-colors underline"
                >
                  {contactForm}
                </a>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Crisis Line - displayed prominently if available */}
      {!isEditing && contactCrisis && (
        <div className="mb-4 inline-block p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <PhoneIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Crisis Line: {contactCrisis}</p>
              {contactCrisisHours && (
                <p className="text-xs text-red-600">Available {contactCrisisHours}</p>
              )}
            </div>
          </div>
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
      {!isEditing && (geographicCities?.length > 0 || resource.geographicCoverage === "Nationwide") && (
        <div className="mt-[35px] mb-6 p-4 bg-gray-50 rounded-lg">
          {(() => {
            // Calculate coverage level dynamically based on actual selections
            // Filter out "ghost" cities that don't have valid region/county data
            const selectedCities = (geographicCities || []).filter(c =>
              c.city && c.region && c.county &&
              getRegionNames().includes(c.region) &&
              getCountyNamesInRegion(c.region).includes(c.county)
            );

            // Check for Nationwide first
            if (resource.geographicCoverage === "Nationwide") {
              return (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-[18px] font-bold text-brand-blue-dark mb-2">
                        Service Area
                      </h3>
                      <div className="text-sm text-gray-700">
                        <p className="font-semibold text-brand-blue-dark">Nationwide</p>
                        <p className="text-gray-500">Available across the United States</p>
                      </div>
                    </div>
                    <img
                      src="/regions/statewide.png"
                      alt="Nationwide coverage"
                      className="h-auto object-contain flex-shrink-0"
                      style={{ maxWidth: 'min(540px, 50%)' }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                </>
              );
            }

            // Check for Statewide
            if (resource.statewide === true) {
              return (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-[18px] font-bold text-brand-blue-dark mb-2">
                        Service Area
                      </h3>
                      <div className="text-sm text-gray-700">
                        <p className="font-semibold text-brand-blue-dark">Statewide</p>
                        <p className="text-gray-500">All Massachusetts communities</p>
                      </div>
                    </div>
                    <img
                      src="/regions/statewide.png"
                      alt="Statewide - All Massachusetts"
                      className="h-auto object-contain flex-shrink-0"
                      style={{ maxWidth: 'min(540px, 50%)' }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  </div>
                  {/* Communities served - collapsible */}
                  {selectedCities.length > 0 && (
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
                        <span className="text-gray-400 font-normal ml-1">({selectedCities.length})</span>
                      </button>
                      {showCommunities && (
                        <div className="mt-2 space-y-3">
                          {getRegionNames().map((regionName) => {
                            const citiesInRegion = selectedCities.filter(c => c.region === regionName);
                            if (citiesInRegion.length === 0) return null;
                            return (
                              <div key={regionName}>
                                <p className="text-xs font-semibold text-brand-blue-dark mb-1">{regionName}</p>
                                <div className="flex flex-wrap gap-1">
                                  {citiesInRegion.map((cityData, index) => (
                                    <span key={index} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                      {cityData.city || cityData.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            }

            // Determine coverage level by checking what's fully selected
            // A region is "fully selected" if all its cities are in geographicCities
            const fullySelectedRegions = getRegionNames().filter(regionName => {
              const allCountiesInRegion = getCountyNamesInRegion(regionName);
              const allCitiesInRegion = allCountiesInRegion.flatMap(county =>
                getCitiesInCounty(regionName, county).map(c => c.name)
              );
              const selectedCitiesInRegion = selectedCities
                .filter(c => c.region === regionName)
                .map(c => c.city);
              return allCitiesInRegion.length > 0 &&
                allCitiesInRegion.every(city => selectedCitiesInRegion.includes(city));
            });

            // A county is "fully selected" if all its cities are selected (and region is NOT fully selected)
            const fullySelectedCounties = [];
            getRegionNames().forEach(regionName => {
              if (!fullySelectedRegions.includes(regionName)) {
                getCountyNamesInRegion(regionName).forEach(countyName => {
                  const citiesInCounty = getCitiesInCounty(regionName, countyName);
                  const selectedCitiesInCounty = selectedCities
                    .filter(c => c.region === regionName && c.county === countyName)
                    .map(c => c.city);
                  if (citiesInCounty.length > 0 &&
                      citiesInCounty.every(c => selectedCitiesInCounty.includes(c.name))) {
                    fullySelectedCounties.push({ region: regionName, county: countyName });
                  }
                });
              }
            });

            // Get cities that are selected but NOT part of a fully selected county or region
            const looseCities = selectedCities.filter(cityData => {
              // Not in a fully selected region
              if (fullySelectedRegions.includes(cityData.region)) return false;
              // Not in a fully selected county
              if (fullySelectedCounties.some(c => c.region === cityData.region && c.county === cityData.county)) return false;
              return true;
            });

            // If we have fully selected regions, show regional display
            if (fullySelectedRegions.length > 0) {
              return (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-[18px] font-bold text-brand-blue-dark mb-2">
                        Service Area
                      </h3>
                      <div className="text-sm text-gray-700 space-y-1">
                        {fullySelectedRegions.map((regionName) => (
                          <div key={regionName}>
                            <p className="font-semibold">{regionName}</p>
                            {(() => {
                              const regionData = MA_GEOGRAPHIC_DATA[regionName];
                              const allCounties = regionData ? Object.keys(regionData.counties) : [];
                              return allCounties.map((county) => (
                                <p key={county} className="ml-2 text-gray-500">{county} County</p>
                              ));
                            })()}
                          </div>
                        ))}
                        {/* Also show fully selected counties not in fully selected regions */}
                        {fullySelectedCounties.length > 0 && (
                          <div className="mt-2">
                            {fullySelectedCounties.map((countyData, index) => (
                              <p key={index}>{countyData.county} County ({countyData.region})</p>
                            ))}
                          </div>
                        )}
                        {/* Also show loose cities */}
                        {looseCities.length > 0 && (
                          <div className="mt-2">
                            <p className="text-gray-500">+ {looseCities.length} additional {looseCities.length === 1 ? 'city' : 'cities'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {fullySelectedRegions.length === 1 && fullySelectedCounties.length === 0 && looseCities.length === 0 ? (
                      <img
                        src={`/regions/${fullySelectedRegions[0].toLowerCase().replace(/\s+/g, "-")}.png`}
                        alt={fullySelectedRegions[0]}
                        className="h-auto object-contain flex-shrink-0"
                        style={{ maxWidth: 'min(540px, 50%)' }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <img
                        src="/regions/statewide.png"
                        alt="Multiple regions"
                        className="h-auto object-contain flex-shrink-0"
                        style={{ maxWidth: 'min(540px, 50%)' }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                  </div>
                  {/* Communities served - collapsible */}
                  {selectedCities.length > 0 && (
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
                        <span className="text-gray-400 font-normal ml-1">({selectedCities.length})</span>
                      </button>
                      {showCommunities && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedCities.map((cityData, index) => (
                            <span key={index} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                              {cityData.city || cityData.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            }

            // If we have fully selected counties (but no fully selected regions), show county display
            if (fullySelectedCounties.length > 0) {
              return (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-[18px] font-bold text-brand-blue-dark mb-2">
                        Service Area
                      </h3>
                      <div className="text-sm text-gray-700 space-y-1">
                        {fullySelectedCounties.map((countyData, index) => (
                          <p key={index}>{countyData.county} County</p>
                        ))}
                        {/* Also show loose cities */}
                        {looseCities.length > 0 && (
                          <div className="mt-2">
                            <p className="text-gray-500">+ {looseCities.length} additional {looseCities.length === 1 ? 'city' : 'cities'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {fullySelectedCounties.length === 1 && looseCities.length === 0 ? (
                      <img
                        src={`/counties/${fullySelectedCounties[0].county.toLowerCase().replace(/\s+/g, "-")}.png`}
                        alt={`${fullySelectedCounties[0].county} County`}
                        className="h-auto object-contain flex-shrink-0"
                        style={{ maxWidth: 'min(540px, 50%)' }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <img
                        src="/regions/statewide.png"
                        alt="Multiple counties"
                        className="h-auto object-contain flex-shrink-0"
                        style={{ maxWidth: 'min(540px, 50%)' }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                  </div>
                  {/* Communities served - collapsible */}
                  {selectedCities.length > 0 && (
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
                        <span className="text-gray-400 font-normal ml-1">({selectedCities.length})</span>
                      </button>
                      {showCommunities && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {selectedCities.map((cityData, index) => (
                            <span key={index} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                              {cityData.city || cityData.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            }

            // Otherwise, just show cities (city-specific mode - no map)
            return (
              <div>
                <h3 className="text-[18px] font-bold text-brand-blue-dark mb-2">
                  Service Area
                </h3>
                <div className="flex flex-wrap gap-1">
                  {selectedCities.map((cityData, index) => (
                    <span key={index} className="text-xs bg-white px-2 py-1 rounded border border-gray-200">
                      {cityData.city || cityData.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Office Locations - View Mode */}
      {!isEditing && geographicOffices && geographicOffices.length > 0 && (
        <div className="mt-[35px] mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-[18px] font-bold text-brand-blue-dark mb-2">
            Office Locations
          </h3>
          <div className="flex flex-wrap gap-2">
            {geographicOffices.map((office, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white text-gray-700 text-sm font-medium rounded border border-gray-200"
              >
                {office}
              </span>
            ))}
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
            <div className="text-sm text-gray-700 leading-relaxed">
              {(() => {
                // Check if the text has the "Category: items; Category2: items" format
                // Pattern: Word(s) followed by colon, then items separated by commas, sections separated by semicolons
                const hasCategories = /^[A-Za-z][A-Za-z\s\/&-]*:\s*.+/.test(servicesOffered.trim());

                if (hasCategories) {
                  // Split by semicolon to get each category section
                  const sections = servicesOffered.split(';').map(s => s.trim()).filter(Boolean);

                  return (
                    <div className="space-y-4">
                      {sections.map((section, sectionIndex) => {
                        // Split each section into category and items
                        const colonIndex = section.indexOf(':');
                        if (colonIndex === -1) {
                          // No colon found, just display as-is
                          return <p key={sectionIndex}>{section}</p>;
                        }

                        const category = section.substring(0, colonIndex).trim();
                        const itemsText = section.substring(colonIndex + 1).trim();
                        const items = itemsText.split(',').map(item => item.trim()).filter(Boolean);

                        return (
                          <div key={sectionIndex}>
                            <p className="font-bold text-gray-800 mb-1">{category}</p>
                            <ul className="list-disc list-inside space-y-0.5 ml-1">
                              {items.map((item, itemIndex) => (
                                <li key={itemIndex}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // No special format detected, display as plain text
                return <p>{servicesOffered}</p>;
              })()}
            </div>
          )
        )}
      </div>

      {/* Access & Eligibility - View Mode - two column layout */}
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
                Videophone / TTY
              </label>
              <input
                type="tel"
                value={editedData.contactVP || ""}
                onChange={(e) => updateField("contactVP", e.target.value)}
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
                Online Contact Form URL
              </label>
              <input
                type="url"
                value={editedData.contactForm || ""}
                onChange={(e) => updateField("contactForm", e.target.value)}
                placeholder="https://example.org/contact"
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

            {/* Crisis Line Section */}
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-2">Crisis Line</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Crisis Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editedData.contactCrisis || ""}
                    onChange={(e) => updateField("contactCrisis", e.target.value)}
                    placeholder="1-800-XXX-XXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Crisis Line Hours
                  </label>
                  <input
                    type="text"
                    value={editedData.contactCrisisHours || ""}
                    onChange={(e) => updateField("contactCrisisHours", e.target.value)}
                    placeholder="24/7 or Mon-Fri 9am-5pm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
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

      {/* Service Area - Edit Mode Only */}
      {isEditing && (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Service Area
          </h3>

          {/* Top-level checkboxes: Nationwide and Statewide */}
          <div className="space-y-3 mb-4">
            {/* Nationwide checkbox */}
            <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100">
              <input
                type="checkbox"
                checked={editedData.geographicCoverage === "Nationwide"}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Set to Nationwide - clear MA-specific data
                    setEditedData((prev) => ({
                      ...prev,
                      geographicCoverage: "Nationwide",
                      statewide: false,
                      geographicRegions: [],
                      geographicCounties: [],
                      geographicCities: [],
                    }));
                  } else {
                    // Uncheck Nationwide - clear coverage
                    setEditedData((prev) => ({
                      ...prev,
                      geographicCoverage: "",
                    }));
                  }
                }}
                className="h-5 w-5 border-gray-300 text-brand-red focus:ring-brand-red rounded"
              />
              <div>
                <span className="text-sm font-semibold text-gray-700">Nationwide</span>
                <p className="text-xs text-gray-500">Available across the United States</p>
              </div>
            </label>

            {/* Statewide checkbox */}
            <label className={`flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 ${editedData.geographicCoverage === "Nationwide" ? "opacity-50" : ""}`}>
              <input
                type="checkbox"
                checked={editedData.statewide === true}
                disabled={editedData.geographicCoverage === "Nationwide"}
                onChange={(e) => {
                  if (e.target.checked) {
                    // Set to Statewide - auto-populate all MA cities
                    const allCities = [];
                    const allRegions = getRegionNames();
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
                      geographicCoverage: "Statewide",
                      statewide: true,
                      geographicRegions: allRegions,
                      geographicCounties: allCounties,
                      geographicCities: allCities,
                    }));
                  } else {
                    // Uncheck Statewide - clear everything
                    setEditedData((prev) => ({
                      ...prev,
                      geographicCoverage: "",
                      statewide: false,
                      geographicRegions: [],
                      geographicCounties: [],
                      geographicCities: [],
                    }));
                  }
                }}
                className="h-5 w-5 border-gray-300 text-brand-red focus:ring-brand-red rounded"
              />
              <div>
                <span className="text-sm font-semibold text-gray-700">Statewide (Massachusetts)</span>
                <p className="text-xs text-gray-500">Serves all Massachusetts communities</p>
              </div>
            </label>
          </div>

          {/* Hierarchical Tree: Region → County → City */}
          <div className={`space-y-2 max-h-[500px] overflow-y-auto border border-gray-300 rounded-md p-3 ${(editedData.geographicCoverage === "Nationwide" || editedData.statewide) ? "opacity-50 pointer-events-none" : ""}`}>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Select specific regions, counties, or cities/towns:
            </p>
            {getRegionNames().map((regionName) => {
              // Check if this region is fully selected (all cities in region are selected)
              const allCountiesInRegion = getCountyNamesInRegion(regionName);
              const allCitiesInRegion = allCountiesInRegion.flatMap(county =>
                getCitiesInCounty(regionName, county).map(c => c.name)
              );
              const selectedCitiesInRegion = (editedData.geographicCities || [])
                .filter(c => c.region === regionName)
                .map(c => c.city);
              const isRegionFullySelected = allCitiesInRegion.length > 0 &&
                allCitiesInRegion.every(city => selectedCitiesInRegion.includes(city));
              const isRegionPartiallySelected = selectedCitiesInRegion.length > 0 && !isRegionFullySelected;

              return (
                <div key={regionName} className="border-b border-gray-200 last:border-b-0 pb-2 last:pb-0">
                  {/* Region Row with Checkbox */}
                  <div className="flex items-center gap-1 py-1">
                    <button
                      type="button"
                      onClick={() => toggleRegion(regionName)}
                      className="p-0.5 hover:bg-gray-100 rounded"
                    >
                      {openRegions[regionName] ? (
                        <ChevronDownIcon className="h-4 w-4 text-brand-blue" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-brand-blue" />
                      )}
                    </button>
                    <label className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-gray-50 rounded py-1 px-1">
                      <input
                        type="checkbox"
                        checked={isRegionFullySelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isRegionPartiallySelected;
                        }}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Select entire region - add all cities/counties in this region
                            const newCities = [...(editedData.geographicCities || [])];
                            const newCounties = [...(editedData.geographicCounties || [])];
                            const newRegions = [...(editedData.geographicRegions || [])];

                            if (!newRegions.includes(regionName)) {
                              newRegions.push(regionName);
                            }

                            allCountiesInRegion.forEach((countyName) => {
                              if (!newCounties.some(c => c.region === regionName && c.county === countyName)) {
                                newCounties.push({ region: regionName, county: countyName });
                              }
                              getCitiesInCounty(regionName, countyName).forEach((cityData) => {
                                if (!newCities.some(c => c.city === cityData.name)) {
                                  newCities.push({
                                    city: cityData.name,
                                    zipCodes: cityData.zipCodes,
                                    county: countyName,
                                    region: regionName,
                                  });
                                }
                              });
                            });

                            setEditedData((prev) => ({
                              ...prev,
                              geographicRegions: newRegions,
                              geographicCounties: newCounties,
                              geographicCities: newCities,
                            }));
                          } else {
                            // Deselect entire region - remove all cities/counties in this region
                            setEditedData((prev) => ({
                              ...prev,
                              geographicRegions: (prev.geographicRegions || []).filter(r => r !== regionName),
                              geographicCounties: (prev.geographicCounties || []).filter(c => c.region !== regionName),
                              geographicCities: (prev.geographicCities || []).filter(c => c.region !== regionName),
                            }));
                          }
                        }}
                        className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red rounded"
                      />
                      <span className={`text-sm font-semibold ${isRegionFullySelected ? "text-brand-red" : "text-brand-blue-dark"}`}>
                        {regionName}
                      </span>
                      {isRegionFullySelected && (
                        <span className="text-xs text-gray-500">(entire region)</span>
                      )}
                    </label>
                  </div>

                  {/* Counties in Region */}
                  {openRegions[regionName] && (
                    <div className="ml-6 mt-1 space-y-1">
                      {allCountiesInRegion.map((countyName) => {
                        const countyKey = `${regionName}-${countyName}`;
                        const citiesInCounty = getCitiesInCounty(regionName, countyName);
                        const selectedCitiesInCounty = (editedData.geographicCities || [])
                          .filter(c => c.region === regionName && c.county === countyName)
                          .map(c => c.city);
                        const isCountyFullySelected = citiesInCounty.length > 0 &&
                          citiesInCounty.every(c => selectedCitiesInCounty.includes(c.name));
                        const isCountyPartiallySelected = selectedCitiesInCounty.length > 0 && !isCountyFullySelected;

                        // County is disabled if region is fully selected
                        const isCountyDisabled = isRegionFullySelected;

                        return (
                          <div key={countyKey}>
                            {/* County Row with Checkbox */}
                            <div className="flex items-center gap-1 py-1">
                              <button
                                type="button"
                                onClick={() => toggleCounty(countyKey)}
                                className="p-0.5 hover:bg-gray-100 rounded"
                              >
                                {openCounties[countyKey] ? (
                                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <ChevronRightIcon className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                              <label className={`flex items-center gap-2 flex-1 cursor-pointer hover:bg-gray-50 rounded py-1 px-1 ${isCountyDisabled ? "opacity-50" : ""}`}>
                                <input
                                  type="checkbox"
                                  checked={isCountyFullySelected}
                                  disabled={isCountyDisabled}
                                  ref={(el) => {
                                    if (el) el.indeterminate = isCountyPartiallySelected && !isCountyDisabled;
                                  }}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      // Select entire county - add all cities in this county
                                      const newCities = [...(editedData.geographicCities || [])];
                                      const newCounties = [...(editedData.geographicCounties || [])];

                                      if (!newCounties.some(c => c.region === regionName && c.county === countyName)) {
                                        newCounties.push({ region: regionName, county: countyName });
                                      }

                                      citiesInCounty.forEach((cityData) => {
                                        if (!newCities.some(c => c.city === cityData.name)) {
                                          newCities.push({
                                            city: cityData.name,
                                            zipCodes: cityData.zipCodes,
                                            county: countyName,
                                            region: regionName,
                                          });
                                        }
                                      });

                                      setEditedData((prev) => ({
                                        ...prev,
                                        geographicCounties: newCounties,
                                        geographicCities: newCities,
                                      }));
                                    } else {
                                      // Deselect entire county - remove all cities in this county
                                      // Also remove from geographicRegions if this was the last county
                                      const newCities = (editedData.geographicCities || [])
                                        .filter(c => !(c.region === regionName && c.county === countyName));
                                      const newCounties = (editedData.geographicCounties || [])
                                        .filter(c => !(c.region === regionName && c.county === countyName));

                                      // Check if any cities remain in this region
                                      const citiesRemainingInRegion = newCities.filter(c => c.region === regionName);
                                      const newRegions = citiesRemainingInRegion.length > 0
                                        ? editedData.geographicRegions || []
                                        : (editedData.geographicRegions || []).filter(r => r !== regionName);

                                      setEditedData((prev) => ({
                                        ...prev,
                                        geographicRegions: newRegions,
                                        geographicCounties: newCounties,
                                        geographicCities: newCities,
                                      }));
                                    }
                                  }}
                                  className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red rounded"
                                />
                                <span className={`text-sm font-medium ${isCountyFullySelected ? "text-brand-red" : "text-gray-700"}`}>
                                  {countyName} County
                                </span>
                                {isCountyFullySelected && !isRegionFullySelected && (
                                  <span className="text-xs text-gray-500">(entire county)</span>
                                )}
                              </label>
                            </div>

                            {/* Cities in County */}
                            {openCounties[countyKey] && (
                              <div className="ml-6 mt-1 space-y-1">
                                {citiesInCounty.map((cityData) => {
                                  const isCityChecked = selectedCitiesInCounty.includes(cityData.name);
                                  // City is disabled if county or region is fully selected
                                  const isCityDisabled = isCountyFullySelected || isRegionFullySelected;

                                  return (
                                    <label
                                      key={cityData.name}
                                      className={`flex items-center gap-2 py-1 px-1 hover:bg-gray-50 rounded cursor-pointer ${isCityDisabled ? "opacity-50" : ""}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isCityChecked}
                                        disabled={isCityDisabled}
                                        onChange={() => {
                                          // Toggle just this city - no effect on parents
                                          toggleCity(
                                            cityData.name,
                                            cityData.zipCodes,
                                            countyName,
                                            regionName
                                          );
                                        }}
                                        className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red rounded"
                                      />
                                      <span className="text-sm text-gray-700">
                                        {cityData.name}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected count */}
          <p className="text-xs text-gray-500 mt-2">
            {(editedData.geographicCities || []).length} cities/towns selected
            {editedData.statewide && " (Statewide)"}
            {editedData.geographicCoverage === "Nationwide" && " (Nationwide)"}
          </p>
        </div>
      )}

      {/* Office Locations - Edit Mode */}
      {isEditing && (
        <div className="mt-[35px] mb-4">
          <h3 className="text-2xl font-bold text-brand-blue-dark mb-2">
            Office Locations
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Cities where this organization has physical offices
          </p>

          {/* Current office locations */}
          {(editedData.geographicOffices || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {(editedData.geographicOffices || []).map((office, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded border border-gray-200"
                >
                  {office}
                  <button
                    type="button"
                    onClick={() => {
                      const newOffices = (editedData.geographicOffices || []).filter((_, i) => i !== index);
                      setEditedData((prev) => ({ ...prev, geographicOffices: newOffices }));
                    }}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add new office location */}
          <div className="flex gap-2">
            <input
              type="text"
              id="newOfficeLocation"
              placeholder="Enter city name (e.g., Worcester)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const value = e.target.value.trim();
                  if (value && !(editedData.geographicOffices || []).includes(value)) {
                    setEditedData((prev) => ({
                      ...prev,
                      geographicOffices: [...(prev.geographicOffices || []), value],
                    }));
                    e.target.value = "";
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById("newOfficeLocation");
                const value = input.value.trim();
                if (value && !(editedData.geographicOffices || []).includes(value)) {
                  setEditedData((prev) => ({
                    ...prev,
                    geographicOffices: [...(prev.geographicOffices || []), value],
                  }));
                  input.value = "";
                }
              }}
              className="px-4 py-2 bg-brand-blue text-white text-sm font-medium rounded hover:bg-brand-blue-dark transition-colors"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Press Enter or click Add to add a location
          </p>
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
