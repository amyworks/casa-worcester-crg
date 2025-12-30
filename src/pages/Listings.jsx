import { useLocation } from "react-router-dom";

export default function Listings() {
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const q = params.get("q");

  const mode = pathname === "/search" ? "search" : "browse";

  return (
    <div className="px-6 pt-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-xl font-semibold">
          {mode === "search" ? "Search results" : "Browse resources"}
        </h2>

        {mode === "search" && (
          <p className="mt-2 text-sm text-gray-600">
            Query: <span className="font-mono">{q || "(none)"}</span>
          </p>
        )}

        <div className="mt-6 rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
          Listings UI comes next.
        </div>
      </div>
    </div>
  );
}
