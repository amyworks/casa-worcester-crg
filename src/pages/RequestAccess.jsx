import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { createAccessRequest, getUserByEmail } from "../firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "../contexts/ToastContext";
import Spinner from "../components/ui/Spinner";

export default function RequestAccess() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get("reason");
  const user = auth.currentUser;

  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    agency: "",
    requestReason: "",
    requestedAccessLevel: "contributor",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userRecord, setUserRecord] = useState(null);

  // Pre-fill form if user is signed in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }));

      // Fetch user record to pre-fill agency info
      const fetchUserRecord = async () => {
        const record = await getUserByEmail(user.email);
        if (record) {
          setUserRecord(record);
          setFormData((prev) => ({
            ...prev,
            agency: record.affiliatedAgency || record.agency || prev.agency,
          }));
        }
      };
      fetchUserRecord();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createAccessRequest({
        ...formData,
        userId: user?.uid || null,
        currentRole: userRecord?.role || "volunteer",
      });
      setSubmitted(true);
      toast.success("Request submitted successfully");
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (submitted) {
    return (
      <div className="-mt-20 min-h-screen pt-20 bg-brand-blue flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-brand-blue-dark mb-4">
              Request Submitted
            </h1>
            <p className="text-gray-700 mb-6">
              Thank you for your request. An administrator will review your request
              and contact you via email.
            </p>
            <Link
              to="/browse"
              className="inline-block px-6 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-brand-red-hover transition-colors"
            >
              Continue Browsing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pending approval view - just show status, no form
  if (reason === "pending" && user) {
    return (
      <div className="-mt-20 min-h-screen pt-20 bg-brand-blue flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-brand-blue-dark mb-4">
              Access Request Pending
            </h1>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                Your staff access request is pending approval.
                An administrator will review your request and contact you via email.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                to="/browse"
                className="block w-full px-6 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-brand-red-hover transition-colors text-center"
              >
                Continue Browsing
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mt-20 min-h-screen pt-20 bg-brand-blue flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-brand-blue-dark mb-4">
              Request Staff Access
            </h1>
            <p className="text-gray-600">
              Request access to add, edit, or manage resources in the CASA Worcester
              Community Resource Guide. This is for CASA staff and partner organizations
              who need to contribute content.
            </p>
          </div>

          {/* Info box for logged in users */}
          {user && ["volunteer", "general", "casa-volunteer", "casa-staff", "agency-affiliate"].includes(userRecord?.role) && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                You're currently signed in as a general user. Submitting this form
                will request elevated permissions to manage resources.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-brand-blue-dark mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                disabled={!!user?.displayName}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-brand-blue-dark mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                disabled={!!user?.email}
              />
            </div>

            {/* Agency */}
            <div>
              <label htmlFor="agency" className="block text-sm font-semibold text-brand-blue-dark mb-1">
                Organization/Agency *
              </label>
              <input
                type="text"
                id="agency"
                required
                value={formData.agency}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="Your organization or CASA office"
              />
            </div>

            {/* Requested Access Level */}
            <div>
              <label htmlFor="accessLevel" className="block text-sm font-semibold text-brand-blue-dark mb-1">
                Requested Access Level *
              </label>
              <select
                id="accessLevel"
                required
                value={formData.requestedAccessLevel}
                onChange={(e) => setFormData({ ...formData, requestedAccessLevel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="contributor">Contributor (Add/edit resources)</option>
                <option value="manager">Manager (Manage specific resources)</option>
                <option value="admin">Administrator (Full access)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Most users should select Contributor. Admins can adjust your access level later.
              </p>
            </div>

            {/* Request Reason */}
            <div>
              <label htmlFor="requestReason" className="block text-sm font-semibold text-brand-blue-dark mb-1">
                Reason for Request *
              </label>
              <textarea
                id="requestReason"
                required
                rows={4}
                value={formData.requestReason}
                onChange={(e) => setFormData({ ...formData, requestReason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="Please explain why you need staff access and what resources you plan to manage..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-brand-red-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" color="white" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link
              to={user ? "/browse" : "/"}
              className="text-sm font-semibold text-brand-blue-dark hover:text-brand-red transition-colors"
            >
              {user ? "← Back to Browse" : "← Back to Home"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
