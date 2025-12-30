import { Outlet } from "react-router-dom";
import { useState } from "react";
import ResourceGuideHeader from "./ResourceGuideHeader";
import ResourceGuideNavigation from "./ResourceGuideNavigation";

export default function ResourceGuideLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans bg-white">
      <ResourceGuideHeader onMenu={() => setNavOpen(true)} />
      <ResourceGuideNavigation open={navOpen} onClose={() => setNavOpen(false)} />

      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}
