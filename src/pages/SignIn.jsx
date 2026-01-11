import { Link } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function SignIn() {
  return (
    <div className="-mt-20 min-h-screen pt-20 bg-brand-blue flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-brand-blue-dark mb-2">
              Sign In or Create Account
            </h1>
            <p className="text-sm text-gray-600">
              Access the CASA Worcester Community Resource Guide
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-brand-blue-dark mb-2">
              With an account you can:
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Bookmark resources for quick reference</li>
              <li>• Access resources across all your devices</li>
              <li>• Request staff access to manage resources</li>
            </ul>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-4">
            <GoogleSignInButton />
          </div>

          {/* Info Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              New users will complete a quick registration. Already have an account? You'll be signed in automatically.
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-sm font-semibold text-white hover:text-brand-red transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

