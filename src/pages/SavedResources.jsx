import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getResources } from "../firebase/firestore";
import ResourceGuideCard from "../components/resources/ResourceGuideCard";
import { ResourceBrowseSkeleton } from "../components/ui/Skeleton";
import { BookmarkIcon } from "@heroicons/react/24/solid";

export default function SavedResources() {
  const { user, loading: authLoading, bookmarks } = useAuth();
  const [bookmarkedResources, setBookmarkedResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookmarks && bookmarks.length > 0) {
      const fetchBookmarkedResources = async () => {
        setLoading(true);
        const allResources = await getResources();
        const bookmarked = allResources.filter((resource) =>
          bookmarks.includes(resource.id)
        );
        setBookmarkedResources(bookmarked);
        setLoading(false);
      };
      fetchBookmarkedResources();
    } else {
      setBookmarkedResources([]);
      setLoading(false);
    }
  }, [bookmarks]);

  // Redirect to sign in if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/signin" replace />;
  }

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-brand-gray">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white px-6 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BookmarkIcon className="w-8 h-8" style={{ color: "#F2AF29" }} />
          <h1 className="text-[32px] font-bold text-brand-blueDark">
            Saved Resources
          </h1>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-6">
            <ResourceBrowseSkeleton count={3} />
          </div>
        )}

        {/* Empty State */}
        {!loading && bookmarkedResources.length === 0 && (
          <div className="text-center py-12">
            <BookmarkIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-brand-gray text-lg mb-4">
              You haven't saved any resources yet.
            </p>
            <p className="text-gray-500 mb-6">
              Browse resources and click the bookmark icon to save them for quick access.
            </p>
            <Link
              to="/browse"
              className="inline-block px-6 py-2 bg-brand-blue text-white font-semibold rounded hover:bg-brand-blue-dark transition-colors"
            >
              Browse Resources
            </Link>
          </div>
        )}

        {/* Resource List */}
        {!loading && bookmarkedResources.length > 0 && (
          <div>
            <p className="text-brand-gray mb-6">
              {bookmarkedResources.length} saved resource{bookmarkedResources.length !== 1 ? "s" : ""}
            </p>
            <div className="divide-y divide-gray-200">
              {bookmarkedResources.map((resource) => (
                <ResourceGuideCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
