import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

// Visitation type options
const VISITATION_TYPES = [
  { value: "sibling", label: "Sibling Visitation" },
  { value: "parental", label: "Parental Visitation" },
  { value: "kinship", label: "Kinship Visitation" },
  { value: "other", label: "Other Visitation" },
];

// Frequency options
const FREQUENCY_OPTIONS = [
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "Twice monthly",
  "As needed",
  "Upon request",
  "Suspended",
  "Other",
];

// Supervision options
const SUPERVISION_OPTIONS = [
  "Supervised",
  "Unsupervised",
  "Monitored",
  "Professional supervision",
  "DCF supervised",
  "Agency supervised",
];

// Status options
const STATUS_OPTIONS = [
  { value: "active", label: "Active", color: "bg-green-100 text-green-800" },
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "suspended", label: "Suspended", color: "bg-red-100 text-red-800" },
  { value: "paused", label: "Paused", color: "bg-orange-100 text-orange-800" },
  { value: "revoked", label: "Revoked", color: "bg-red-200 text-red-900" },
  { value: "completed", label: "Completed", color: "bg-gray-100 text-gray-800" },
];

// Authority type options
const AUTHORITY_TYPES = [
  { value: "court", label: "Court Ordered" },
  { value: "dcf", label: "DCF Recommended" },
  { value: "agreement", label: "Family Agreement" },
  { value: "other", label: "Other" },
];

// Permission types
const PERMISSION_OPTIONS = [
  "Home visits",
  "Day trips",
  "Overnight stays",
  "Out of state travel",
  "Phone/video calls",
  "Holiday visits",
  "School events",
  "Medical appointments",
];

