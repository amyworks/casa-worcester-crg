import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { createAccessRequest } from "../firebase/firestore";
import { signOut } from "firebase/auth";

export default function RequestAccess() {
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

  // Pre-fill form if user is signed in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createAccessRequest({
        ...formData,
        userId: user?.uid || null,
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request. Please try again.");
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
      <div className="min-h-screen bg-brand-blue flex items-center justify-center px-6 py-16">
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
              to="/"
              className="inline-block px-6 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-brand-red-hover transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header with conditional message */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-brand-blue-dark mb-4">
              Request Access
            </h1>
            
            {reason === "no-access" && user && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Access Denied:</strong> You don't have access to this system at this time.
                  Please complete the form below to request access.
                </p>
                <button
                  onClick={handleSignOut}
                  className="mt-2 text-sm font-semibold text-brand-red hover:text-brand-red-hover"
                >
                  Sign out
                </button>
              </div>
            )}

            {reason === "pending" && user && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Pending Approval:</strong> Your access request is pending approval.
                  If you need to update your request, please contact an administrator.
                </p>
              </div>
            )}

            {!reason && (
              <p className="text-gray-600">
                Complete this form to request access to manage and contribute resources
                to the CASA Worcester Community Resource Guide.
              </p>
            )}
          </div>

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
                <option value="contributor">Contributor (Add/edit unassigned resources)</option>
                <option value="manager">Manager (Manage specific resources)</option>
                <option value="admin">Administrator (Full access)</option>
              </select>
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
                placeholder="Please explain why you need access and how you plan to use it..."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-brand-red-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm font-semibold text-brand-blue-dark hover:text-brand-red transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

