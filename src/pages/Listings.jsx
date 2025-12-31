import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getResources } from "../firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import ResourceGuideCard from "../components/resources/ResourceGuideCard";
import ResourceSearchBar from "../components/resources/ResourceSearchBar";
import ResourceGuideFilters from "../components/resources/ResourceGuideFilters";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function Listings() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const params = new URLSearchParams(search);
  const q = params.get("q");

  const mode = pathname === "/search" ? "search" : "browse";

  const [resources, setResources] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"
  const [filters, setFilters] = useState({
    serviceDomains: [],
    populationsServed: [],
    geographicCoverage: "",
    geographicCityZip: "",
    geographicCounty: "",
    geographicRegion: "",
    organizationType: "",
    accessMethods: [],
    eligibilityConstraints: [],
    crisisServices: false,
    spanishSpeaking: false,
    transportationProvided: false,
    interpretationAvailable: false,
  });

  useEffect(() => {
    // Only fetch if in browse mode OR if in search mode with a query
    if (mode === "browse" || (mode === "search" && q)) {
      const fetchResources = async () => {
        try {
          setLoading(true);
          const data = await getResources();
          setAllResources(data);
          
          // Filter by search query if in search mode
          let filtered = data;
          if (mode === "search" && q) {
            const queryLower = q.toLowerCase();
            filtered = data.filter((resource) => {
              return (
                resource.name?.toLowerCase().includes(queryLower) ||
                resource.about?.toLowerCase().includes(queryLower) ||
                resource.servicesOffered?.toLowerCase().includes(queryLower) ||
                resource.serviceDomains?.some((domain) =>
                  domain.toLowerCase().includes(queryLower)
                )
              );
            });
          }
          
          setResources(filtered);
          setError(null);
        } catch (err) {
          console.error("Error fetching resources:", err);
          setError("Failed to load resources. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchResources();
    } else {
      // Clear results if no query in search mode
      setResources([]);
      setAllResources([]);
      setLoading(false);
    }
  }, [mode, q]);

  // Apply filters to resources
  useEffect(() => {
    if (allResources.length === 0) return;

    let filtered = [...allResources];

    // Apply search query filter first if in search mode
    if (mode === "search" && q) {
      const queryLower = q.toLowerCase();
      filtered = filtered.filter((resource) => {
        return (
          resource.name?.toLowerCase().includes(queryLower) ||
          resource.about?.toLowerCase().includes(queryLower) ||
          resource.servicesOffered?.toLowerCase().includes(queryLower) ||
          resource.serviceDomains?.some((domain) =>
            domain.toLowerCase().includes(queryLower)
          )
        );
      });
    }

    // Service Domains filter
    if (filters.serviceDomains.length > 0) {
      filtered = filtered.filter((resource) =>
        filters.serviceDomains.some((domain) =>
          resource.serviceDomains?.includes(domain)
        )
      );
    }

    // Populations Served filter
    if (filters.populationsServed.length > 0) {
      filtered = filtered.filter((resource) =>
        filters.populationsServed.some((pop) =>
          resource.populationsServed?.includes(pop)
        )
      );
    }

    // Geographic Coverage filter
    if (filters.geographicCoverage) {
      // Apply sub-filters based on coverage type
      if (filters.geographicCoverage === "City-specific" && filters.geographicCityZip) {
        const searchTerm = filters.geographicCityZip.toLowerCase().trim();
        filtered = filtered.filter((resource) => {
          // Check geographicCities array for city name or zip code matches
          if (resource.geographicCities && resource.geographicCities.length > 0) {
            return resource.geographicCities.some((cityData) => {
              const cityMatch = cityData.city?.toLowerCase().includes(searchTerm);
              const zipMatch = cityData.zipCodes?.some((zip) => zip.includes(searchTerm));
              return cityMatch || zipMatch;
            });
          }
          // Fallback to old fields if they exist
          const cityMatch = resource.city?.toLowerCase().includes(searchTerm);
          const zipMatch = resource.zipCode?.toString().includes(searchTerm);
          return cityMatch || zipMatch;
        });
      }

      if (filters.geographicCoverage === "County-wide" && filters.geographicCounty) {
        filtered = filtered.filter((resource) => {
          // Check geographicCounties array for county match
          if (resource.geographicCounties && resource.geographicCounties.length > 0) {
            return resource.geographicCounties.some(
              (countyData) => countyData.county === filters.geographicCounty
            );
          }
          // Check geographicCities array for any city in the selected county
          if (resource.geographicCities && resource.geographicCities.length > 0) {
            return resource.geographicCities.some(
              (cityData) => cityData.county === filters.geographicCounty
            );
          }
          // Fallback to old field if it exists
          return resource.county === filters.geographicCounty;
        });
      }

      if (filters.geographicCoverage === "Regional" && filters.geographicRegion) {
        filtered = filtered.filter((resource) => {
          // Check geographicRegions array for region match
          if (resource.geographicRegions && resource.geographicRegions.length > 0) {
            return resource.geographicRegions.includes(filters.geographicRegion);
          }
          // Check geographicCities array for any city in the selected region
          if (resource.geographicCities && resource.geographicCities.length > 0) {
            return resource.geographicCities.some(
              (cityData) => cityData.region === filters.geographicRegion
            );
          }
          // Fallback to old field if it exists
          return resource.region === filters.geographicRegion;
        });
      }
    }

    // Organization Type filter
    if (filters.organizationType) {
      filtered = filtered.filter(
        (resource) => resource.organizationType === filters.organizationType
      );
    }

    // Access Methods filter
    if (filters.accessMethods.length > 0) {
      filtered = filtered.filter((resource) =>
        filters.accessMethods.some((method) =>
          resource.accessMethods?.includes(method)
        )
      );
    }

    // Eligibility Constraints filter
    if (filters.eligibilityConstraints.length > 0) {
      filtered = filtered.filter((resource) =>
        filters.eligibilityConstraints.some((constraint) =>
          resource.eligibilityConstraints?.includes(constraint)
        )
      );
    }

    // Boolean filters
    if (filters.crisisServices) {
      filtered = filtered.filter((resource) => resource.crisisServices === true);
    }
    if (filters.spanishSpeaking) {
      filtered = filtered.filter((resource) => resource.spanishSpeaking === true);
    }
    if (filters.transportationProvided) {
      filtered = filtered.filter(
        (resource) => resource.transportationProvided === true
      );
    }
    if (filters.interpretationAvailable) {
      filtered = filtered.filter(
        (resource) => resource.interpretationAvailable === true
      );
    }

    // Sort alphabetically by organization name
    filtered.sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      if (sortOrder === "asc") {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    setResources(filtered);
  }, [filters, allResources, mode, q, sortOrder]);

  const handleSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="bg-white px-6 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-brand-blue-dark">
            {mode === "search" ? "Search Resources" : "Browse Resources"}
          </h1>
          {isAdmin && (
            <Link
              to="/add-resource"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red text-white text-sm font-medium rounded hover:bg-brand-red-hover transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Resource
            </Link>
          )}
        </div>

        {/* Search Bar - only on search page */}
        {mode === "search" && (
          <div className="mt-6">
            <ResourceSearchBar
              placeholder="Search resources"
              onSearch={handleSearch}
            />
          </div>
        )}

        {/* Query display for search results */}
        {mode === "search" && q && (
          <p className="mt-4 text-sm text-gray-600">
            Showing results for: <span className="font-semibold">{q}</span>
          </p>
        )}

        {/* Filters Bar */}
        <div className="mt-6">
          <ResourceGuideFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Show prompt if search page without query */}
        {mode === "search" && !q && !loading && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
            <p className="font-semibold">Enter a search term to find resources</p>
            <p className="mt-2 text-sm">
              Search by organization name, service type, or category
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-8 flex items-center justify-center gap-3 text-gray-600">
            <Cog6ToothIcon className="h-6 w-6 text-brand-red animate-spin" />
            <span>Loading resources...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Results - only show if we have a query (search) or if browse mode */}
        {!loading && !error && (mode === "browse" || q) && (
          <>
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {resources.length} {resources.length === 1 ? "resource" : "resources"} found
              </div>
              {resources.length > 0 && (
                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="flex items-center gap-2 text-sm font-semibold text-brand-blue-dark hover:text-brand-red transition-colors"
                  title={sortOrder === "asc" ? "Sort Z to A" : "Sort A to Z"}
                >
                  <span>Sort by name</span>
                  {sortOrder === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {resources.length > 0 ? (
              <div className="mt-6 space-y-4">
                {resources.map((resource) => (
                  <ResourceGuideCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
                {mode === "search" ? (
                  <>
                    <p className="font-semibold">No results found</p>
                    <p className="mt-2 text-sm">
                      Try adjusting your search terms or browse all resources
                    </p>
                  </>
                ) : (
                  <p>No resources available at this time.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
