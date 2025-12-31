import { Link } from "react-router-dom";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-brand-blue flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-blue-dark mb-2">
              Sign In
            </h1>
            <p className="text-sm text-gray-600">
              Sign in to manage resources and contribute to the community guide
            </p>
          </div>

          {/* Google Sign In Button */}
          <div className="mb-6">
            <GoogleSignInButton />
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Don't have access?
              </span>
            </div>
          </div>

          {/* Request Access Link */}
          <div className="text-center">
            <Link
              to="/request-access"
              className="inline-block px-6 py-3 bg-brand-red text-white font-semibold rounded-full hover:bg-brand-red-hover transition-colors"
            >
              Request Access
            </Link>
          </div>

          {/* Info Text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-600">
              Access is restricted to authorized CASA staff and partner organizations.
              If you need to request access, please use the Request Access button above.
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

