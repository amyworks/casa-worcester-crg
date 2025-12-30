import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";

export default function ResourceSearchBar({
  onSearch,
  placeholder = "Search",
}) {
  const [query, setQuery] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onSearch(q);
  };

  return (
    <form onSubmit={submit} className="w-full max-w-xl">
      <div className="h-[60px] flex items-center gap-3 rounded-full border border-brand-gray bg-brand-white px-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent font-medium text-brand-blue placeholder:text-brand-gray outline-none"
          aria-label="Search resources"
        />

        <button
          type="submit"
          className="p-0 text-brand-red hover:text-brand-red-hover"
          aria-label="Search"
          title="Search"
        >
          <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
