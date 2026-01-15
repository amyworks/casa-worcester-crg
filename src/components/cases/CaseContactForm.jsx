import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  JUVENILE_COURTS,
  ALL_COURTS,
  DCF_AREA_OFFICES,
  DYS_REGIONAL_OFFICES,
  getCourtByName,
  getDCFOfficeByName,
  getDYSOfficeByName,
} from "../../data/massachusettsOffices";

// Required court contacts (always present)
export const REQUIRED_CONTACT_ROLES = [
  "Judge",
  "DCF Social Worker",
  "DCF Supervisor",
  "State's Attorney",
  "Child(ren)'s Attorney",
  "Parent(s)' Attorney",
  "CASA Supervisor",
];

// Suggested additional roles (user can also enter custom)
const SUGGESTED_ROLES = [
  // Court-related roles
  "Probate & Family Court Judge",
  "Housing Court Judge",
  "District Court Judge",
  "Probation Officer",
  "DYS Caseworker",
  // Legal
  "Guardian ad Litem",
  // Care & Treatment
  "Treatment Provider",
  "Placement Provider",
  "Foster Parent",
  "Therapist",
  "Psychiatrist",
  "Pediatrician",
  "Case Manager",
  // Education
  "Educational Rep",
  "Guidance Counselor",
  "School Principal",
  "Teacher",
  // Other supportive roles
  "Coach",
  "Mentor",
  "Camp Counselor",
  "Other",
];

// Attorney representation types
const ATTORNEY_TYPES = [
  "Private",
  "CPCS Appointed",
];

// Role-specific configuration for labels, placeholders, and dropdown types
const getRoleConfig = (role) => {
  switch (role) {
    case "Judge":
      return {
        affiliationLabel: "Court",
        affiliationPlaceholder: "e.g., Worcester Juvenile Court",
        showAttorneyType: false,
        affiliationDropdown: "juvenile-court", // Use juvenile court dropdown only
      };
    case "Probate & Family Court Judge":
    case "Housing Court Judge":
    case "District Court Judge":
      return {
        affiliationLabel: "Court",
        affiliationPlaceholder: "Select court",
        showAttorneyType: false,
        affiliationDropdown: "all-courts", // Use all courts dropdown
      };
    case "DCF Social Worker":
    case "DCF Supervisor":
      return {
        affiliationLabel: "DCF Office",
        affiliationPlaceholder: "e.g., Worcester Area Office",
        showAttorneyType: false,
        affiliationDropdown: "dcf", // Use DCF office dropdown
      };
    case "DYS Caseworker":
      return {
        affiliationLabel: "DYS Office",
        affiliationPlaceholder: "e.g., DYS Central Regional Office",
        showAttorneyType: false,
        affiliationDropdown: "dys", // Use DYS office dropdown
      };
    case "State's Attorney":
      return {
        affiliationLabel: "Office",
        affiliationPlaceholder: "e.g., Attorney General's Office",
        showAttorneyType: false,
        affiliationDropdown: null,
      };
    case "Child(ren)'s Attorney":
    case "Parent(s)' Attorney":
      return {
        affiliationLabel: "Firm / Office",
        affiliationPlaceholder: "e.g., Law Office of... or CPCS",
        showAttorneyType: true,
        affiliationDropdown: null,
      };
    case "CASA Supervisor":
      return {
        affiliationLabel: "CASA Office",
        affiliationPlaceholder: "e.g., CASA Project Worcester County",
        showAttorneyType: false,
        affiliationDropdown: null,
      };
    default:
      return {
        affiliationLabel: "Company / Agency",
        affiliationPlaceholder: "Enter company or agency",
        showAttorneyType: false,
        affiliationDropdown: null,
      };
  }
};

