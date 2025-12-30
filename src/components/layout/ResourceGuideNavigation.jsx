import { Link } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function ResourceGuideNavigation({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-brand-blue text-brand-white">
      <div className="mx-auto flex h-full max-w-5xl flex-col px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">Menu</div>

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

          <a
            href="https://www.thecasaproject.org/"
            target="_blank"
            rel="noreferrer"
            className="mt-6 text-xl font-normal underline underline-offset-4"
          >
            CASA Website
          </a>
        </nav>
      </div>
    </div>
  );
}
