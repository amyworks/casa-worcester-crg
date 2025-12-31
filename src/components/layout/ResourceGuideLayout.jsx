import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ResourceGuideHeader from "./ResourceGuideHeader";
import ResourceGuideNavigation from "./ResourceGuideNavigation";

export default function ResourceGuideLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen font-sans bg-white">
      <ResourceGuideHeader onMenu={() => setNavOpen(true)} user={user} />
      <ResourceGuideNavigation 
        open={navOpen} 
        onClose={() => setNavOpen(false)} 
        user={user}
      />

      <main className="pt-20">
        <Outlet />
      </main>
    </div>
  );
}
