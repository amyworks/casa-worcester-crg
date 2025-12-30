import { Link } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function ResourceGuideNavigation({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] h-screen bg-brand-blue text-brand-white">
      <div className="mx-auto flex h-full max-w-5xl flex-col px-6 pt-6">
        {/* Top row: close button only */}
        <div className="flex items-center justify-end">
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
          <Link to="/search" onClick={onClose} className="text-3xl font-bold">
            Search
          </Link>
          <Link to="/browse" onClick={onClose} className="text-3xl font-bold">
            Browse
          </Link>
          <Link to="/request-access" onClick={onClose} className="text-3xl font-bold">
            Request Access
          </Link>
          <Link to="/signin" onClick={onClose} className="text-3xl font-bold">
            Sign In
          </Link>
        </nav>

        {/* Footer pinned to bottom of the PAGE (viewport) */}
        <div className="mt-auto pt-6 pb-[50px]">
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
