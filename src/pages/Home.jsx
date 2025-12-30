import { useNavigate } from "react-router-dom";
import ResourceSearchBar from "../components/resources/ResourceSearchBar";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="px-6 pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          CASA Worcester Community Resource Guide
        </h1>

        <p className="mt-3 text-sm text-gray-600">
          Find trusted community resources. Search by keyword or browse categories.
        </p>

        <div className="mt-8 flex justify-center">
          <ResourceSearchBar
            placeholder="Search by name, service, or keyword"
            onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
          />
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate("/browse")}
            className="w-full max-w-xl rounded-full border border-gray-900 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Browse resources
          </button>
        </div>
      </div>
    </div>
  );
}