export default function CaseContactForm({ contact, isRequired, caseAgencies = [], onSave, onCancel }) {
  const [name, setName] = useState(contact?.name || "");
  const [role, setRole] = useState(contact?.role || "");
  const [customRole, setCustomRole] = useState("");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [company, setCompany] = useState(contact?.company || "");
  const [attorneyType, setAttorneyType] = useState(contact?.attorneyType || "");
  const [address, setAddress] = useState(contact?.address || "");
  const [domain, setDomain] = useState(contact?.domain || "");
  const [notes, setNotes] = useState(contact?.notes || "");
  const [error, setError] = useState("");

  // Get the current role for config lookup
  const currentRole = isRequired ? contact?.role : role;
  const roleConfig = getRoleConfig(currentRole);

  // Check if role is a custom one (not in suggested list)
  const isCustomRole = contact?.role &&
    !SUGGESTED_ROLES.includes(contact.role) &&
    !REQUIRED_CONTACT_ROLES.includes(contact.role);

  useEffect(() => {
    if (contact) {
      setName(contact.name || "");
      setRole(contact.role || "");
      setPhone(contact.phone || "");
      setEmail(contact.email || "");
      setCompany(contact.company || "");
      setAttorneyType(contact.attorneyType || "");
      setAddress(contact.address || "");
      setDomain(contact.domain || "");
      setNotes(contact.notes || "");

      // If editing a contact with a custom role
      if (isCustomRole) {
        setCustomRole(contact.role);
        setRole("Other");
      }
    }
  }, [contact, isCustomRole]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // For required contacts, name is required
    if (isRequired && !name.trim()) {
      setError("Please enter a name");
      return;
    }

    // For additional contacts, both name and role are required
    if (!isRequired) {
      if (!name.trim()) {
        setError("Please enter a name");
        return;
      }
      if (!role) {
        setError("Please select a role");
        return;
      }
      if (role === "Other" && !customRole.trim()) {
        setError("Please enter a custom role");
        return;
      }
    }

    const finalRole = isRequired
      ? contact.role
      : (role === "Other" ? customRole.trim() : role);

    const contactData = {
      id: contact?.id || crypto.randomUUID(),
      name: name.trim(),
      role: finalRole,
      phone: phone.trim(),
      email: email.trim(),
      company: company.trim(),
      address: address.trim(),
      domain: domain.trim(),
      notes: notes.trim(),
      isRequired: isRequired,
      addedAt: contact?.addedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add attorney type if applicable
    if (roleConfig.showAttorneyType) {
      contactData.attorneyType = attorneyType;
    }

    onSave(contactData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-brand-blue-dark">
            {isRequired
              ? `Edit ${contact?.role}`
              : (contact ? "Edit Contact" : "Add Contact")}
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

          {/* Role - only for additional contacts */}
          {!isRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select role...</option>
                {SUGGESTED_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom role input */}
          {!isRequired && role === "Other" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Role *
              </label>
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="Enter role"
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name {isRequired && "*"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Enter name"
            />
          </div>

          {/* Attorney Type - only for attorney roles */}
          {roleConfig.showAttorneyType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Representation Type
              </label>
              <select
                value={attorneyType}
                onChange={(e) => setAttorneyType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select type...</option>
                {ATTORNEY_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Enter phone number"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Enter email address"
            />
          </div>

          {/* Affiliation - role-specific label with optional dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {roleConfig.affiliationLabel}
            </label>
            {roleConfig.affiliationDropdown === "juvenile-court" ? (
              <select
                value={company}
                onChange={(e) => {
                  const selectedCourt = e.target.value;
                  setCompany(selectedCourt);
                  if (selectedCourt) {
                    const courtData = getCourtByName(selectedCourt);
                    if (courtData) {
                      setAddress(courtData.address);
                      setPhone(courtData.phone);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select court...</option>
                {JUVENILE_COURTS.map((court) => (
                  <option key={court.name} value={court.name}>
                    {court.name}
                  </option>
                ))}
              </select>
            ) : roleConfig.affiliationDropdown === "all-courts" ? (
              <select
                value={company}
                onChange={(e) => {
                  const selectedCourt = e.target.value;
                  setCompany(selectedCourt);
                  if (selectedCourt) {
                    const courtData = getCourtByName(selectedCourt);
                    if (courtData) {
                      setAddress(courtData.address);
                      setPhone(courtData.phone);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select court...</option>
                <optgroup label="Juvenile Courts">
                  {ALL_COURTS.filter(c => c.type === "Juvenile Court").map((court) => (
                    <option key={court.name} value={court.name}>{court.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Probate & Family Courts">
                  {ALL_COURTS.filter(c => c.type === "Probate & Family Court").map((court) => (
                    <option key={court.name} value={court.name}>{court.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Housing Courts">
                  {ALL_COURTS.filter(c => c.type === "Housing Court").map((court) => (
                    <option key={court.name} value={court.name}>{court.name}</option>
                  ))}
                </optgroup>
                <optgroup label="District Courts">
                  {ALL_COURTS.filter(c => c.type === "District Court").map((court) => (
                    <option key={court.name} value={court.name}>{court.name}</option>
                  ))}
                </optgroup>
              </select>
            ) : roleConfig.affiliationDropdown === "dcf" ? (
              <select
                value={company}
                onChange={(e) => {
                  const selectedOffice = e.target.value;
                  setCompany(selectedOffice);
                  if (selectedOffice) {
                    const officeData = getDCFOfficeByName(selectedOffice);
                    if (officeData) {
                      setAddress(officeData.address);
                      setPhone(officeData.phone);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select DCF office...</option>
                {DCF_AREA_OFFICES.map((office) => (
                  <option key={office.name} value={office.name}>
                    {office.name}
                  </option>
                ))}
              </select>
            ) : roleConfig.affiliationDropdown === "dys" ? (
              <select
                value={company}
                onChange={(e) => {
                  const selectedOffice = e.target.value;
                  setCompany(selectedOffice);
                  if (selectedOffice) {
                    const officeData = getDYSOfficeByName(selectedOffice);
                    if (officeData) {
                      setAddress(officeData.address);
                      setPhone(officeData.phone);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select DYS office...</option>
                {DYS_REGIONAL_OFFICES.map((office) => (
                  <option key={office.name} value={office.name}>
                    {office.name}
                  </option>
                ))}
              </select>
            ) : !isRequired && caseAgencies.length > 0 ? (
              <>
                <select
                  value={caseAgencies.some(a => a.full === company || a.abbrev === company) ? company : (company ? "__other__" : "")}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "__other__") {
                      setCompany("");
                    } else {
                      setCompany(val);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">Select agency...</option>
                  {caseAgencies.map((agency) => (
                    <option key={agency.abbrev} value={agency.full}>
                      {agency.full}
                    </option>
                  ))}
                  <option value="__other__">Other (enter manually)</option>
                </select>
                {/* Show text input if "Other" is selected or if company has a custom value */}
                {(company === "" || (!caseAgencies.some(a => a.full === company || a.abbrev === company) && company !== "")) && (
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    placeholder="Enter company or agency name"
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder={roleConfig.affiliationPlaceholder}
              />
            )}
          </div>

          {/* Mailing Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mailing Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              placeholder="Enter mailing address"
            />
          </div>

          {/* Domain / Authority - only for additional contacts */}
          {!isRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain / Authority
              </label>
              <textarea
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                placeholder="What decisions do they influence? What do they control?"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              placeholder="Additional context, communication preferences, relationship dynamics..."
            />
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
              {contact ? "Save Changes" : "Add Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
