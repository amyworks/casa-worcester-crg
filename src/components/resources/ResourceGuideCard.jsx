import { useState } from "react";
import { Link } from "react-router-dom";
import { EyeIcon, NoSymbolIcon, BookmarkIcon } from "@heroicons/react/24/solid";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { addBookmark, removeBookmark } from "../../firebase/firestore";

export default function ResourceGuideCard({ resource }) {
  const { id, name, city, state, logoUrl, serviceDomains, organizationType, isUnavailable: unavailableFlag } = resource;
  const [showTooltip, setShowTooltip] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user, bookmarks } = useAuth();

  const isBookmarked = bookmarks.includes(id);

  const handleBookmarkClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || saving) return;

    setSaving(true);
    try {
      if (isBookmarked) {
        await removeBookmark(user.uid, id);
      } else {
        await addBookmark(user.uid, id);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setSaving(false);
    }
  };

  // Format location display
  const location = [city, state].filter(Boolean).join(", ");

  // Determine if unavailable
  const isUnavailable = unavailableFlag === true;

  return (
    <Link
      to={`/resource/${id}`}
      className={`block border-t border-gray-200 first:border-t-0 pt-8 pb-5 hover:bg-gray-50 transition-colors ${isUnavailable ? "opacity-50" : ""}`}
    >
      <div className="flex gap-4 items-start">
        {/* Logo */}
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="max-w-12 max-h-12 w-auto h-auto object-contain"
              onError={() => setLogoError(true)}
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

        {/* Status Icons, Save Button, and View Button - right side */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {/* Unavailable icon */}
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

          {/* Save/Bookmark Button - only for logged in users */}
          {user && (
            <div
              className="relative"
              onMouseEnter={() => !isBookmarked && setShowTooltip("save")}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <button
                onClick={handleBookmarkClick}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
              >
                {isBookmarked && (
                  <span className="text-gray-500">Saved</span>
                )}
                {isBookmarked ? (
                  <BookmarkIcon className="h-4 w-4" style={{ color: "#F2AF29" }} />
                ) : (
                  <BookmarkOutlineIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
              {showTooltip === "save" && !isBookmarked && (
                <div className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  Save this resource
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
