import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { createUser, getUserByEmail, createAccessRequest } from "../firebase/firestore";

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

const HOW_HEARD_OPTIONS = [
  { value: "casa-website", label: "CASA website" },
  { value: "casa-staff", label: "CASA staff member", hasDetail: true, detailLabel: "Staff member name" },
  { value: "casa-volunteer", label: "CASA volunteer" },
  { value: "agency", label: "Agency", hasDetail: true, detailLabel: "Agency name" },
  { value: "social-media", label: "Social media" },
  { value: "google-search", label: "Google search" },
  { value: "social-worker", label: "Social worker" },
  { value: "legal-advocate", label: "Legal advocate" },
  { value: "other", label: "Other", hasDetail: true, detailLabel: "Please specify" },
];

export default function Register() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    // Basic info
    contactEmail: user?.email || "",

    // CASA affiliation type: "none", "volunteer", or "staff"
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

    // How they heard about us
    howHeardAbout: "",
    howHeardAboutDetail: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if not signed in
  useEffect(() => {
    if (!user) {
      navigate("/signin");
    }
  }, [user, navigate]);

  // Check if user already has a record
  useEffect(() => {
    const checkExistingUser = async () => {
      if (user?.email) {
        const existingRecord = await getUserByEmail(user.email);
        if (existingRecord && existingRecord.isApproved) {
          // User already registered, redirect to browse
          navigate("/browse");
        }
      }
    };
    checkExistingUser();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const isCasaVolunteer = formData.casaAffiliation === "volunteer";
    const isCasaStaff = formData.casaAffiliation === "staff";

    // Determine role based on affiliation (all have same permissions, just different display names)
    let role = "general"; // Default for non-affiliated users
    if (isCasaVolunteer) {
      role = "casa-volunteer";
    } else if (isCasaStaff) {
      role = "casa-staff";
    } else if (formData.isAgencyAffiliated) {
      role = "agency-affiliate";
    }

    try {
      // Create the user record
      await createUser(user.uid, {
        email: user.email,
        name: user.displayName || "",
        photoURL: user.photoURL || "",
        role: role,
        isApproved: true,

        // Registration fields
        contactEmail: formData.contactEmail,

        // CASA affiliation
        casaAffiliation: formData.casaAffiliation,
        isCasaVolunteer: isCasaVolunteer,
        isCasaStaff: isCasaStaff,
        casaOffice: (isCasaVolunteer || isCasaStaff) ? formData.casaOffice : "",
        casaSupervisor: (isCasaVolunteer || isCasaStaff) ? formData.casaSupervisor : "",

        // Volunteer-specific
        hasAssignedCase: isCasaVolunteer ? formData.hasAssignedCase : false,
        assignedCaseName: isCasaVolunteer && formData.hasAssignedCase ? formData.assignedCaseName : "",

        // Staff-specific
        staffRole: isCasaStaff ? formData.staffRole : "",

        // Agency affiliation
        isAgencyAffiliated: formData.isAgencyAffiliated,
        affiliatedAgency: formData.isAgencyAffiliated ? formData.affiliatedAgency : "",
        agencyRole: formData.isAgencyAffiliated ? formData.agencyRole : "",

        howHeardAbout: formData.howHeardAbout,
        howHeardAboutDetail: formData.howHeardAboutDetail,

        // Initialize bookmarks
        bookmarks: [],
      });

      // If CASA staff, automatically create an access request
      if (isCasaStaff) {
        await createAccessRequest({
          name: user.displayName || "",
          email: user.email,
          agency: formData.casaOffice,
          requestedAccessLevel: "contributor",
          requestReason: `CASA staff member at ${formData.casaOffice}. Role: ${formData.staffRole || "Not specified"}. Supervisor: ${formData.casaSupervisor || "Not specified"}.`,
          userId: user.uid,
          currentRole: role,
          autoSubmitted: true, // Flag to indicate this was auto-submitted during registration
        });

        // Redirect to pending page
        navigate("/request-access?reason=pending");
      } else {
        // Redirect to browse
        navigate("/browse");
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedHowHeard = HOW_HEARD_OPTIONS.find(opt => opt.value === formData.howHeardAbout);

  if (!user) {
    return null;
  }

  return (
    <div className="-mt-20 min-h-screen pt-20 bg-brand-blue flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-brand-blue-dark mb-2">
              Complete Your Registration
            </h1>
            <p className="text-gray-600">
              Welcome, {user.displayName || user.email}! Please tell us a bit about yourself
              so we can better serve you.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-semibold text-brand-blue-dark mb-1">
                Best Email to Contact You *
              </label>
              <input
                type="email"
                id="contactEmail"
                required
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="your@email.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                We'll use this if we need to contact you about your account.
              </p>
            </div>

            {/* CASA Affiliation Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-brand-blue-dark mb-3">
                Are you affiliated with CASA?
              </p>

              <div className="space-y-3">
                {/* No CASA affiliation */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="casaAffiliation"
                    value="none"
                    checked={formData.casaAffiliation === "none"}
                    onChange={(e) => setFormData({ ...formData, casaAffiliation: e.target.value })}
                    className="h-5 w-5 border-gray-300 text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-sm text-gray-700">
                    No, I am not affiliated with CASA
                  </span>
                </label>

                {/* CASA Volunteer */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="casaAffiliation"
                    value="volunteer"
                    checked={formData.casaAffiliation === "volunteer"}
                    onChange={(e) => setFormData({ ...formData, casaAffiliation: e.target.value })}
                    className="h-5 w-5 border-gray-300 text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-sm text-gray-700">
                    Yes, I am a <strong>CASA volunteer</strong>
                  </span>
                </label>

                {/* CASA Staff */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="casaAffiliation"
                    value="staff"
                    checked={formData.casaAffiliation === "staff"}
                    onChange={(e) => setFormData({ ...formData, casaAffiliation: e.target.value })}
                    className="h-5 w-5 border-gray-300 text-brand-red focus:ring-brand-red"
                  />
                  <span className="text-sm text-gray-700">
                    Yes, I am a <strong>CASA staff member</strong>
                  </span>
                </label>
              </div>

              {/* CASA Volunteer Fields */}
              {formData.casaAffiliation === "volunteer" && (
                <div className="mt-4 pl-8 space-y-4 border-l-2 border-gray-200">
                  {/* CASA Office */}
                  <div>
                    <label htmlFor="casaOffice" className="block text-sm font-medium text-gray-700 mb-1">
                      Which CASA office? *
                    </label>
                    <select
                      id="casaOffice"
                      required
                      value={formData.casaOffice}
                      onChange={(e) => setFormData({ ...formData, casaOffice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="">Select your CASA office</option>
                      {CASA_OFFICES.map((office) => (
                        <option key={office} value={office}>{office}</option>
                      ))}
                    </select>
                  </div>

                  {/* Supervisor */}
                  <div>
                    <label htmlFor="casaSupervisor" className="block text-sm font-medium text-gray-700 mb-1">
                      Supervisor's name
                    </label>
                    <input
                      type="text"
                      id="casaSupervisor"
                      value={formData.casaSupervisor}
                      onChange={(e) => setFormData({ ...formData, casaSupervisor: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Your supervisor's name"
                    />
                  </div>

                  {/* Assigned Case */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasAssignedCase}
                        onChange={(e) => setFormData({ ...formData, hasAssignedCase: e.target.checked })}
                        className="h-4 w-4 border-gray-300 text-brand-red focus:ring-brand-red rounded"
                      />
                      <span className="text-sm text-gray-700">I am currently assigned to a case</span>
                    </label>

                    {formData.hasAssignedCase && (
                      <div className="mt-2">
                        <label htmlFor="assignedCaseName" className="block text-sm font-medium text-gray-700 mb-1">
                          Case name or identifier
                        </label>
                        <input
                          type="text"
                          id="assignedCaseName"
                          value={formData.assignedCaseName}
                          onChange={(e) => setFormData({ ...formData, assignedCaseName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          placeholder="Case name or number"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CASA Staff Fields */}
              {formData.casaAffiliation === "staff" && (
                <div className="mt-4 pl-8 space-y-4 border-l-2 border-gray-200">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      As a CASA staff member, you'll be able to add and edit resources after your account is verified by an administrator.
                    </p>
                  </div>

                  {/* CASA Office */}
                  <div>
                    <label htmlFor="casaOfficeStaff" className="block text-sm font-medium text-gray-700 mb-1">
                      Which CASA office? *
                    </label>
                    <select
                      id="casaOfficeStaff"
                      required
                      value={formData.casaOffice}
                      onChange={(e) => setFormData({ ...formData, casaOffice: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="">Select your CASA office</option>
                      {CASA_OFFICES.map((office) => (
                        <option key={office} value={office}>{office}</option>
                      ))}
                    </select>
                  </div>

                  {/* Staff Role */}
                  <div>
                    <label htmlFor="staffRole" className="block text-sm font-medium text-gray-700 mb-1">
                      Your role/title *
                    </label>
                    <input
                      type="text"
                      id="staffRole"
                      required
                      value={formData.staffRole}
                      onChange={(e) => setFormData({ ...formData, staffRole: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="e.g., Program Coordinator, Case Supervisor"
                    />
                  </div>

                  {/* Supervisor (optional for staff) */}
                  <div>
                    <label htmlFor="casaSupervisorStaff" className="block text-sm font-medium text-gray-700 mb-1">
                      Supervisor's name (optional)
                    </label>
                    <input
                      type="text"
                      id="casaSupervisorStaff"
                      value={formData.casaSupervisor}
                      onChange={(e) => setFormData({ ...formData, casaSupervisor: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Your supervisor's name"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Agency Affiliation Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAgencyAffiliated}
                  onChange={(e) => setFormData({ ...formData, isAgencyAffiliated: e.target.checked })}
                  className="h-5 w-5 border-gray-300 text-brand-red focus:ring-brand-red rounded"
                />
                <span className="text-sm font-semibold text-brand-blue-dark">
                  I am affiliated with an agency/organization (other than CASA)
                </span>
              </label>

              {formData.isAgencyAffiliated && (
                <div className="mt-4 pl-8 space-y-4 border-l-2 border-gray-200">
                  {/* Agency Name */}
                  <div>
                    <label htmlFor="affiliatedAgency" className="block text-sm font-medium text-gray-700 mb-1">
                      Agency/Organization name *
                    </label>
                    <input
                      type="text"
                      id="affiliatedAgency"
                      required={formData.isAgencyAffiliated}
                      value={formData.affiliatedAgency}
                      onChange={(e) => setFormData({ ...formData, affiliatedAgency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Organization name"
                    />
                  </div>

                  {/* Role at Agency */}
                  <div>
                    <label htmlFor="agencyRole" className="block text-sm font-medium text-gray-700 mb-1">
                      Your role at this agency
                    </label>
                    <input
                      type="text"
                      id="agencyRole"
                      value={formData.agencyRole}
                      onChange={(e) => setFormData({ ...formData, agencyRole: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="e.g., Case Manager, Social Worker, etc."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* How Did You Hear About Us */}
            <div>
              <label htmlFor="howHeardAbout" className="block text-sm font-semibold text-brand-blue-dark mb-1">
                How did you hear about this resource guide? *
              </label>
              <select
                id="howHeardAbout"
                required
                value={formData.howHeardAbout}
                onChange={(e) => setFormData({
                  ...formData,
                  howHeardAbout: e.target.value,
                  howHeardAboutDetail: "" // Reset detail when changing selection
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select an option</option>
                {HOW_HEARD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {/* Detail field for options that need it */}
              {selectedHowHeard?.hasDetail && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={formData.howHeardAboutDetail}
                    onChange={(e) => setFormData({ ...formData, howHeardAboutDetail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    placeholder={selectedHowHeard.detailLabel}
                  />
                </div>
              )}
            </div>

            {/* Staff notice */}
            {formData.casaAffiliation === "staff" && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> After completing registration, your staff access request will be submitted for administrator approval. You'll be able to browse resources immediately, and will receive full editing access once approved.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-brand-red-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating Account..." : "Complete Registration"}
              </button>
            </div>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm font-semibold text-brand-blue-dark hover:text-brand-red transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
