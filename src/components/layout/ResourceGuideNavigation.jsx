import { Link, useNavigate } from "react-router-dom";
import { XMarkIcon, ArrowRightEndOnRectangleIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";

export default function ResourceGuideNavigation({ open, onClose, user, userRecord }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    onClose();
    navigate("/");
  };

  // Get first name from display name
  const getFirstName = () => {
    if (!user?.displayName) return "User";
    return user.displayName.split(" ")[0];
  };

  // Check if user can access admin panel
  const canAccessAdmin = userRecord?.isApproved &&
    ["admin", "manager", "contributor"].includes(userRecord?.role);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] h-screen bg-brand-blue text-brand-white">
      <div className="mx-auto flex h-full max-w-5xl flex-col px-6 pt-6">
        {/* Top row: profile or sign in + close button */}
        <div className="flex items-center justify-between">
          {/* Profile or Sign In */}
          <div>
            {user ? (
              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-10 w-10 rounded-full border-2 border-brand-white"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full border-2 border-brand-white bg-brand-red flex items-center justify-center text-white font-bold">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-semibold text-brand-white">
                  Hi, {getFirstName()}!
                </span>
              </Link>
            ) : (
              <Link
                to="/signin"
                onClick={onClose}
                className="flex items-center gap-2 text-sm font-semibold text-brand-white hover:text-brand-red transition-colors"
              >
                Sign In
                <ArrowRightEndOnRectangleIcon className="h-5 w-5" />
              </Link>
            )}
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-0 text-brand-white hover:opacity-90"
            aria-label="Close menu"
            title="Close menu"
          >
            <XMarkIcon className="h-9 w-9" aria-hidden="true" />
          </button>
        </div>

        {/* Main nav links */}
        <nav className="mt-10 flex flex-col gap-6">
          {user && (
            <Link to="/saved" onClick={onClose} className="text-3xl font-bold">
              Saved Resources
            </Link>
          )}
          <Link to="/search" onClick={onClose} className="text-3xl font-bold">
            Search
          </Link>
          <Link to="/browse" onClick={onClose} className="text-3xl font-bold">
            Browse
          </Link>
          {user ? (
            <>
              <Link to="/profile" onClick={onClose} className="text-3xl font-bold">
                Profile
              </Link>
              {canAccessAdmin && (
                <Link to="/admin" onClick={onClose} className="text-3xl font-bold">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm font-semibold text-brand-white hover:text-brand-red transition-colors text-left"
              >
                Sign Out
                <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
              </button>
            </>
          ) : (
            <Link to="/signin" onClick={onClose} className="text-3xl font-bold">
              Create Account
            </Link>
          )}
        </nav>

        {/* Footer pinned to bottom of the PAGE (viewport) */}
        <div className="mt-auto pt-6 pb-[50px] text-xs">
          <p className="underline">
            <Link to="/privacy" onClick={onClose}>
              Privacy Policy
            </Link>
          </p>
          <p className="pb-[50px] underline">
            <Link to="/terms" onClick={onClose}>
              Terms & Conditions
            </Link>
          </p>
          <p>Nonprofit EIN: 04-2711865</p>
          <p>
            Copyright &copy; {new Date().getFullYear()} CASA Project Worcester County. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
