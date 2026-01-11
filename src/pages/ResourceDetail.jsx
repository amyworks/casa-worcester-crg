import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getResources, deleteResource, deleteResourceLogo } from "../firebase/firestore";
import ResourceGuideEntry from "../components/resources/ResourceGuideEntry";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        const data = await getResources();
        const found = data.find((r) => r.id === id);
        if (found) {
          setResource(found);
        } else {
          setError("Resource not found");
        }
      } catch (err) {
        console.error("Error fetching resource:", err);
        setError("Failed to load resource");
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Delete the logo from storage if it exists
      if (resource.logoUrl) {
        try {
          await deleteResourceLogo(resource.logoUrl);
        } catch (logoError) {
          console.error("Error deleting logo:", logoError);
          // Continue with resource deletion even if logo deletion fails
        }
      }

      // Delete the resource document
      await deleteResource(id);

      // Navigate back to the listings page
      navigate("/browse");
    } catch (err) {
      console.error("Error deleting resource:", err);
      setError("Failed to delete resource. Please try again.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white px-6 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Navigation Bar - Back Button and Edit Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-brand-blue-dark hover:text-brand-red transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Results
          </button>

          {/* Edit Button - only for admins, only in view mode */}
          {isAdmin && !isEditing && !loading && !error && resource && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-red text-white text-sm font-medium rounded hover:bg-brand-red-hover transition-colors"
            >
              Edit
              <PencilSquareIcon className="h-4 w-4" />
            </button>
          )}

          {/* Delete Button - only for admins, only in edit mode (buried to avoid accidental deletion) */}
          {isAdmin && isEditing && !loading && !error && resource && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 transition-colors"
            >
              Delete
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-brand-blue-dark mb-2">
                Delete Resource?
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>{resource?.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400 transition-colors disabled:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors disabled:bg-gray-400"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center text-gray-600 py-12">
            Loading resource details...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Resource Details */}
        {!loading && !error && resource && (
          <ResourceGuideEntry
            resource={resource}
            isEditing={isEditing}
            onEditingChange={setIsEditing}
          />
        )}
      </div>
    </div>
  );
}

