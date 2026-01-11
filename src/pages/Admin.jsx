import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getAllUsers,
  getAccessRequests,
  getResources,
  updateUser,
  updateAccessRequest,
  deleteUser,
} from "../firebase/firestore";
import {
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";

export default function Admin() {
  const { userRecord, isAdmin, isContributor, isManager } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [managedResources, setManagedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    role: "",
    managedResources: [],
  });
  const [resourceSearchQuery, setResourceSearchQuery] = useState("");
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showRecentActivity, setShowRecentActivity] = useState(false);
  const [showAccessRequests, setShowAccessRequests] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showRoleBreakdown, setShowRoleBreakdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allResources] = await Promise.all([getResources()]);

        if (isAdmin) {
          const [allUsers, allAccessRequests] = await Promise.all([
            getAllUsers(),
            getAccessRequests(),
          ]);
          setUsers(allUsers.sort((a, b) => a.name?.localeCompare(b.name)));
          setAccessRequests(
            allAccessRequests
              .filter((req) => req.status === "pending")
              .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
          );
        }

        if (isManager && userRecord?.managedResources) {
          const managed = allResources.filter((resource) =>
            userRecord.managedResources.includes(resource.id)
          );
          setManagedResources(managed);
        }

        setResources(allResources);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, isManager, userRecord]);

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditForm({
      role: user.role || "contributor",
      managedResources: user.managedResources || [],
    });
    setResourceSearchQuery("");
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ role: "", managedResources: [] });
    setResourceSearchQuery("");
  };

  const handleSaveUser = async () => {
    try {
      await updateUser(editingUser.id, {
        role: editForm.role,
        managedResources: editForm.managedResources,
      });
      // Refresh users list
      const allUsers = await getAllUsers();
      setUsers(allUsers.sort((a, b) => a.name?.localeCompare(b.name)));
      setEditingUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleAddManagedResource = (resourceId) => {
    if (!editForm.managedResources.includes(resourceId)) {
      setEditForm({
        ...editForm,
        managedResources: [...editForm.managedResources, resourceId],
      });
    }
    setResourceSearchQuery("");
  };

  const handleRemoveManagedResource = (resourceId) => {
    setEditForm({
      ...editForm,
      managedResources: editForm.managedResources.filter((id) => id !== resourceId),
    });
  };

  const handleApproveRequest = async (requestId, requestData) => {
    try {
      // Update the user's role - use userId from the request
      await updateUser(requestData.userId, {
        role: requestData.requestedAccessLevel,
        isApproved: true,
      });

      // Update the request status
      await updateAccessRequest(requestId, {
        status: "approved",
        processedAt: new Date().toISOString(),
        processedBy: userRecord.id,
      });

      // Refresh data
      const [allUsers, allAccessRequests] = await Promise.all([
        getAllUsers(),
        getAccessRequests(),
      ]);
      setUsers(allUsers.sort((a, b) => a.name?.localeCompare(b.name)));
      setAccessRequests(
        allAccessRequests
          .filter((req) => req.status === "pending")
          .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
      );
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleDenyRequest = async (requestId) => {
    try {
      await updateAccessRequest(requestId, {
        status: "denied",
        processedAt: new Date().toISOString(),
        processedBy: userRecord.id,
      });

      // Refresh access requests
      const allAccessRequests = await getAccessRequests();
      setAccessRequests(
        allAccessRequests
          .filter((req) => req.status === "pending")
          .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
      );
    } catch (error) {
      console.error("Error denying request:", error);
    }
  };

  const handleOpenDeleteModal = (user) => {
    setDeleteConfirmModal(user);
    setDeleteConfirmText("");
  };

  const handleCloseDeleteModal = () => {
    setDeleteConfirmModal(null);
    setDeleteConfirmText("");
  };

  const handleDeleteUser = async () => {
    if (deleteConfirmText !== "DELETE USER") {
      return;
    }

    try {
      await deleteUser(deleteConfirmModal.id);
      
      // Refresh users list
      const allUsers = await getAllUsers();
      setUsers(allUsers.sort((a, b) => a.name?.localeCompare(b.name)));
      
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const getRecentResources = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return resources
      .filter((r) => {
        const date = r.updatedAt || r.createdAt;
        if (!date) return false;
        
        const resourceDate = new Date(date);
        // Check if date is valid
        if (isNaN(resourceDate.getTime())) return false;
        
        return resourceDate >= thirtyDaysAgo;
      })
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB - dateA;
      });
  };

  const getResourceStats = () => {
    const total = resources.length;
    const stubs = resources.filter((r) => r.isStub).length;
    const completed = resources.filter((r) => !r.isStub).length;
    const recent = getRecentResources().length;

    return { total, stubs, completed, recent };
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;

    const day = date.toLocaleString("en-US", { timeZone: "America/New_York", day: "2-digit" });
    const month = date.toLocaleString("en-US", { timeZone: "America/New_York", month: "2-digit" });
    const year = date.toLocaleString("en-US", { timeZone: "America/New_York", year: "numeric" });
    const time = date.toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

    return `${month}/${day}/${year} at ${time}`;
  };

  const getUserName = (userId) => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    return user?.name || null;
  };

  const getUserStats = () => {
    const admins = users.filter((u) => u.role === "admin").length;
    const contributors = users.filter((u) => u.role === "contributor").length;
    const managers = users.filter((u) => u.role === "manager").length;
    const volunteers = users.filter((u) => u.role === "casa-volunteer" || u.role === "volunteer").length;
    const staff = users.filter((u) => u.role === "casa-staff").length;
    const affiliates = users.filter((u) => u.role === "agency-affiliate").length;
    const general = users.filter((u) => u.role === "general").length;
    // Admin users = admins + managers + contributors
    const adminUsers = admins + managers + contributors;
    // General users = volunteers + staff + affiliates + general
    const generalUsers = volunteers + staff + affiliates + general;

    return { total: users.length, admins, contributors, managers, volunteers, staff, affiliates, general, adminUsers, generalUsers };
  };

  const filteredResourceOptions = resources.filter(
    (resource) =>
      resourceSearchQuery.trim() !== "" &&
      resource.name.toLowerCase().includes(resourceSearchQuery.toLowerCase()) &&
      !editForm.managedResources.includes(resource.id)
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-brand-gray">Loading...</p>
      </div>
    );
  }

  if (!userRecord?.isApproved) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-brand-red">
          Your account is pending approval. Please wait for an administrator to approve
          your access.
        </p>
      </div>
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-[32px] font-bold text-brand-blueDark mb-8">
          Admin Dashboard
        </h1>

        {/* Delete Confirmation Modal */}
        {deleteConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-[20px] font-bold text-brand-blueDark mb-4">
                Confirm User Deletion
              </h3>
              <p className="text-brand-blueDark mb-4">
                Are you sure you want to delete <strong>{deleteConfirmModal.name}</strong>?
              </p>
              <p className="text-brand-gray text-[14px] mb-4">
                This action cannot be undone. Type <strong>DELETE USER</strong> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE USER"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteConfirmText !== "DELETE USER"}
                  className={`px-4 py-2 font-semibold rounded transition-colors ${
                    deleteConfirmText === "DELETE USER"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Delete User
                </button>
                <button
                  onClick={handleCloseDeleteModal}
                  className="px-4 py-2 bg-gray-200 text-brand-blueDark font-semibold rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Access Requests Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-[20px] font-bold text-brand-blue">Access Requests</h2>
              <span className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full text-[14px] font-bold text-brand-blueDark">
                {accessRequests.length}
              </span>
            </div>
            <button
              onClick={() => setShowAccessRequests(!showAccessRequests)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-600"
            >
              <span className="text-[12px] underline">View Requests</span>
              <EyeIcon className="w-6 h-6" />
            </button>
          </div>

          {showAccessRequests && accessRequests.length > 0 && (
            <div className="space-y-3">
              {accessRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-brand-blueDark">
                      {request.name}
                    </p>
                    <p className="text-[14px] text-brand-gray">{request.email}</p>
                    <p className="text-[14px] text-brand-gray">
                      Agency: {request.agency}
                    </p>
                    <p className="text-[14px] text-brand-gray">
                      Requested Role: {request.requestedAccessLevel}
                    </p>
                    {request.requestReason && (
                      <p className="text-[14px] text-brand-gray mt-2">
                        Reason: {request.requestReason}
                      </p>
                    )}
                    <p className="text-[12px] text-brand-gray mt-2">
                      Requested: {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveRequest(request.id, request)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleDenyRequest(request.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Dashboard */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-brand-blue">Activity</h2>
            <button
              onClick={() => setShowRecentActivity(!showRecentActivity)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-600"
            >
              <span className="text-[12px] underline">View recent activity</span>
              <EyeIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[48px] font-bold text-brand-blue leading-none mb-2">
                {getResourceStats().total}
              </p>
              <p className="text-[14px] font-semibold text-brand-blue">Total Entries</p>
            </div>
            <div className="text-center">
              <p className="text-[48px] font-bold text-brand-plum leading-none mb-2">
                {getResourceStats().recent}
              </p>
              <p className="text-[14px] font-semibold text-brand-blueDark">Added/edited</p>
            </div>
            <div className="text-center">
              <p className="text-[48px] font-bold text-green-600 leading-none mb-2">
                {getResourceStats().completed}
              </p>
              <p className="text-[14px] font-semibold text-brand-blueDark">Complete</p>
            </div>
          </div>

          {/* Recent Activity List */}
          {showRecentActivity && getRecentResources().length > 0 && (
            <div className="divide-y divide-gray-200 mt-6 pt-6 border-t border-gray-200">
              {getRecentResources().map((resource) => {
                const formattedDate = formatDateTime(resource.updatedAt || resource.createdAt);
                if (!formattedDate) return null;

                return (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      {resource.logoUrl ? (
                        <img
                          src={resource.logoUrl}
                          alt={`${resource.name} logo`}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-brand-blueDark font-semibold text-[18px]">
                            {resource.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-brand-blueDark">
                          {resource.name}
                        </p>
                        <p className="text-[14px] text-brand-gray">
                          {resource.updatedAt ? "Updated" : "Added"}: {formattedDate}
                          {resource.updatedAt && resource.updatedBy && getUserName(resource.updatedBy) && (
                            <> by {getUserName(resource.updatedBy)}</>
                          )}
                          {!resource.updatedAt && resource.createdBy && getUserName(resource.createdBy) && (
                            <> by {getUserName(resource.createdBy)}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => navigate(`/resource/${resource.id}`)}
                        className="flex items-center gap-2 text-gray-400 hover:text-brand-blue transition-colors"
                      >
                        <span className="text-[12px] underline">View entry</span>
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => navigate(`/resource/${resource.id}?edit=true`)}
                        className="flex items-center gap-2 text-gray-400 hover:text-brand-red transition-colors"
                      >
                        <span className="text-[12px] underline">Edit entry</span>
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Users List Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-brand-blue">Users</h2>
            <button
              onClick={() => setShowUsers(!showUsers)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-600"
            >
              <span className="text-[12px] underline">View users</span>
              <EyeIcon className="w-6 h-6" />
            </button>
          </div>

          {/* User Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-[48px] font-bold text-brand-blue leading-none mb-2">
                {getUserStats().total}
              </p>
              <p className="text-[14px] font-semibold text-brand-blue">
                {getUserStats().total === 1 ? "Total User" : "Total Users"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[48px] font-bold text-[#999999] leading-none mb-2">
                {getUserStats().adminUsers}
              </p>
              <p className="text-[14px] font-semibold text-brand-blueDark">
                {getUserStats().adminUsers === 1 ? "Admin User" : "Admin Users"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[48px] font-bold text-[#999999] leading-none mb-2">
                {getUserStats().generalUsers}
              </p>
              <p className="text-[14px] font-semibold text-brand-blueDark">
                {getUserStats().generalUsers === 1 ? "General User" : "General Users"}
              </p>
            </div>
          </div>

          {/* Role Breakdown Toggle */}
          <button
            onClick={() => setShowRoleBreakdown(!showRoleBreakdown)}
            className="text-[12px] text-gray-500 underline hover:text-gray-700 mb-4"
          >
            {showRoleBreakdown ? "Hide role breakdown" : "Show role breakdown"}
          </button>

          {/* Role Breakdown Table */}
          {showRoleBreakdown && (
            <div className="border border-gray-200 overflow-hidden mb-6">
              <table className="w-full text-sm">
                <tbody>
                  {/* Admin Section */}
                  <tr className="bg-gray-100">
                    <td className="px-4 py-2 font-semibold text-brand-blueDark">Admin</td>
                    <td className="px-4 py-2 text-right font-semibold text-brand-blueDark">{getUserStats().adminUsers}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2 pl-8 text-brand-blueDark">Superadmins</td>
                    <td className="px-4 py-2 text-right text-brand-gray">{getUserStats().admins}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2 pl-8 text-brand-blueDark">Contributors</td>
                    <td className="px-4 py-2 text-right text-brand-gray">{getUserStats().contributors}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2 pl-8 text-brand-blueDark">Managers</td>
                    <td className="px-4 py-2 text-right text-brand-gray">{getUserStats().managers}</td>
                  </tr>
                  {/* General Users Section */}
                  <tr className="bg-gray-100 border-t border-gray-300">
                    <td className="px-4 py-2 font-semibold text-brand-blueDark">General Users</td>
                    <td className="px-4 py-2 text-right font-semibold text-brand-blueDark">{getUserStats().generalUsers}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2 pl-8 text-brand-blueDark">CASA Volunteers</td>
                    <td className="px-4 py-2 text-right text-brand-gray">{getUserStats().volunteers}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2 pl-8 text-brand-blueDark">CASA Staff</td>
                    <td className="px-4 py-2 text-right text-brand-gray">{getUserStats().staff}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2 pl-8 text-brand-blueDark">Agency Affiliates</td>
                    <td className="px-4 py-2 text-right text-brand-gray">{getUserStats().affiliates}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2 pl-8 text-brand-blueDark">Unaffiliated</td>
                    <td className="px-4 py-2 text-right text-brand-gray">{getUserStats().general}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {showUsers && users.length > 0 && (
            <div className="divide-y divide-gray-200 pt-6 border-t border-gray-200">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start justify-between py-4"
                >
                  {editingUser?.id === user.id ? (
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="font-semibold text-brand-blueDark">
                          {user.name}
                        </p>
                        <p className="text-[14px] text-brand-gray">{user.email}</p>
                        <p className="text-[14px] text-brand-gray">
                          Agency: {user.agency}
                        </p>
                      </div>

                      <div>
                        <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                          Role
                        </label>
                        <select
                          value={editForm.role}
                          onChange={(e) =>
                            setEditForm({ ...editForm, role: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                        >
                          <option value="admin">Administrator</option>
                          <option value="contributor">Contributor</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>

                      {editForm.role === "manager" && (
                        <div>
                          <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                            Managed Resources
                          </label>
                          <div className="mb-2">
                            <input
                              type="text"
                              placeholder="Search resources to assign..."
                              value={resourceSearchQuery}
                              onChange={(e) => setResourceSearchQuery(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                            />
                            {filteredResourceOptions.length > 0 && (
                              <div className="mt-1 border border-gray-300 rounded max-h-40 overflow-y-auto">
                                {filteredResourceOptions.map((resource) => (
                                  <button
                                    key={resource.id}
                                    onClick={() =>
                                      handleAddManagedResource(resource.id)
                                    }
                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-[14px] text-brand-blueDark"
                                  >
                                    {resource.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {editForm.managedResources.length > 0 && (
                            <div className="space-y-2">
                              {editForm.managedResources.map((resourceId) => {
                                const resource = resources.find(
                                  (r) => r.id === resourceId
                                );
                                return (
                                  <div
                                    key={resourceId}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  >
                                    <span className="text-[14px] text-brand-blueDark">
                                      {resource?.name || "Unknown Resource"}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleRemoveManagedResource(resourceId)
                                      }
                                      className="text-red-600 hover:text-red-800 text-[14px]"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveUser}
                          className="px-4 py-2 bg-brand-red text-brand-white font-semibold rounded hover:bg-brand-redHover transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 text-brand-blueDark font-semibold rounded hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-4 flex-1">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-brand-blueDark font-semibold text-[18px]">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <button
                            onClick={() => navigate(`/profile/${user.id}`)}
                            className="font-semibold text-brand-blue hover:text-brand-blueDark"
                          >
                            {user.name}
                          </button>
                          <p className="text-[14px] text-brand-gray">{user.email}</p>
                          <p className="text-[14px] text-brand-gray">
                            Agency: {user.agency}
                          </p>
                          <p className="text-[14px] text-brand-gray">
                            Role: {user.role}
                          </p>
                          {user.role === "manager" &&
                            user.managedResources?.length > 0 && (
                              <p className="text-[14px] text-brand-gray">
                                Manages: {user.managedResources.length} resource(s)
                              </p>
                            )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-brand-white font-semibold rounded hover:bg-brand-redHover transition-colors"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(user)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700 transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Contributor Dashboard
  if (isContributor) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-[32px] font-bold text-brand-blueDark mb-8">
          Contributor Dashboard
        </h1>

        {/* Activity Dashboard */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-brand-blue">Activity</h2>
            <button
              onClick={() => setShowRecentActivity(!showRecentActivity)}
              className="text-gray-400 hover:text-gray-600"
            >
              <EyeIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[48px] font-bold text-brand-blue leading-none mb-2">
                {getResourceStats().total}
              </p>
              <p className="text-[14px] font-semibold text-brand-blue">Total Entries</p>
            </div>
            <div className="text-center">
              <p className="text-[48px] font-bold text-brand-plum leading-none mb-2">
                {getResourceStats().recent}
              </p>
              <p className="text-[14px] font-semibold text-brand-blueDark">Added/edited</p>
            </div>
            <div className="text-center">
              <p className="text-[48px] font-bold text-green-600 leading-none mb-2">
                {getResourceStats().completed}
              </p>
              <p className="text-[14px] font-semibold text-brand-blueDark">Complete</p>
            </div>
          </div>

          {/* Recent Activity List */}
          {showRecentActivity && getRecentResources().length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <ul className="space-y-2">
                {getRecentResources().map((resource) => {
                  const formattedDate = formatDate(resource.updatedAt || resource.createdAt);
                  if (!formattedDate) return null;

                  return (
                    <li
                      key={resource.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded"
                    >
                      <div>
                        <p className="font-semibold text-brand-blueDark">
                          {resource.name}
                        </p>
                        <p className="text-[14px] text-brand-gray">
                          {resource.updatedAt ? "Updated" : "Added"}: {formattedDate}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/resource/${resource.id}`)}
                          className="p-2 text-gray-400 hover:text-brand-blue transition-colors"
                          title="View resource"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/resource/${resource.id}?edit=true`)}
                          className="p-2 text-gray-400 hover:text-brand-red transition-colors"
                          title="Edit resource"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Placeholder sections for future features */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
            Resources Marked as Stubs
          </h2>
          <p className="text-brand-gray">
            This feature will be implemented soon.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
            Watched Resources
          </h2>
          <p className="text-brand-gray">
            This feature will be implemented soon.
          </p>
        </div>
      </div>
    );
  }

  // Manager Dashboard
  if (isManager) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-[32px] font-bold text-brand-blueDark mb-8">
          Manager Dashboard
        </h1>

        {/* Recent Activity Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
            My Recent Activity
          </h2>
          {getRecentResources()
            .filter((r) => userRecord.managedResources?.includes(r.id)).length > 0 ? (
            <>
              <button
                onClick={() => setShowRecentActivity(!showRecentActivity)}
                className="px-4 py-2 bg-brand-red text-brand-white font-semibold rounded hover:bg-brand-redHover transition-colors mb-4"
              >
                {showRecentActivity ? "Hide" : "Show"} Recent Activity
              </button>

              {showRecentActivity && (
                <ul className="space-y-2">
                  {getRecentResources()
                    .filter((r) => userRecord.managedResources?.includes(r.id))
                    .map((resource) => {
                      const formattedDate = formatDate(resource.updatedAt || resource.createdAt);
                      if (!formattedDate) return null;

                      return (
                        <li
                          key={resource.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded"
                        >
                          <div>
                            <p className="font-semibold text-brand-blueDark">
                              {resource.name}
                            </p>
                            <p className="text-[14px] text-brand-gray">
                              {resource.updatedAt ? "Updated" : "Added"}: {formattedDate}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </>
          ) : (
            <p className="text-brand-gray">No recent activity.</p>
          )}
        </div>

        {/* Managed Resources Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
            Managed Resources ({managedResources.length})
          </h2>
          {managedResources.length > 0 ? (
            <div className="space-y-3">
              {managedResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded"
                >
                  <div className="flex items-start gap-4 flex-1">
                    {resource.logoUrl && (
                      <img
                        src={resource.logoUrl}
                        alt={`${resource.name} logo`}
                        className="w-16 h-16 object-contain"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-brand-blueDark">
                        {resource.name}
                      </p>
                      {resource.city && (
                        <p className="text-[14px] text-brand-gray">
                          {resource.city}, {resource.state}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/resource/${resource.id}?edit=true`)}
                    className="px-4 py-2 bg-brand-red text-brand-white font-semibold rounded hover:bg-brand-redHover transition-colors"
                  >
                    Manage
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-brand-gray">No resources assigned yet.</p>
          )}
        </div>
      </div>
    );
  }

  // Default fallback (shouldn't reach here normally)
  return (
    <div className="max-w-7xl mx-auto p-6">
      <p className="text-brand-gray">Loading dashboard...</p>
    </div>
  );
}
