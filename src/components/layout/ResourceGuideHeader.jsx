export default function ResourceGuideHeader({ onMenu }) {
  return (
    <header className="fixed top-0 z-50 w-full h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="font-semibold text-lg">
        CASA Worcester Resource Guide
      </div>

      <button
        type="button"
        onClick={onMenu}
        className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-label="Open menu"
      >
        ☰
      </button>
    </header>
  );
}
