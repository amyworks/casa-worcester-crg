import { useState } from "react";

export default function ResourceSearchBar({ onSearch, placeholder = "Search resources" }) {
  const [query, setQuery] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onSearch(q);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 shadow-sm">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-base"
          aria-label="Search resources"
        />
        <button
          type="submit"
          className="rounded-full px-4 py-2 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800"
        >
          Search
        </button>
      </div>
    </form>
  );
}
