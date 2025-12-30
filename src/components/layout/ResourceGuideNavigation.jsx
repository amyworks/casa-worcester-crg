import { Link } from "react-router-dom";

export default function ResourceGuideNavigation({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg p-4 flex flex-col gap-4">
        <button
          type="button"
          onClick={onClose}
          className="self-end text-sm text-gray-500 hover:text-gray-700"
        >
          Close
        </button>

        <nav className="flex flex-col gap-3 text-lg">
          <Link to="/" onClick={onClose}>Home</Link>
          <Link to="/search" onClick={onClose}>Search</Link>
          <Link to="/browse" onClick={onClose}>Browse</Link>
          <Link to="/signin" onClick={onClose}>Sign in</Link>
          <Link to="/request-access" onClick={onClose}>Request access</Link>
          <Link to="/admin" onClick={onClose}>Admin</Link>

          <a
            href="https://www.thecasaproject.org/"
            target="_blank"
            rel="noreferrer"
            className="pt-4 text-sm text-gray-500"
          >
            CASA Website
          </a>
        </nav>
      </div>
    </div>
  );
}
