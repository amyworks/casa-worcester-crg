import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getResources, deleteResource, deleteResourceLogo, lockResource, unlockResource, getManagers } from "../firebase/firestore";
import ResourceGuideEntry from "../components/resources/ResourceGuideEntry";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/solid";

export default function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isContributor, isManager, canEditResource, userRecord } = useAuth();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [lockingResource, setLockingResource] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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

  // Handle opening lock modal (fetch managers for dropdown)
  const handleOpenLockModal = async () => {
    try {
      const managersData = await getManagers();
      setManagers(managersData);
      setSelectedManagerId("");
      setShowLockModal(true);
    } catch (err) {
      console.error("Error fetching managers:", err);
      setError("Failed to load managers.");
    }
  };

  // Handle locking the resource
  const handleLockResource = async () => {
    try {
      setLockingResource(true);
      await lockResource(id, selectedManagerId || null);
      // Refresh resource data
      const data = await getResources();
      const found = data.find((r) => r.id === id);
      if (found) setResource(found);
      setShowLockModal(false);
    } catch (err) {
      console.error("Error locking resource:", err);
      setError("Failed to lock resource.");
    } finally {
      setLockingResource(false);
    }
  };

  // Handle unlocking the resource
  const handleUnlockResource = async () => {
    try {
      setLockingResource(true);
      await unlockResource(id);
      // Refresh resource data
      const data = await getResources();
      const found = data.find((r) => r.id === id);
      if (found) setResource(found);
    } catch (err) {
      console.error("Error unlocking resource:", err);
      setError("Failed to unlock resource.");
    } finally {
      setLockingResource(false);
    }
  };

  // Check if current user can edit this specific resource
  const userCanEdit = resource ? canEditResource(resource) : false;

  // Determine if lock icon should be shown
  // Superadmins always see it, Contributors only see it when locked
  const showLockIcon = isAdmin || (isContributor && resource?.isLocked) || isManager;

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

          {/* Lock Icon and Edit Button - for authorized users, only in view mode */}
          {!isEditing && !loading && !error && resource && (isAdmin || isContributor || isManager) && (
            <div className="flex items-center gap-2">
              {/* Lock Icon - view/clickable based on role */}
              {showLockIcon && (
                <>
                  {resource.isLocked ? (
                    // Locked state - black lock
                    <button
                      onClick={isAdmin ? handleUnlockResource : undefined}
                      disabled={!isAdmin || lockingResource}
                      className={`p-1.5 rounded ${
                        isAdmin
                          ? "hover:bg-gray-100 cursor-pointer"
                          : "cursor-default"
                      }`}
                      title={isAdmin ? "Click to unlock" : "Resource is locked"}
                    >
                      <LockClosedIcon className="h-5 w-5 text-gray-900" />
                    </button>
                  ) : (
                    // Unlocked state - gray lock (only superadmins can click)
                    isAdmin && (
                      <button
                        onClick={handleOpenLockModal}
                        disabled={lockingResource}
                        className="p-1.5 rounded hover:bg-gray-100"
                        title="Click to lock and assign manager"
                      >
                        <LockOpenIcon className="h-5 w-5 text-gray-400" />
                      </button>
                    )
                  )}
                </>
              )}

              {/* Edit Button */}
              <div
                className="relative"
                onMouseEnter={() => !userCanEdit && resource?.isLocked && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <button
                  onClick={() => userCanEdit && setIsEditing(true)}
                  disabled={!userCanEdit}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    userCanEdit
                      ? "bg-brand-red text-white hover:bg-brand-red-hover"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Edit
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                {/* Tooltip for disabled edit button */}
                {showTooltip && !userCanEdit && resource?.isLocked && (
                  <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                    Only managers can edit this resource
                  </div>
                )}
              </div>
            </div>
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

        {/* Lock Resource Modal */}
        {showLockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-brand-blue-dark mb-2">
                Lock Resource
              </h3>
              <p className="text-gray-600 mb-4">
                Locking this resource will restrict editing access. You can optionally assign a manager who will be able to edit it.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Manager (optional)
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">No manager assigned</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name || manager.email}
                    </option>
                  ))}
                </select>
                {managers.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No managers available. Only superadmins will be able to edit this resource.
                  </p>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLockModal(false)}
                  disabled={lockingResource}
                  className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400 transition-colors disabled:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLockResource}
                  disabled={lockingResource}
                  className="px-4 py-2 bg-brand-blue text-white font-medium rounded hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400"
                >
                  {lockingResource ? "Locking..." : "Lock Resource"}
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

