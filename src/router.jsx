import { createBrowserRouter } from "react-router-dom";

import ResourceGuideLayout from "./components/layout/ResourceGuideLayout";

import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ResourceDetail from "./pages/ResourceDetail";
import AddResource from "./pages/AddResource";
import SignIn from "./pages/SignIn";
import RequestAccess from "./pages/RequestAccess";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ResourceGuideLayout />,
    children: [
      { index: true, element: <Home /> },                 // /
      { path: "browse", element: <Listings /> },          // /browse
      { path: "search", element: <Listings /> },          // /search (same page, different mode)
      { path: "resource/:id", element: <ResourceDetail /> }, // /resource/abc123
      { path: "add-resource", element: <AddResource /> }, // /add-resource (admin only)
      { path: "signin", element: <SignIn /> },            // /signin
      { path: "request-access", element: <RequestAccess /> }, // /request-access
      { path: "admin", element: <Admin /> },              // /admin (gate later)
      { path: "profile", element: <Profile /> },          // /profile
      { path: "terms", element: <Terms /> },
      { path: "privacy", element: <Privacy /> },
    ],
  },
]);
