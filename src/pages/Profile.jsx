import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { updateUser, getResources } from "../firebase/firestore";
import { PencilSquareIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/solid";

const CASA_OFFICES = [
  "Boston CASA",
  "Berkshire County CASA",
  "Bristol County CASA",
  "Essex County CASA",
  "Franklin/Hampshire CASA",
  "Hampden County CASA",
  "Worcester County CASA",
  "Massachusetts CASA",
];

export default function Profile() {
  const { user, userRecord } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [managedResources, setManagedResources] = useState([]);
  const [formData, setFormData] = useState({
    // Contact info
    contactEmail: "",
    phone: "",
    // CASA affiliation: "none", "volunteer", or "staff"
    casaAffiliation: "none",
    casaOffice: "",
    casaSupervisor: "",
    // Volunteer-specific
    hasAssignedCase: false,
    assignedCaseName: "",
    // Staff-specific
    staffRole: "",
    // Agency affiliation
    isAgencyAffiliated: false,
    affiliatedAgency: "",
    agencyRole: "",
  });

  useEffect(() => {
    if (userRecord) {
      // Determine casaAffiliation from legacy or new fields
      let casaAffiliation = userRecord.casaAffiliation || "none";
      if (!userRecord.casaAffiliation) {
        if (userRecord.isCasaStaff) {
          casaAffiliation = "staff";
        } else if (userRecord.isCasaVolunteer) {
          casaAffiliation = "volunteer";
        }
      }

      setFormData({
        contactEmail: userRecord.contactEmail || userRecord.email || "",
        phone: userRecord.phone || "",
        casaAffiliation: casaAffiliation,
        casaOffice: userRecord.casaOffice || "",
        casaSupervisor: userRecord.casaSupervisor || "",
        hasAssignedCase: userRecord.hasAssignedCase || false,
        assignedCaseName: userRecord.assignedCaseName || "",
        staffRole: userRecord.staffRole || "",
        isAgencyAffiliated: userRecord.isAgencyAffiliated || false,
        affiliatedAgency: userRecord.affiliatedAgency || "",
        agencyRole: userRecord.agencyRole || "",
      });
    }
  }, [userRecord]);

  // Fetch managed resources for managers
  useEffect(() => {
    if (userRecord?.role === "manager" && userRecord?.managedResources?.length > 0) {
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
    const isCasaVolunteer = formData.casaAffiliation === "volunteer";
    const isCasaStaff = formData.casaAffiliation === "staff";

    try {
      await updateUser(user.uid, {
        contactEmail: formData.contactEmail,
        phone: formData.phone,
        casaAffiliation: formData.casaAffiliation,
        isCasaVolunteer: isCasaVolunteer,
        isCasaStaff: isCasaStaff,
        casaOffice: (isCasaVolunteer || isCasaStaff) ? formData.casaOffice : "",
        casaSupervisor: (isCasaVolunteer || isCasaStaff) ? formData.casaSupervisor : "",
        hasAssignedCase: isCasaVolunteer ? formData.hasAssignedCase : false,
        assignedCaseName: isCasaVolunteer && formData.hasAssignedCase ? formData.assignedCaseName : "",
        staffRole: isCasaStaff ? formData.staffRole : "",
        isAgencyAffiliated: formData.isAgencyAffiliated,
        affiliatedAgency: formData.isAgencyAffiliated ? formData.affiliatedAgency : "",
        agencyRole: formData.isAgencyAffiliated ? formData.agencyRole : "",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    // Determine casaAffiliation from legacy or new fields
    let casaAffiliation = userRecord?.casaAffiliation || "none";
    if (!userRecord?.casaAffiliation) {
      if (userRecord?.isCasaStaff) {
        casaAffiliation = "staff";
      } else if (userRecord?.isCasaVolunteer) {
        casaAffiliation = "volunteer";
      }
    }

    setFormData({
      contactEmail: userRecord?.contactEmail || userRecord?.email || "",
      phone: userRecord?.phone || "",
      casaAffiliation: casaAffiliation,
      casaOffice: userRecord?.casaOffice || "",
      casaSupervisor: userRecord?.casaSupervisor || "",
      hasAssignedCase: userRecord?.hasAssignedCase || false,
      assignedCaseName: userRecord?.assignedCaseName || "",
      staffRole: userRecord?.staffRole || "",
      isAgencyAffiliated: userRecord?.isAgencyAffiliated || false,
      affiliatedAgency: userRecord?.affiliatedAgency || "",
      agencyRole: userRecord?.agencyRole || "",
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
    if (role === "casa-volunteer") return "CASA Volunteer";
    if (role === "casa-staff") return "CASA Staff Member";
    if (role === "agency-affiliate") return "Agency Affiliate";
    if (role === "general") return "General User";
    // Legacy: old "volunteer" role maps to CASA Volunteer
    if (role === "volunteer") return "CASA Volunteer";
    return role;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand-blue flex items-center justify-center text-white text-2xl font-bold">
              {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-[32px] font-bold text-brand-blueDark">
              {user.displayName || "User Profile"}
            </h1>
            <p className="text-brand-gray mt-1">{user.email}</p>
            <p className="text-sm text-brand-blue font-semibold mt-1">
              {getRoleDisplay(userRecord.role)}
            </p>
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

      {/* Contact Information Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
          Contact Information
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
              Google Account Email
            </label>
            <p className="text-brand-blueDark">{user.email}</p>
          </div>
          <div>
            <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
              Contact Email
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
              />
            ) : (
              <p className="text-brand-blueDark">{formData.contactEmail || "Not provided"}</p>
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
        </div>
      </div>

      {/* CASA Affiliation Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
          CASA Affiliation
        </h2>

        {isEditing ? (
          <div className="space-y-4">
            {/* CASA Affiliation Radio Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="casaAffiliation"
                  value="none"
                  checked={formData.casaAffiliation === "none"}
                  onChange={(e) => setFormData({ ...formData, casaAffiliation: e.target.value })}
                  className="w-5 h-5 border-gray-300 text-brand-blue focus:ring-brand-blue"
                />
                <span className="text-brand-blueDark">Not affiliated with CASA</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="casaAffiliation"
                  value="volunteer"
                  checked={formData.casaAffiliation === "volunteer"}
                  onChange={(e) => setFormData({ ...formData, casaAffiliation: e.target.value })}
                  className="w-5 h-5 border-gray-300 text-brand-blue focus:ring-brand-blue"
                />
                <span className="text-brand-blueDark"><strong>CASA volunteer</strong></span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="casaAffiliation"
                  value="staff"
                  checked={formData.casaAffiliation === "staff"}
                  onChange={(e) => setFormData({ ...formData, casaAffiliation: e.target.value })}
                  className="w-5 h-5 border-gray-300 text-brand-blue focus:ring-brand-blue"
                />
                <span className="text-brand-blueDark"><strong>CASA staff member</strong></span>
              </label>
            </div>

            {/* Volunteer-specific fields */}
            {formData.casaAffiliation === "volunteer" && (
              <div className="pl-8 space-y-4 border-l-2 border-gray-200">
                <div>
                  <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                    CASA Office
                  </label>
                  <select
                    value={formData.casaOffice}
                    onChange={(e) => setFormData({ ...formData, casaOffice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                  >
                    <option value="">Select your CASA office</option>
                    {CASA_OFFICES.map((office) => (
                      <option key={office} value={office}>{office}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                    Supervisor Name
                  </label>
                  <input
                    type="text"
                    value={formData.casaSupervisor}
                    onChange={(e) => setFormData({ ...formData, casaSupervisor: e.target.value })}
                    placeholder="Your supervisor's name"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hasAssignedCase"
                    checked={formData.hasAssignedCase}
                    onChange={(e) => setFormData({ ...formData, hasAssignedCase: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <label htmlFor="hasAssignedCase" className="text-brand-blueDark font-medium">
                    I am currently assigned to a case
                  </label>
                </div>
                {formData.hasAssignedCase && (
                  <div>
                    <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                      Case Name/Number
                    </label>
                    <input
                      type="text"
                      value={formData.assignedCaseName}
                      onChange={(e) => setFormData({ ...formData, assignedCaseName: e.target.value })}
                      placeholder="Case identifier"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Staff-specific fields */}
            {formData.casaAffiliation === "staff" && (
              <div className="pl-8 space-y-4 border-l-2 border-gray-200">
                <div>
                  <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                    CASA Office
                  </label>
                  <select
                    value={formData.casaOffice}
                    onChange={(e) => setFormData({ ...formData, casaOffice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                  >
                    <option value="">Select your CASA office</option>
                    {CASA_OFFICES.map((office) => (
                      <option key={office} value={office}>{office}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                    Your Role/Title
                  </label>
                  <input
                    type="text"
                    value={formData.staffRole}
                    onChange={(e) => setFormData({ ...formData, staffRole: e.target.value })}
                    placeholder="e.g., Program Coordinator"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                    Supervisor Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.casaSupervisor}
                    onChange={(e) => setFormData({ ...formData, casaSupervisor: e.target.value })}
                    placeholder="Your supervisor's name"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>
            )}
          </div>
        ) : formData.casaAffiliation === "volunteer" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                Status
              </label>
              <p className="text-brand-blue font-semibold">CASA Volunteer</p>
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                CASA Office
              </label>
              <p className="text-brand-blueDark">{formData.casaOffice || "Not specified"}</p>
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                Supervisor
              </label>
              <p className="text-brand-blueDark">{formData.casaSupervisor || "Not specified"}</p>
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                Assignment Status
              </label>
              <p className="text-brand-blueDark">
                {formData.hasAssignedCase ? (
                  <span className="text-green-600 font-semibold">Assigned to Case</span>
                ) : (
                  <span className="text-gray-500">Not Currently Assigned</span>
                )}
              </p>
            </div>
            {formData.hasAssignedCase && formData.assignedCaseName && (
              <div>
                <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                  Case Name/Number
                </label>
                <p className="text-brand-blueDark">{formData.assignedCaseName}</p>
              </div>
            )}
          </div>
        ) : formData.casaAffiliation === "staff" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                Status
              </label>
              <p className="text-brand-blue font-semibold">CASA Staff Member</p>
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                CASA Office
              </label>
              <p className="text-brand-blueDark">{formData.casaOffice || "Not specified"}</p>
            </div>
            <div>
              <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                Role/Title
              </label>
              <p className="text-brand-blueDark">{formData.staffRole || "Not specified"}</p>
            </div>
            {formData.casaSupervisor && (
              <div>
                <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                  Supervisor
                </label>
                <p className="text-brand-blueDark">{formData.casaSupervisor}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-brand-gray">Not affiliated with CASA</p>
        )}
      </div>

      {/* Agency Affiliation Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-[20px] font-bold text-brand-blueDark mb-4">
          Agency Affiliation
        </h2>

        {isEditing ? (
          <div className="space-y-4">
            {/* Agency Affiliation Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAgencyAffiliated"
                checked={formData.isAgencyAffiliated}
                onChange={(e) =>
                  setFormData({ ...formData, isAgencyAffiliated: e.target.checked })
                }
                className="w-5 h-5 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
              />
              <label htmlFor="isAgencyAffiliated" className="text-brand-blueDark font-medium">
                I am affiliated with an agency
              </label>
            </div>

            {formData.isAgencyAffiliated && (
              <>
                <div>
                  <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                    Agency Name
                  </label>
                  <input
                    type="text"
                    value={formData.affiliatedAgency}
                    onChange={(e) =>
                      setFormData({ ...formData, affiliatedAgency: e.target.value })
                    }
                    placeholder="Your agency or organization"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                    Your Role at Agency
                  </label>
                  <input
                    type="text"
                    value={formData.agencyRole}
                    onChange={(e) =>
                      setFormData({ ...formData, agencyRole: e.target.value })
                    }
                    placeholder="Your position or title"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </>
            )}
          </div>
        ) : formData.isAgencyAffiliated ? (
          <div className="space-y-4">
            <div>
              <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                Agency
              </label>
              <p className="text-brand-blueDark">{formData.affiliatedAgency || "Not specified"}</p>
            </div>
            {formData.agencyRole && (
              <div>
                <label className="block text-[14px] font-semibold text-brand-blueDark mb-1">
                  Role at Agency
                </label>
                <p className="text-brand-blueDark">{formData.agencyRole}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-brand-gray">No agency affiliation</p>
        )}
      </div>

      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex gap-3 mb-6">
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
                <span className="text-green-600 font-semibold">Active</span>
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
              {["volunteer", "general", "casa-volunteer", "casa-staff", "agency-affiliate"].includes(userRecord.role) && (
                <>
                  <li>Browse all resources</li>
                  <li>Save bookmarks</li>
                </>
              )}
            </ul>
          </div>

          {/* Request Staff Access - only for basic users */}
          {["volunteer", "general", "casa-volunteer", "casa-staff", "agency-affiliate"].includes(userRecord.role) && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-[16px] font-semibold text-brand-blueDark mb-2">
                Need to manage resources?
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                If you're a CASA staff member or partner organization that needs to add or edit
                resources, you can request staff access.
              </p>
              <Link
                to="/request-access"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue text-white font-semibold rounded hover:bg-brand-blue-dark transition-colors"
              >
                Request Staff Access
                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
              </Link>
            </div>
          )}
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
                  <Link
                    to={`/resource/${resource.id}`}
                    className="text-brand-blue hover:text-brand-blueDark text-[14px] underline"
                  >
                    Edit
                  </Link>
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
