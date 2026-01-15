import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  UserCircleIcon,
  FolderIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

// Table of contents sections
const SECTIONS = [
  { id: "getting-started", title: "Getting Started", icon: BookOpenIcon },
  { id: "browsing-resources", title: "Browsing Resources", icon: MagnifyingGlassIcon },
  { id: "saving-resources", title: "Saving Resources", icon: BookmarkIcon },
  { id: "your-profile", title: "Your Profile", icon: UserCircleIcon },
  { id: "case-management", title: "Case Management", icon: FolderIcon },
  { id: "staff-features", title: "Staff Features", icon: ShieldCheckIcon },
  { id: "faq", title: "Frequently Asked Questions", icon: QuestionMarkCircleIcon },
];

function SectionHeading({ id, title, icon: Icon }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-2xl font-bold text-brand-blue-dark pt-8 pb-4 border-b border-gray-200 scroll-mt-24">
      <Icon className="h-7 w-7 text-brand-blue" />
      {title}
    </h2>
  );
}

function SubHeading({ children }) {
  return <h3 className="text-lg font-semibold text-brand-blue-dark mt-6 mb-2">{children}</h3>;
}

function Paragraph({ children }) {
  return <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>;
}

function BulletList({ items }) {
  return (
    <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1 ml-4">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Tip({ children }) {
  return (
    <div className="bg-blue-50 border-l-4 border-brand-blue p-4 my-4 rounded-r">
      <p className="text-sm text-brand-blue-dark">
        <strong>Tip:</strong> {children}
      </p>
    </div>
  );
}

export default function UserGuide() {
  const location = useLocation();
  const { user, userRecord, hasCaseAccess, isAdmin } = useAuth();
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Scroll to section if hash is present
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  // Show/hide back to top button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-blue-dark mb-2">User Guide</h1>
          <p className="text-gray-600">
            Learn how to use the CASA Worcester Community Resource Guide to find resources and manage your case information.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-brand-blue-dark mb-4">Contents</h2>
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-2 text-brand-blue hover:text-brand-red transition-colors py-1"
              >
                <section.icon className="h-4 w-4" />
                {section.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Getting Started */}
        <SectionHeading id="getting-started" title="Getting Started" icon={BookOpenIcon} />

        <SubHeading>What is the Community Resource Guide?</SubHeading>
        <Paragraph>
          The CASA Worcester Community Resource Guide is a searchable database of community resources
          available to families in Worcester County. It helps CASA volunteers, staff, and community
          members find services for housing, food, healthcare, legal aid, and more.
        </Paragraph>

        <SubHeading>Creating an Account</SubHeading>
        <Paragraph>
          To access all features of the Resource Guide, you'll need to create an account:
        </Paragraph>
        <BulletList items={[
          "Click \"Sign In\" from the menu",
          "Sign in with your Google account",
          "New users will be asked to complete a brief registration form",
          "Select your affiliation (CASA Volunteer, Staff, Agency, or General User)",
        ]} />
        <Tip>
          If you're a CASA volunteer or staff member, make sure to select the appropriate affiliation
          during registration to access additional features.
        </Tip>

        <SubHeading>User Roles</SubHeading>
        <Paragraph>
          Different users have access to different features:
        </Paragraph>
        <BulletList items={[
          "General Users: Browse and save resources",
          "CASA Volunteers: Browse, save resources, and access case management (if assigned a case)",
          "CASA Staff: Browse, save resources, and may have additional administrative access",
          "Contributors: Can add and edit resources",
          "Managers: Can manage specific resources and users",
          "Administrators: Full access to all features",
        ]} />

        {/* Browsing Resources */}
        <SectionHeading id="browsing-resources" title="Browsing Resources" icon={MagnifyingGlassIcon} />

        <SubHeading>Searching for Resources</SubHeading>
        <Paragraph>
          Use the search bar to find resources by name, service type, or keyword. The search looks through
          organization names, descriptions, and services offered.
        </Paragraph>

        <SubHeading>Browsing by Category</SubHeading>
        <Paragraph>
          Click "Browse" from the menu to see all resources. You can filter by:
        </Paragraph>
        <BulletList items={[
          "Service Domain (Housing, Food, Healthcare, Legal, etc.)",
          "Population Served (Children, Families, Veterans, etc.)",
          "Geographic Coverage (City, County, Region)",
          "Access Method (Walk-in, Appointment, Referral, etc.)",
          "Special Features (Crisis services, Spanish-speaking, Transportation provided)",
        ]} />

        <SubHeading>Viewing Resource Details</SubHeading>
        <Paragraph>
          Click on any resource to see full details including:
        </Paragraph>
        <BulletList items={[
          "Contact information (phone, email, website)",
          "Address and service locations",
          "Hours of operation",
          "Services offered and eligibility requirements",
          "Fees and application process",
        ]} />
        <Tip>
          Look for the phone icon to call directly, or the globe icon to visit the organization's website.
        </Tip>

        {/* Saving Resources */}
        <SectionHeading id="saving-resources" title="Saving Resources" icon={BookmarkIcon} />

        <SubHeading>Bookmarking Resources</SubHeading>
        <Paragraph>
          When you find a helpful resource, you can save it for quick access later:
        </Paragraph>
        <BulletList items={[
          "Click the bookmark icon on any resource card",
          "Gold bookmark = saved, outline = not saved",
          "Access your saved resources from \"Saved Resources\" in the menu",
        ]} />

        <SubHeading>Managing Saved Resources</SubHeading>
        <Paragraph>
          Visit the "Saved Resources" page to see all your bookmarked resources in one place.
          Click the bookmark icon again to remove a resource from your saved list.
        </Paragraph>

        {/* Your Profile */}
        <SectionHeading id="your-profile" title="Your Profile" icon={UserCircleIcon} />

        <SubHeading>Viewing Your Profile</SubHeading>
        <Paragraph>
          Access your profile from the menu to see:
        </Paragraph>
        <BulletList items={[
          "Your account information",
          "Your role and permissions",
          "Your affiliated organization (if applicable)",
        ]} />

        <SubHeading>Requesting Additional Access</SubHeading>
        <Paragraph>
          If you need contributor or administrative access to manage resources, you can submit
          an access request from your profile or the "Request Access" page. An administrator
          will review your request.
        </Paragraph>

        {/* Case Management */}
        <SectionHeading id="case-management" title="Case Management" icon={FolderIcon} />

        {hasCaseAccess ? (
          <>
            <Paragraph>
              As a CASA volunteer with an assigned case, you have access to the Case Management
              feature to help organize your case information.
            </Paragraph>

            <SubHeading>Family Members</SubHeading>
            <Paragraph>
              Track information about family members involved in your case:
            </Paragraph>
            <BulletList items={[
              "Add family members with their role (parent, child, etc.), age, and gender",
              "For children: track placement, school, and developmental information",
              "For adults: track housing, employment, and agency involvement",
              "Record strengths and treatment services for each person",
            ]} />

            <SubHeading>Case Contacts</SubHeading>
            <Paragraph>
              Keep track of important contacts for your case:
            </Paragraph>
            <BulletList items={[
              "Required contacts: Judge, DCF Social Worker, CASA Supervisor",
              "Additional contacts: Therapists, teachers, mentors, attorneys, etc.",
              "Store names, phone numbers, emails, and organizations",
            ]} />

            <SubHeading>Visitation Arrangements</SubHeading>
            <Paragraph>
              Document visitation schedules and changes:
            </Paragraph>
            <BulletList items={[
              "Track parental, sibling, and kinship visitation",
              "Record frequency, supervision level, and location",
              "Log changes with dates and reasons",
              "Note behavioral observations related to visitation",
            ]} />

            <SubHeading>Case Notes</SubHeading>
            <Paragraph>
              Keep detailed notes organized by type:
            </Paragraph>
            <BulletList items={[
              "Case updates and changes",
              "Recent visit observations",
              "Contact logs",
              "Recommendations",
              "Court report summaries",
              "Supervision meeting notes",
            ]} />

            <Tip>
              All case information is stored securely and is only accessible to you.
              No case numbers or full names are required - use first names only to protect privacy.
            </Tip>
          </>
        ) : (
          <Paragraph>
            Case Management is available to CASA volunteers who have been assigned a case.
            If you're a CASA volunteer and need access to this feature, please contact your
            CASA supervisor to have your account updated.
          </Paragraph>
        )}

        {/* Staff Features */}
        <SectionHeading id="staff-features" title="Staff Features" icon={ShieldCheckIcon} />

        {isAdmin ? (
          <>
            <Paragraph>
              As an administrator or staff member, you have access to additional features:
            </Paragraph>

            <SubHeading>Managing Resources</SubHeading>
            <BulletList items={[
              "Add new resources using the \"Add Resource\" button",
              "Edit existing resources by clicking \"Edit\" on any resource",
              "Mark resources as unavailable when services are suspended",
              "Upload organization logos",
            ]} />

            <SubHeading>Admin Panel</SubHeading>
            <Paragraph>
              Access the Admin panel from the menu to:
            </Paragraph>
            <BulletList items={[
              "View and manage all users",
              "Approve or deny access requests",
              "Assign user roles and permissions",
              "View resources assigned to you for management",
            ]} />
          </>
        ) : (
          <Paragraph>
            Staff features are available to approved contributors, managers, and administrators.
            If you need staff access to add or edit resources, you can submit a request from
            the <Link to="/request-access" className="text-brand-blue hover:text-brand-red underline">Request Access</Link> page.
          </Paragraph>
        )}

        {/* FAQ */}
        <SectionHeading id="faq" title="Frequently Asked Questions" icon={QuestionMarkCircleIcon} />

        <SubHeading>How do I report an error in a resource listing?</SubHeading>
        <Paragraph>
          If you find incorrect information for a resource, please contact your CASA supervisor
          or email the organization directly. Staff members with edit access can update the listing.
        </Paragraph>

        <SubHeading>Can I access the Resource Guide on my phone?</SubHeading>
        <Paragraph>
          Yes! The Resource Guide is fully mobile-friendly. You can access it from any device
          with a web browser at casa-worcester-crg.web.app.
        </Paragraph>

        <SubHeading>How do I add a new resource?</SubHeading>
        <Paragraph>
          Only approved contributors, managers, and administrators can add new resources.
          If you'd like to suggest a resource be added, contact a staff member or submit
          an access request if you need to add resources regularly.
        </Paragraph>

        <SubHeading>Is my case information secure?</SubHeading>
        <Paragraph>
          Yes. Case information is stored securely and is only accessible to your account.
          We use Firebase's security infrastructure, and the app is designed to minimize
          sensitive data - only first names are used, and no case numbers are stored.
        </Paragraph>

        <SubHeading>Who do I contact for help?</SubHeading>
        <Paragraph>
          For questions about using the Resource Guide, contact your CASA supervisor.
          For technical issues with the application, contact CASA Worcester.
        </Paragraph>

        {/* Bottom spacing */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            Need more help? Contact your CASA supervisor or reach out to CASA Worcester.
          </p>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-brand-blue text-white rounded-full shadow-lg hover:bg-brand-blue-dark transition-all hover:scale-105"
          aria-label="Back to top"
          title="Back to top"
        >
          <ChevronUpIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
