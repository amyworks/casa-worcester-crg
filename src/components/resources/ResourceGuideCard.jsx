import { useState } from "react";
import { Link } from "react-router-dom";
import { EyeIcon, ExclamationCircleIcon, StarIcon, NoSymbolIcon } from "@heroicons/react/24/solid";

export default function ResourceGuideCard({ resource }) {
  const { id, name, city, state, logoUrl, serviceDomains, organizationType, entryStatus, isUnavailable: unavailableFlag } = resource;
  const [showTooltip, setShowTooltip] = useState(null);

  // Format location display
  const location = [city, state].filter(Boolean).join(", ");

  // Determine status - entryStatus is "complete" or "stub", isUnavailable is a separate boolean
  const isStub = entryStatus === "stub";
  const isComplete = entryStatus === "complete" || !entryStatus;
  const isUnavailable = unavailableFlag === true;

  return (
    <Link
      to={`/resource/${id}`}
      className={`block border-t border-gray-200 first:border-t-0 pt-8 pb-5 hover:bg-gray-50 transition-colors ${isUnavailable ? "opacity-50" : ""}`}
    >
      <div className="flex gap-4 items-start">
        {/* Logo */}
        <div className="flex-shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="max-w-12 h-auto rounded"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
              <span className="text-lg font-bold text-gray-400">
                {name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Agency Name */}
          <h3 className="text-lg font-bold text-brand-blue-dark leading-tight">{name}</h3>

          {/* Organization Type */}
          {organizationType && (
            <p className="text-sm text-gray-600">{organizationType}</p>
          )}

          {/* Location */}
          {location && (
            <p className="text-sm text-gray-500">{location}</p>
          )}

          {/* Service Domain Tags - matching entry detail style */}
          {serviceDomains && serviceDomains.length > 0 && (
            <p className="mt-2 text-xs">
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
        </div>

        {/* Status Icons and View Button - right side */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {/* Status Icon with Tooltip */}
          {/* Unavailable icon - shown first if applicable */}
          {isUnavailable && (
            <div
              className="relative group"
              onClick={(e) => {
                e.preventDefault();
                setShowTooltip(showTooltip === "unavailable" ? null : "unavailable");
              }}
              onMouseEnter={() => setShowTooltip("unavailable")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <NoSymbolIcon className="h-5 w-5 text-brand-red cursor-help" />
              {showTooltip === "unavailable" && (
                <div className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  Currently Unavailable
                  <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          )}

          {/* Stub icon */}
          {isStub && (
            <div
              className="relative group"
              onClick={(e) => {
                e.preventDefault();
                setShowTooltip(showTooltip === "stub" ? null : "stub");
              }}
              onMouseEnter={() => setShowTooltip("stub")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <ExclamationCircleIcon className="h-5 w-5 text-brand-blue-dark cursor-help" />
              {showTooltip === "stub" && (
                <div className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  Incomplete Entry
                  <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          )}

          {/* Complete icon */}
          {isComplete && (
            <div
              className="relative group"
              onClick={(e) => {
                e.preventDefault();
                setShowTooltip(showTooltip === "complete" ? null : "complete");
              }}
              onMouseEnter={() => setShowTooltip("complete")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <StarIcon className="h-5 w-5 text-brand-blue-dark cursor-help" />
              {showTooltip === "complete" && (
                <div className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  Complete Entry
                  <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          )}

          {/* View Button */}
          <span className="inline-flex items-center gap-1 rounded bg-brand-blue px-2 py-1 text-xs font-medium text-white">
            <EyeIcon className="h-3 w-3" />
            View
          </span>
        </div>
      </div>
    </Link>
  );
}
