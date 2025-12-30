import { useNavigate } from "react-router-dom";
import ResourceSearchBar from "../components/resources/ResourceSearchBar";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-brand-blue text-brand-white font-sans">
      <div className="mx-auto max-w-xl px-6 pt-10 text-center">
        <h1 className="text-5xl font-bold leading-[1.05]">
          CASA Worcester
          <br />
          Community
          <br />
          Resource Guide
        </h1>

        <div className="mt-10">
          <ResourceSearchBar
            variant="mock"
            placeholder="SEARCH"
            onSearch={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
          />
        </div>

        <div className="mt-10 text-3xl font-bold">
          OR
        </div>

        <button
          type="button"
          onClick={() => navigate("/browse")}
          className="mt-10 w-full rounded-xl bg-brand-red py-5 text-xl font-bold uppercase tracking-wide hover:bg-brand-red-hover active:scale-[0.99]"
        >
          Browse Resources
        </button>
        
      </div>
    </div>
  );
}
