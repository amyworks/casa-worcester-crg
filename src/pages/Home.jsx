import { useNavigate } from "react-router-dom";
import ResourceSearchBar from "../components/resources/ResourceSearchBar";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="-mt-20 min-h-screen pt-20 bg-brand-blue text-brand-white font-sans">
      <div className="mx-auto max-w-xl px-6 pt-10 text-center">
        <h1 className="leading-[1.05]">
          <span className="text-xl font-medium">CASA Project Worcester</span>
          <div className="h-[30px]" />
          <span className="text-5xl font-bold">
            Community
            <br />
            Resource Guide
          </span>
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
