import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

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
  "Guardian ad Litem",
  "Educational Rep",
  "Treatment Provider",
  "Placement Provider",
  "Foster Parent",
  "Therapist",
  "Psychiatrist",
  "Guidance Counselor",
  "School Principal",
  "Teacher",
  "Coach",
  "Mentor",
  "Camp Counselor",
  "Pediatrician",
  "Case Manager",
  "Probation Officer",
  "Other",
];

export default function CaseContactForm({ contact, isRequired, onSave, onCancel }) {
  const [name, setName] = useState(contact?.name || "");
  const [role, setRole] = useState(contact?.role || "");
  const [customRole, setCustomRole] = useState("");
  const [phone, setPhone] = useState(contact?.phone || "");
  const [email, setEmail] = useState(contact?.email || "");
  const [company, setCompany] = useState(contact?.company || "");
  const [address, setAddress] = useState(contact?.address || "");
  const [domain, setDomain] = useState(contact?.domain || "");
  const [notes, setNotes] = useState(contact?.notes || "");
  const [error, setError] = useState("");

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

          {/* Company / Agency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company / Agency Affiliation
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              placeholder="Enter company or agency"
            />
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

          {/* Domain / Authority */}
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
