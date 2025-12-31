import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon, FunnelIcon } from "@heroicons/react/24/solid";

export default function ResourceGuideFilters({ filters, onFiltersChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    serviceDomains: false,
    populationsServed: false,
    geographicCoverage: false,
    organizationType: false,
    accessMethods: false,
    eligibilityConstraints: false,
    secondaryFilters: false,
  });
  const [cityZipInput, setCityZipInput] = useState("");

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Filter options from data model
  const serviceDomainOptions = [
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
  ];

  const populationOptions = [
    "Infants and toddlers",
    "Young children",
    "Adolescents",
    "Transition-Age Youth",
    "Adults",
    "Families",
    "Survivors of Domestic Violence",
    "Foster / Kinship Families",
    "Individuals with Disabilities",
    "Immigrants / Refugees",
    "Justice-Involved Individuals",
    "Low-Income / Housing-Insecure Individuals",
  ];

  const geographicOptions = [
    "City-specific",
    "County-wide",
    "Regional",
    "Statewide",
    "Multi-state / National",
  ];

  const countyOptions = [
    "Worcester",
    "Middlesex",
    "Hampden",
    "Norfolk",
    "Hampshire",
    "Franklin",
    "Essex",
    "Bristol",
    "Suffolk",
    "Plymouth",
    "Barnstable",
    "Dukes",
    "Nantucket",
  ];

  const regionalOptions = [
    "Greater Boston Area",
    "Metrowest",
    "South Shore",
    "Cape & Islands",
    "North Shore",
    "Central",
    "Western",
    "Berkshires",
  ];

  const organizationTypeOptions = [
    "Nonprofit Organization",
    "Government Agency",
    "Community-Based Organization",
    "Faith-Based Organization",
    "Mutual Aid / Grassroots",
    "Healthcare Provider",
    "Educational Organization",
  ];

  const accessMethodOptions = [
    "Self-Referral",
    "Professional Referral Required",
    "Agency Referral Only",
    "Walk-In",
    "Appointment Required",
    "Online Request",
    "Phone Request",
    "Emergency / Crisis Access",
  ];

  const eligibilityOptions = [
    "Age Restrictions",
    "Income-Based Eligibility",
    "Residency Requirements",
    "Documentation Required",
    "Waitlist Likely",
    "Limited Capacity",
    "Emergency-Only",
  ];

  // Handle multi-select changes
  const handleMultiSelectChange = (field, value) => {
    const current = filters[field] || [];
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [field]: updated });
  };

  // Handle single-select changes
  const handleSingleSelectChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: filters[field] === value ? "" : value,
    });
  };

  // Handle geographic sub-option changes
  const handleGeographicSubOption = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  // Handle city/zip input submission
  const handleCityZipSubmit = (e) => {
    e.preventDefault();
    if (cityZipInput.trim()) {
      onFiltersChange({
        ...filters,
        geographicCityZip: cityZipInput.trim(),
      });
    }
  };

  // Handle boolean checkbox changes
  const handleBooleanChange = (field) => {
    onFiltersChange({ ...filters, [field]: !filters[field] });
  };

  // Clear all filters
  const handleClearAll = () => {
    onFiltersChange({
      serviceDomains: [],
      populationsServed: [],
      geographicCoverage: "",
      organizationType: "",
      accessMethods: [],
      eligibilityConstraints: [],
      crisisServices: false,
      spanishSpeaking: false,
      transportationProvided: false,
      interpretationAvailable: false,
    });
  };

  // Count active filters
  const activeFilterCount = [
    ...(filters.serviceDomains || []),
    ...(filters.populationsServed || []),
    filters.geographicCoverage,
    filters.organizationType,
    ...(filters.accessMethods || []),
    ...(filters.eligibilityConstraints || []),
    filters.crisisServices,
    filters.spanishSpeaking,
    filters.transportationProvided,
    filters.interpretationAvailable,
  ].filter(Boolean).length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Filter Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-brand-blue" />
          <span className="text-sm font-bold text-brand-blue-dark">Filters</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-brand-red px-2 py-0.5 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {/* Filter Content */}
      {isOpen && (
        <div className="border-t border-gray-200 p-4">
          <div className="space-y-4">
            {/* Service Domains (Multi-select) */}
            <div className="border-b border-gray-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection("serviceDomains")}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-sm font-bold text-brand-blue-dark">
                  Service Type
                </h3>
                {expandedSections.serviceDomains ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {expandedSections.serviceDomains && (
                <div className="mt-3 space-y-2">
                  {serviceDomainOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(filters.serviceDomains || []).includes(option)}
                        onChange={() => handleMultiSelectChange("serviceDomains", option)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Populations Served (Multi-select) */}
            <div className="border-b border-gray-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection("populationsServed")}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-sm font-bold text-brand-blue-dark">
                  Population Served
                </h3>
                {expandedSections.populationsServed ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {expandedSections.populationsServed && (
                <div className="mt-3 space-y-2">
                  {populationOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(filters.populationsServed || []).includes(option)}
                        onChange={() => handleMultiSelectChange("populationsServed", option)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Geographic Coverage (Single-select with sub-options) */}
            <div className="border-b border-gray-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection("geographicCoverage")}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-sm font-bold text-brand-blue-dark">
                  Geographic Coverage
                </h3>
                {expandedSections.geographicCoverage ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {expandedSections.geographicCoverage && (
                <div className="mt-3 space-y-2">
                  {geographicOptions.map((option) => (
                    <div key={option} className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="geographicCoverage"
                          checked={filters.geographicCoverage === option}
                          onChange={() => handleSingleSelectChange("geographicCoverage", option)}
                          className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red"
                        />
                        <span className="text-sm text-gray-700">{option}</span>
                      </label>

                      {/* City-specific sub-option: Text input for city/zip */}
                      {filters.geographicCoverage === "City-specific" &&
                        option === "City-specific" && (
                          <form onSubmit={handleCityZipSubmit} className="ml-6">
                            <input
                              type="text"
                              value={cityZipInput}
                              onChange={(e) => setCityZipInput(e.target.value)}
                              placeholder="Enter city or zip code"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-brand-blueDark font-medium"
                            />
                          </form>
                        )}

                      {/* County-wide sub-option: Dropdown */}
                      {filters.geographicCoverage === "County-wide" &&
                        option === "County-wide" && (
                          <div className="ml-6">
                            <select
                              value={filters.geographicCounty || ""}
                              onChange={(e) =>
                                handleGeographicSubOption("geographicCounty", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700"
                            >
                              <option value="">Select a county</option>
                              {countyOptions.map((county) => (
                                <option key={county} value={county}>
                                  {county}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                      {/* Regional sub-option: Dropdown */}
                      {filters.geographicCoverage === "Regional" &&
                        option === "Regional" && (
                          <div className="ml-6">
                            <select
                              value={filters.geographicRegion || ""}
                              onChange={(e) =>
                                handleGeographicSubOption("geographicRegion", e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700"
                            >
                              <option value="">Select a region</option>
                              {regionalOptions.map((region) => (
                                <option key={region} value={region}>
                                  {region}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Organization Type (Single-select) */}
            <div className="border-b border-gray-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection("organizationType")}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-sm font-bold text-brand-blue-dark">
                  Organization Type
                </h3>
                {expandedSections.organizationType ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {expandedSections.organizationType && (
                <div className="mt-3 space-y-2">
                  {organizationTypeOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="organizationType"
                        checked={filters.organizationType === option}
                        onChange={() => handleSingleSelectChange("organizationType", option)}
                        className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Access Methods (Multi-select) */}
            <div className="border-b border-gray-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection("accessMethods")}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-sm font-bold text-brand-blue-dark">
                  How to Access
                </h3>
                {expandedSections.accessMethods ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {expandedSections.accessMethods && (
                <div className="mt-3 space-y-2">
                  {accessMethodOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(filters.accessMethods || []).includes(option)}
                        onChange={() => handleMultiSelectChange("accessMethods", option)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Eligibility Constraints (Multi-select) */}
            <div className="border-b border-gray-100 pb-4">
              <button
                type="button"
                onClick={() => toggleSection("eligibilityConstraints")}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-sm font-bold text-brand-blue-dark">
                  Eligibility & Requirements
                </h3>
                {expandedSections.eligibilityConstraints ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {expandedSections.eligibilityConstraints && (
                <div className="mt-3 space-y-2">
                  {eligibilityOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(filters.eligibilityConstraints || []).includes(option)}
                        onChange={() => handleMultiSelectChange("eligibilityConstraints", option)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Secondary Filters (Boolean checkboxes) */}
            <div className="pb-4">
              <button
                type="button"
                onClick={() => toggleSection("secondaryFilters")}
                className="flex w-full items-center justify-between text-left"
              >
                <h3 className="text-sm font-bold text-brand-blue-dark">
                  Additional Services
                </h3>
                {expandedSections.secondaryFilters ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-600" />
                )}
              </button>
              {expandedSections.secondaryFilters && (
                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.crisisServices || false}
                      onChange={() => handleBooleanChange("crisisServices")}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">Crisis/Emergency services available</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.spanishSpeaking || false}
                      onChange={() => handleBooleanChange("spanishSpeaking")}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">Spanish-speaking services</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.transportationProvided || false}
                      onChange={() => handleBooleanChange("transportationProvided")}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">Transportation provided</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.interpretationAvailable || false}
                      onChange={() => handleBooleanChange("interpretationAvailable")}
                      className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700">Interpretation/translation available</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Clear All Button */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="mt-6 w-full rounded-lg border border-gray-300 bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
