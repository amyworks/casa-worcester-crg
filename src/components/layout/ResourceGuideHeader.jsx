import { Bars3Icon } from "@heroicons/react/24/solid";

export default function ResourceGuideHeader({ onMenu }) {
  return (
    <header className="fixed top-0 z-50 w-full bg-brand-blue">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Logo only */}
        <img
          src="/casa-logo-light.png"
          alt="CASA Worcester"
          className="h-8 w-auto"
        />

        {/* Hamburger */}
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
    </header>
  );
}
