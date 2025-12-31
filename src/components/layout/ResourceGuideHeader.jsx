import { Bars3Icon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";

export default function ResourceGuideHeader({ onMenu, user }) {
  return (
    <header className="fixed top-0 z-50 w-full bg-brand-blue">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo links to Home */}
        <Link to="/">
          <img
            src="/casa-logo-light.png"
            alt="CASA Worcester"
            className="h-8 w-auto"
          />
        </Link>

        {/* Profile Picture + Hamburger */}
        <div className="flex items-center gap-4">
          {user && (
            <Link to="/profile" className="hover:opacity-90 transition-opacity">
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-8 w-8 rounded-full border-2 border-brand-white"
              />
            </Link>
          )}
          <button
            type="button"
            onClick={onMenu}
            className="p-0 text-brand-white hover:opacity-90"
            aria-label="Open menu"
            title="Open menu"
          >
            <Bars3Icon className="h-8 w-8" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
