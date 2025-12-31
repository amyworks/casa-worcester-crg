import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateUser } from "../firebase/firestore";
import { getResources } from "../firebase/firestore";
import { PencilSquareIcon } from "@heroicons/react/24/solid";

export default function Profile() {
  const { user, userRecord } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [managedResources, setManagedResources] = useState([]);
  const [formData, setFormData] = useState({
    agency: "",
    phone: "",
    bio: "",
  });

  useEffect(() => {
    if (userRecord) {
      setFormData({
        agency: userRecord.agency || "",
        phone: userRecord.phone || "",
        bio: userRecord.bio || "",
      });
    }
  }, [userRecord]);

  useEffect(() => {
    if (userRecord?.role === "manager" && userRecord?.managedResources?.length > 0) {
      // Fetch the managed resources
      const fetchManagedResources = async () => {
        const allResources = await getResources();
        const managed = allResources.filter((resource) =>
          userRecord.managedResources.includes(resource.id)
        );
        setManagedResources(managed);
      };
      fetchManagedResources();
    }
  }, [userRecord]);

  const handleSave = async () => {
    try {
      await updateUser(user.uid, {
        agency: formData.agency,
        phone: formData.phone,
        bio: formData.bio,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      agency: userRecord?.agency || "",
      phone: userRecord?.phone || "",
      bio: userRecord?.bio || "",
    });
    setIsEditing(false);
  };

  if (!user || !userRecord) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-brand-gray">Loading profile...</p>
      </div>
    );
  }

  const getRoleDisplay = (role) => {
    if (role === "admin") return "Administrator";
    if (role === "contributor") return "Contributor";
    if (role === "manager") return "Manager";
    return role;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="w-20 h-20 rounded-full"
            />
          )}
          <div>
            <h1 className="text-[32px] font-bold text-brand-blueDark">
              {user.displayName || "User Profile"}
            </h1>
            <p className="text-brand-gray mt-1">{user.email}</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-red text-brand-white font-semibold rounded hover:bg-brand-redHover transition-colors"
          >
            <PencilSquareIcon className="w-5 h-5" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Personal Information Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
          Personal Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
              Name
            </label>
            <p className="text-brand-blueDark">{user.displayName || "Not provided"}</p>
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
              Email
            </label>
            <p className="text-brand-blueDark">{user.email}</p>
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
              Agency Affiliation
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.agency}
                onChange={(e) =>
                  setFormData({ ...formData, agency: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
              />
            ) : (
              <p className="text-brand-blueDark">{formData.agency || "Not provided"}</p>
            )}
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
              />
            ) : (
              <p className="text-brand-blueDark">{formData.phone || "Not provided"}</p>
            )}
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
              />
            ) : (
              <p className="text-brand-blueDark whitespace-pre-wrap">
                {formData.bio || "Not provided"}
              </p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-brand-red text-brand-white font-semibold rounded hover:bg-brand-redHover transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-brand-blueDark font-semibold rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Permissions Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
          Permissions & Access
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
              Role
            </label>
            <p className="text-brand-blueDark">{getRoleDisplay(userRecord.role)}</p>
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
              Account Status
            </label>
            <p className="text-brand-blueDark">
              {userRecord.isApproved ? (
                <span className="text-green-600 font-semibold">Approved</span>
              ) : (
                <span className="text-yellow-600 font-semibold">Pending Approval</span>
              )}
            </p>
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
              Capabilities
            </label>
            <ul className="list-disc list-inside text-brand-blueDark space-y-1">
              {userRecord.role === "admin" && (
                <>
                  <li>Add and edit all resources</li>
                  <li>Approve access requests</li>
                  <li>Manage user permissions</li>
                  <li>Assign resources to managers</li>
                </>
              )}
              {userRecord.role === "contributor" && (
                <>
                  <li>Add new resources</li>
                  <li>Edit unassigned resources</li>
                  <li>Suggest edits to managed resources</li>
                </>
              )}
              {userRecord.role === "manager" && (
                <>
                  <li>Edit assigned resources</li>
                  <li>Approve edit suggestions for assigned resources</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Managed Resources Section (only for managers) */}
      {userRecord.role === "manager" && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
            Managed Resources
          </h2>
          {managedResources.length > 0 ? (
            <ul className="space-y-3">
              {managedResources.map((resource) => (
                <li
                  key={resource.id}
                  className="flex items-start justify-between p-3 border border-gray-200 rounded"
                >
                  <div>
                    <p className="font-semibold text-brand-blueDark">{resource.name}</p>
                    {resource.city && (
                      <p className="text-[14px] text-brand-gray">
                        {resource.city}, {resource.state}
                      </p>
                    )}
                  </div>
                  {resource.website && (
                    <a
                      href={resource.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-blue hover:text-brand-blueDark text-[14px] underline"
                    >
                      Visit Site
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-brand-gray">No resources assigned yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