export default function VisitationForm({
  visitation,
  familyMembers = [],
  contacts = [],
  onSave,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    id: "",
    type: "sibling",
    familyMemberIds: [],
    authorityType: "court",
    authorityContactId: "",
    authorityOther: "",
    frequency: "",
    frequencyOther: "",
    location: "",
    supervision: "",
    status: "active",
    permissions: [],
    notes: "",
    logEntries: [],
  });

  useEffect(() => {
    if (visitation) {
      setFormData({
        ...visitation,
        familyMemberIds: visitation.familyMemberIds || [],
        permissions: visitation.permissions || [],
        logEntries: visitation.logEntries || [],
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        id: `vis-${Date.now()}`,
      }));
    }
  }, [visitation]);

  // Filter contacts to only show judges and DCF workers for authority selection
  const authorityContacts = contacts.filter((c) => {
    const role = c.role?.toLowerCase() || "";
    return (
      role.includes("judge") ||
      role.includes("dcf") ||
      role === "dcf ongoing worker" ||
      role === "dcf investigator"
    );
  });

  // Group contacts by type for the dropdown
  const judgeContacts = authorityContacts.filter((c) =>
    c.role?.toLowerCase().includes("judge")
  );
  const dcfContacts = authorityContacts.filter(
    (c) =>
      c.role?.toLowerCase().includes("dcf") ||
      c.role === "DCF Ongoing Worker" ||
      c.role === "DCF Investigator"
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFamilyMemberToggle = (memberId) => {
    setFormData((prev) => ({
      ...prev,
      familyMemberIds: prev.familyMemberIds.includes(memberId)
        ? prev.familyMemberIds.filter((id) => id !== memberId)
        : [...prev.familyMemberIds, memberId],
    }));
  };

  const handlePermissionToggle = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (formData.familyMemberIds.length === 0) {
      alert("Please select at least one family member");
      return;
    }

    const finalData = {
      ...formData,
      frequency:
        formData.frequency === "Other"
          ? formData.frequencyOther
          : formData.frequency,
      updatedAt: new Date().toISOString(),
    };

    if (!visitation) {
      finalData.createdAt = new Date().toISOString();
    }

    onSave(finalData);
  };

  const getMemberLabel = (member) => {
    return `${member.firstName} (${member.familyRole}, ${member.age}yo ${member.gender})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-brand-blue-dark">
            {visitation ? "Edit Visitation" : "Add Visitation"}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Visitation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visitation Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              required
            >
              {VISITATION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Family Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Family Members Involved <span className="text-red-500">*</span>
            </label>
            {familyMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
                {familyMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.familyMemberIds.includes(member.id)}
                      onChange={() => handleFamilyMemberToggle(member.id)}
                      className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="truncate">{getMemberLabel(member)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic p-2 border border-gray-200 rounded bg-gray-50">
                No family members added yet. Please add family members first.
              </p>
            )}
          </div>

          {/* Ordering Authority */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Ordering / Recommending Authority
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {AUTHORITY_TYPES.map((auth) => (
                <label
                  key={auth.value}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-sm cursor-pointer rounded border transition-colors ${
                    formData.authorityType === auth.value
                      ? "bg-brand-blue text-white border-brand-blue"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="authorityType"
                    value={auth.value}
                    checked={formData.authorityType === auth.value}
                    onChange={(e) =>
                      handleChange("authorityType", e.target.value)
                    }
                    className="sr-only"
                  />
                  {auth.label}
                </label>
              ))}
            </div>

            {/* Authority Contact Selection */}
            {(formData.authorityType === "court" ||
              formData.authorityType === "dcf") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.authorityType === "court" ? "Judge" : "DCF Worker"}
                </label>
                <select
                  value={formData.authorityContactId}
                  onChange={(e) =>
                    handleChange("authorityContactId", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">Select from contacts...</option>
                  {formData.authorityType === "court" &&
                    judgeContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} ({contact.role})
                      </option>
                    ))}
                  {formData.authorityType === "dcf" &&
                    dcfContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} ({contact.role})
                      </option>
                    ))}
                </select>
                {((formData.authorityType === "court" &&
                  judgeContacts.length === 0) ||
                  (formData.authorityType === "dcf" &&
                    dcfContacts.length === 0)) && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    No {formData.authorityType === "court" ? "judges" : "DCF workers"}{" "}
                    found in contacts. Add them in Case Contacts first.
                  </p>
                )}
              </div>
            )}

            {/* Other Authority Text */}
            {formData.authorityType === "other" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordered By
                </label>
                <input
                  type="text"
                  value={formData.authorityOther}
                  onChange={(e) =>
                    handleChange("authorityOther", e.target.value)
                  }
                  placeholder="e.g., Therapist recommendation, family mediator"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            )}
          </div>

          {/* Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleChange("frequency", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select frequency...</option>
                {FREQUENCY_OPTIONS.map((freq) => (
                  <option key={freq} value={freq}>
                    {freq}
                  </option>
                ))}
              </select>
              {formData.frequency === "Other" && (
                <input
                  type="text"
                  value={formData.frequencyOther}
                  onChange={(e) =>
                    handleChange("frequencyOther", e.target.value)
                  }
                  placeholder="Specify frequency..."
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              )}
            </div>

            {/* Supervision */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supervision Level
              </label>
              <select
                value={formData.supervision}
                onChange={(e) => handleChange("supervision", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select supervision...</option>
                {SUPERVISION_OPTIONS.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location / Setting
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="e.g., DCF office, foster home, visitation center"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <label
                  key={status.value}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer rounded border transition-colors ${
                    formData.status === status.value
                      ? status.color + " border-current"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={formData.status === status.value}
                    onChange={(e) => handleChange("status", e.target.value)}
                    className="sr-only"
                  />
                  {status.label}
                </label>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Activities / Permissions
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PERMISSION_OPTIONS.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                    className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                  />
                  {permission}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional details about this visitation arrangement..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-blue text-white font-medium rounded hover:bg-brand-blue-dark transition-colors"
            >
              {visitation ? "Save Changes" : "Add Visitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
