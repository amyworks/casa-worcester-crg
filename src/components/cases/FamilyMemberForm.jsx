import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

const FAMILY_ROLES = [
  "parent",
  "child",
  "grandparent",
  "aunt",
  "uncle",
  "adult sibling",
  "stepparent",
  "stepsibling",
  "half sibling",
  "adoptive sibling",
  "godparent",
];

const GENDERS = ["boy", "girl", "man", "woman", "nonbinary", "genderfluid"];

// Child-specific placements
const CHILD_PLACEMENTS = [
  "With parent(s)",
  "Foster home",
  "Kinship placement",
  "Adoptive / guardianship home",
  "Residential care",
  "Shelter care",
  "In-patient psychiatric facility",
];

// Adult-specific statuses (multiselect)
const ADULT_STATUSES = [
  "In treatment",
  "Housed",
  "Homeless",
  "Incarcerated",
  "In recovery",
  "Absent",
  "Hospice care",
  "In-patient psychiatric",
  "Partial hospitalization",
  "Non-cooperative",
  "Cooperative",
];

// Roles that are considered "children" for placement purposes
const CHILD_ROLES = ["child", "stepsibling", "half sibling", "adoptive sibling"];

export default function FamilyMemberForm({ member, onSave, onCancel }) {
  const [firstName, setFirstName] = useState(member?.firstName || "");
  const [familyRole, setFamilyRole] = useState(member?.familyRole || "");
  const [gender, setGender] = useState(member?.gender || "");
  const [age, setAge] = useState(member?.age || "");
  const [placement, setPlacement] = useState(member?.placement || "");
  const [statuses, setStatuses] = useState(member?.statuses || []);
  const [medicated, setMedicated] = useState(member?.medicated || "");
  const [error, setError] = useState("");

  const isChildRole = CHILD_ROLES.includes(familyRole);

  useEffect(() => {
    if (member) {
      setFirstName(member.firstName || "");
      setFamilyRole(member.familyRole || "");
      setGender(member.gender || "");
      setAge(member.age || "");
      setPlacement(member.placement || "");
      setStatuses(member.statuses || []);
      setMedicated(member.medicated || "");
    }
  }, [member]);

  // Reset role-specific fields when role changes
  useEffect(() => {
    if (isChildRole) {
      setStatuses([]);
    } else {
      setPlacement("");
    }
  }, [familyRole, isChildRole]);

  const handleStatusToggle = (status) => {
    setStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) {
      setError("Please enter a first name");
      return;
    }
    if (!familyRole) {
      setError("Please select a family role");
      return;
    }
    if (!gender) {
      setError("Please select a gender");
      return;
    }
    if (age === "" || age < 0 || age > 120) {
      setError("Please enter a valid age (0-120)");
      return;
    }

    const memberData = {
      id: member?.id || crypto.randomUUID(),
      firstName: firstName.trim(),
      familyRole,
      gender,
      age: parseInt(age, 10),
      medicated,
      addedAt: member?.addedAt || new Date().toISOString(),
    };

    // Add role-specific fields
    if (isChildRole) {
      memberData.placement = placement;
    } else {
      memberData.statuses = statuses;
    }

    onSave(memberData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-brand-blue-dark">
            {member ? "Edit Family Member" : "Add Family Member"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Enter first name"
            />
          </div>

          {/* Family Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Family Role
            </label>
            <select
              value={familyRole}
              onChange={(e) => setFamilyRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="">Select role...</option>
              {FAMILY_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="">Select gender...</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              min="0"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Enter age"
            />
          </div>

          {/* Child-specific: Current Placement */}
          {isChildRole && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Placement
              </label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select placement...</option>
                {CHILD_PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Adult-specific: Current Status (multiselect) */}
          {familyRole && !isChildRole && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
                {ADULT_STATUSES.map((status) => (
                  <label
                    key={status}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={statuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                      className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Medicated */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicated
            </label>
            <select
              value={medicated}
              onChange={(e) => setMedicated(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              <option value="">Select...</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
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
              {member ? "Save Changes" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
