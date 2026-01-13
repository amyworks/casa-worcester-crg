import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getCases, createCase, updateCase } from "../firebase/firestore";
import FamilyMemberForm from "../components/cases/FamilyMemberForm";
import CaseNoteForm from "../components/cases/CaseNoteForm";
import CaseContactForm, { REQUIRED_CONTACT_ROLES } from "../components/cases/CaseContactForm";
import VisitationForm from "../components/cases/VisitationForm";
import VisitationLogForm from "../components/cases/VisitationLogForm";
import {
  JUVENILE_COURTS,
  DCF_AREA_OFFICES,
} from "../data/massachusettsOffices";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PhoneIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";

// Case-level dropdown options
const DCF_INVOLVEMENT_OPTIONS = [
  "Family support",
  "Foster care",
  "Kinship",
  "Adoption / guardianship",
];

const CASE_DESIGNATION_OPTIONS = [
  "Care & protection",
  "CRA",
  "SAFE Haven",
];

const PERMANENCY_GOAL_OPTIONS = [
  "Reunification",
  "Adoption / guardianship",
  "Independence",
  "Supportive Care (I/DDS)",
];

// Additional agencies that may be involved (with abbreviations and full names for tooltips)
const ADDITIONAL_AGENCIES = [
  { abbrev: "DYS", full: "Department of Youth Services" },
  { abbrev: "DMH", full: "Department of Mental Health" },
  { abbrev: "DDS", full: "Department of Developmental Services" },
  { abbrev: "DTA", full: "Department of Transitional Assistance" },
  { abbrev: "MassHealth", full: "MassHealth" },
  { abbrev: "SSI/SSDI", full: "Supplemental Security Income / Social Security Disability Insurance" },
  { abbrev: "MPS", full: "Massachusetts Probation Service" },
  { abbrev: "Immigration Services", full: "Immigration Services" },
  { abbrev: "Housing Authority", full: "Housing Authority" },
  { abbrev: "School District", full: "School District" },
  { abbrev: "Early Intervention", full: "Early Intervention" },
];

// Case issues (multiselect checkboxes)
const CASE_ISSUES = [
  "Abuse",
  "Neglect",
  "Trauma",
  "Justice involvement",
  "Incarceration",
  "Substance use",
  "Disabilities",
  "Housing instability",
  "Poverty / financial",
  "Sexual abuse / trauma",
  "Mental health",
  "Autism",
  "Homelessness",
  "Immigration",
  "Divorce",
];

// Visitation type labels for display
const VISITATION_TYPE_LABELS = {
  sibling: "Sibling Visitation",
  parental: "Parental Visitation",
  kinship: "Kinship Visitation",
  other: "Other Visitation",
};

// Visitation status colors for badges
const VISITATION_STATUS_COLORS = {
  active: "bg-green-100 text-green-800 border-green-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  suspended: "bg-red-100 text-red-800 border-red-200",
  paused: "bg-orange-100 text-orange-800 border-orange-200",
  revoked: "bg-red-200 text-red-900 border-red-300",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
};

// Log entry type colors
const LOG_ENTRY_TYPE_COLORS = {
  ordered: "bg-blue-100 text-blue-800",
  recommended: "bg-blue-50 text-blue-700",
  started: "bg-green-100 text-green-800",
  modified: "bg-yellow-100 text-yellow-800",
  suspended: "bg-red-100 text-red-800",
  paused: "bg-orange-100 text-orange-800",
  resumed: "bg-green-50 text-green-700",
  revoked: "bg-red-200 text-red-900",
  lapsed: "bg-gray-100 text-gray-800",
  completed: "bg-gray-200 text-gray-800",
  behavioral_note: "bg-purple-100 text-purple-800",
  incident: "bg-red-50 text-red-700",
  positive_update: "bg-emerald-100 text-emerald-800",
};

// Child roles for display logic
const CHILD_ROLES = ["child", "stepsibling", "half sibling", "adoptive sibling"];

// Note type colors for visual distinction
const NOTE_TYPE_COLORS = {
  "Case update": "bg-blue-100 text-blue-800 border-blue-200",
  "Recent visit": "bg-green-100 text-green-800 border-green-200",
  "Contact": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Recommendation": "bg-purple-100 text-purple-800 border-purple-200",
  "Court report": "bg-red-100 text-red-800 border-red-200",
  "Supervision": "bg-orange-100 text-orange-800 border-orange-200",
};

// VisitationCard component for displaying each visitation arrangement
function VisitationCard({
  visitation,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddLog,
  onDeleteLog,
  getFamilyMemberNames,
  getAuthorityDisplay,
  formatDateOnly,
  actionLoading,
}) {
  const statusColor = VISITATION_STATUS_COLORS[visitation.status] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <div className={`rounded border ${statusColor}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${statusColor}`}>
              {visitation.status}
            </span>
            {visitation.supervision && (
              <span className="text-xs px-2 py-0.5 bg-white bg-opacity-50 rounded">
                {visitation.supervision}
              </span>
            )}
            {visitation.frequency && (
              <span className="text-xs text-gray-600">
                {visitation.frequency}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-800 mt-1">
            {getFamilyMemberNames(visitation.familyMemberIds)}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            onClick={onToggleExpand}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white hover:bg-opacity-50 rounded text-xs font-medium"
          >
            {expanded ? "Less" : "More"}
          </button>
          <button
            onClick={onEdit}
            disabled={actionLoading}
            className="p-1.5 text-gray-500 hover:text-brand-blue hover:bg-white hover:bg-opacity-50 rounded"
            title="Edit"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={actionLoading}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white hover:bg-opacity-50 rounded"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-200 border-opacity-50 mt-2 pt-3 space-y-3">
          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs font-medium text-gray-600">Authority</span>
              <p className="text-gray-800">{getAuthorityDisplay(visitation)}</p>
            </div>
            {visitation.location && (
              <div>
                <span className="text-xs font-medium text-gray-600">Location</span>
                <p className="text-gray-800">{visitation.location}</p>
              </div>
            )}
          </div>

          {/* Permissions */}
          {visitation.permissions?.length > 0 && (
            <div>
              <span className="text-xs font-medium text-gray-600 block mb-1">Permissions</span>
              <div className="flex flex-wrap gap-1">
                {visitation.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="text-xs px-2 py-0.5 bg-white bg-opacity-70 rounded border border-gray-200"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {visitation.notes && (
            <div>
              <span className="text-xs font-medium text-gray-600 block mb-1">Notes</span>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{visitation.notes}</p>
            </div>
          )}

          {/* Log Entries */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Change Log</span>
              <button
                onClick={onAddLog}
                disabled={actionLoading}
                className="flex items-center gap-1 text-xs text-brand-blue hover:text-brand-blue-dark font-medium"
              >
                <PlusIcon className="h-3 w-3" />
                Add Entry
              </button>
            </div>
            {visitation.logEntries?.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {visitation.logEntries.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded text-xs ${LOG_ENTRY_TYPE_COLORS[log.entryType] || "bg-gray-50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{log.entryType.replace("_", " ")}</span>
                        <span className="text-gray-600">{formatDateOnly(log.date)}</span>
                      </div>
                      <button
                        onClick={() => onDeleteLog(log.id)}
                        disabled={actionLoading}
                        className="p-0.5 text-gray-500 hover:text-red-600 rounded"
                        title="Delete entry"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1 text-gray-700">{log.details}</p>
                    {log.behavioralObservations && (
                      <p className="mt-1 text-purple-700 italic">
                        Behavioral: {log.behavioralObservations}
                      </p>
                    )}
                    {log.actionTaken && (
                      <p className="mt-1 text-gray-600">
                        Action: {log.actionTaken}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No log entries yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CaseManagement() {
  const navigate = useNavigate();
  const { userRecord, hasCaseAccess } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showVisitationForm, setShowVisitationForm] = useState(false);
  const [showVisitationLogForm, setShowVisitationLogForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [editingContactIsRequired, setEditingContactIsRequired] = useState(false);
  const [editingVisitation, setEditingVisitation] = useState(null);
  const [selectedVisitationForLog, setSelectedVisitationForLog] = useState(null);
  const [expandedVisitations, setExpandedVisitations] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  // Case info fields
  const [dcfInvolvement, setDcfInvolvement] = useState("");
  const [caseDesignation, setCaseDesignation] = useState("");
  const [permanencyGoal, setPermanencyGoal] = useState("");
  const [court, setCourt] = useState("");
  const [dcfOffice, setDcfOffice] = useState("");
  const [additionalAgencies, setAdditionalAgencies] = useState([]);
  const [otherAgencies, setOtherAgencies] = useState("");

  // Case issues
  const [caseIssues, setCaseIssues] = useState([]);

  // Section collapse states
  const [expandedSections, setExpandedSections] = useState({
    caseInfo: true,
    contacts: true,
    familyMembers: true,
    visitation: true,
    issues: true,
    notes: true,
  });

  // Expanded notes for viewing full details
  const [expandedNotes, setExpandedNotes] = useState({});

  // Edit mode for case info and issues sections
  const [editingCaseInfo, setEditingCaseInfo] = useState(false);
  const [editingIssues, setEditingIssues] = useState(false);

  useEffect(() => {
    if (!hasCaseAccess) {
      navigate("/");
      return;
    }
    fetchCase();
  }, [hasCaseAccess, navigate, userRecord?.id]);

  const fetchCase = async () => {
    if (!userRecord?.id) return;
    try {
      setLoading(true);
      const cases = await getCases(userRecord.id);
      if (cases.length > 0) {
        const c = cases[0];
        setCaseData(c);
        setDcfInvolvement(c.dcfInvolvement || "");
        setCaseDesignation(c.caseDesignation || "");
        setPermanencyGoal(c.permanencyGoal || "");
        setCourt(c.court || "");
        setDcfOffice(c.dcfOffice || "");
        setAdditionalAgencies(c.additionalAgencies || []);
        setOtherAgencies(c.otherAgencies || "");
        setCaseIssues(c.caseIssues || []);
      } else {
        const newCase = await createCase(userRecord.id);
        setCaseData({ id: newCase.id, familyMembers: [], notes: [] });
      }
    } catch (err) {
      console.error("Error fetching case:", err);
      setError("Failed to load case data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleNoteExpanded = (noteId) => {
    setExpandedNotes((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  // Save case info changes
  const handleSaveCaseInfo = async () => {
    try {
      setActionLoading(true);
      await updateCase(userRecord.id, caseData.id, {
        dcfInvolvement,
        caseDesignation,
        permanencyGoal,
        court,
        dcfOffice,
        additionalAgencies,
        otherAgencies,
      });
      setCaseData({
        ...caseData,
        dcfInvolvement,
        caseDesignation,
        permanencyGoal,
        court,
        dcfOffice,
        additionalAgencies,
        otherAgencies,
      });
      setEditingCaseInfo(false);
    } catch (err) {
      console.error("Error saving case info:", err);
      setError("Failed to save case info");
    } finally {
      setActionLoading(false);
    }
  };

  // Save case issues changes
  const handleSaveCaseIssues = async () => {
    try {
      setActionLoading(true);
      await updateCase(userRecord.id, caseData.id, {
        caseIssues,
      });
      setCaseData({
        ...caseData,
        caseIssues,
      });
      setEditingIssues(false);
    } catch (err) {
      console.error("Error saving case issues:", err);
      setError("Failed to save case issues");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel editing case info
  const handleCancelCaseInfo = () => {
    setDcfInvolvement(caseData?.dcfInvolvement || "");
    setCaseDesignation(caseData?.caseDesignation || "");
    setPermanencyGoal(caseData?.permanencyGoal || "");
    setCourt(caseData?.court || "");
    setDcfOffice(caseData?.dcfOffice || "");
    setAdditionalAgencies(caseData?.additionalAgencies || []);
    setOtherAgencies(caseData?.otherAgencies || "");
    setEditingCaseInfo(false);
  };

  // Toggle additional agency
  const handleAgencyToggle = (agency) => {
    setAdditionalAgencies((prev) =>
      prev.includes(agency) ? prev.filter((a) => a !== agency) : [...prev, agency]
    );
  };

  // Cancel editing case issues
  const handleCancelCaseIssues = () => {
    setCaseIssues(caseData?.caseIssues || []);
    setEditingIssues(false);
  };

  // Family member handlers
  const handleAddMember = () => {
    setEditingMember(null);
    setShowMemberForm(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowMemberForm(true);
  };

  const handleSaveMember = async (memberData) => {
    try {
      setActionLoading(true);
      let updatedMembers;
      if (editingMember) {
        updatedMembers = caseData.familyMembers.map((m) =>
          m.id === memberData.id ? memberData : m
        );
      } else {
        updatedMembers = [...(caseData.familyMembers || []), memberData];
      }

      await updateCase(userRecord.id, caseData.id, { familyMembers: updatedMembers });
      setCaseData({ ...caseData, familyMembers: updatedMembers });
      setShowMemberForm(false);
      setEditingMember(null);
    } catch (err) {
      console.error("Error saving family member:", err);
      setError("Failed to save family member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      setActionLoading(true);
      const updatedMembers = caseData.familyMembers.filter((m) => m.id !== memberId);
      await updateCase(userRecord.id, caseData.id, { familyMembers: updatedMembers });
      setCaseData({ ...caseData, familyMembers: updatedMembers });
    } catch (err) {
      console.error("Error deleting family member:", err);
      setError("Failed to delete family member");
    } finally {
      setActionLoading(false);
    }
  };

  // Case issues handlers
  const handleIssueToggle = (issue) => {
    setCaseIssues((prev) =>
      prev.includes(issue) ? prev.filter((i) => i !== issue) : [...prev, issue]
    );
  };

  // Case notes handlers
  const handleSaveNote = async (noteData) => {
    try {
      setActionLoading(true);
      const updatedNotes = [noteData, ...(caseData.notes || [])];
      await updateCase(userRecord.id, caseData.id, { notes: updatedNotes });
      setCaseData({ ...caseData, notes: updatedNotes });
      setShowNoteForm(false);
    } catch (err) {
      console.error("Error adding note:", err);
      setError("Failed to add note");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      setActionLoading(true);
      const updatedNotes = (caseData.notes || []).filter((n) => n.id !== noteId);
      await updateCase(userRecord.id, caseData.id, { notes: updatedNotes });
      setCaseData({ ...caseData, notes: updatedNotes });
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
    } finally {
      setActionLoading(false);
    }
  };

  // Case contacts handlers
  const handleEditRequiredContact = (role) => {
    const existingContact = (caseData.contacts || []).find(c => c.role === role && c.isRequired);
    setEditingContact(existingContact || { role, isRequired: true });
    setEditingContactIsRequired(true);
    setShowContactForm(true);
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setEditingContactIsRequired(false);
    setShowContactForm(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setEditingContactIsRequired(contact.isRequired);
    setShowContactForm(true);
  };

  const handleSaveContact = async (contactData) => {
    try {
      setActionLoading(true);
      let updatedContacts;
      const existingContacts = caseData.contacts || [];

      if (editingContact?.id) {
        // Editing existing contact
        updatedContacts = existingContacts.map((c) =>
          c.id === contactData.id ? contactData : c
        );
      } else if (contactData.isRequired) {
        // Adding/updating required contact
        const existingIndex = existingContacts.findIndex(
          c => c.role === contactData.role && c.isRequired
        );
        if (existingIndex >= 0) {
          updatedContacts = [...existingContacts];
          updatedContacts[existingIndex] = contactData;
        } else {
          updatedContacts = [...existingContacts, contactData];
        }
      } else {
        // Adding new additional contact
        updatedContacts = [...existingContacts, contactData];
      }

      await updateCase(userRecord.id, caseData.id, { contacts: updatedContacts });
      setCaseData({ ...caseData, contacts: updatedContacts });
      setShowContactForm(false);
      setEditingContact(null);
    } catch (err) {
      console.error("Error saving contact:", err);
      setError("Failed to save contact");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      setActionLoading(true);
      const updatedContacts = (caseData.contacts || []).filter((c) => c.id !== contactId);
      await updateCase(userRecord.id, caseData.id, { contacts: updatedContacts });
      setCaseData({ ...caseData, contacts: updatedContacts });
    } catch (err) {
      console.error("Error deleting contact:", err);
      setError("Failed to delete contact");
    } finally {
      setActionLoading(false);
    }
  };

  // Get contact by role (for required contacts)
  const getRequiredContact = (role) => {
    return (caseData?.contacts || []).find(c => c.role === role && c.isRequired);
  };

  // Get additional contacts (non-required)
  const getAdditionalContacts = () => {
    return (caseData?.contacts || []).filter(c => !c.isRequired);
  };

  // Visitation handlers
  const handleAddVisitation = () => {
    setEditingVisitation(null);
    setShowVisitationForm(true);
  };

  const handleEditVisitation = (visitation) => {
    setEditingVisitation(visitation);
    setShowVisitationForm(true);
  };

  const handleSaveVisitation = async (visitationData) => {
    try {
      setActionLoading(true);
      let updatedVisitations;
      const existingVisitations = caseData.visitations || [];

      if (editingVisitation) {
        updatedVisitations = existingVisitations.map((v) =>
          v.id === visitationData.id ? visitationData : v
        );
      } else {
        updatedVisitations = [...existingVisitations, visitationData];
      }

      await updateCase(userRecord.id, caseData.id, { visitations: updatedVisitations });
      setCaseData({ ...caseData, visitations: updatedVisitations });
      setShowVisitationForm(false);
      setEditingVisitation(null);
    } catch (err) {
      console.error("Error saving visitation:", err);
      setError("Failed to save visitation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVisitation = async (visitationId) => {
    if (!window.confirm("Are you sure you want to delete this visitation record? This will also remove all log entries.")) {
      return;
    }
    try {
      setActionLoading(true);
      const updatedVisitations = (caseData.visitations || []).filter((v) => v.id !== visitationId);
      await updateCase(userRecord.id, caseData.id, { visitations: updatedVisitations });
      setCaseData({ ...caseData, visitations: updatedVisitations });
    } catch (err) {
      console.error("Error deleting visitation:", err);
      setError("Failed to delete visitation");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLogEntry = (visitationId) => {
    setSelectedVisitationForLog(visitationId);
    setShowVisitationLogForm(true);
  };

  const handleSaveLogEntry = async (logEntry) => {
    try {
      setActionLoading(true);
      const updatedVisitations = (caseData.visitations || []).map((v) => {
        if (v.id === logEntry.visitationId) {
          return {
            ...v,
            logEntries: [logEntry, ...(v.logEntries || [])],
            updatedAt: new Date().toISOString(),
          };
        }
        return v;
      });

      await updateCase(userRecord.id, caseData.id, { visitations: updatedVisitations });
      setCaseData({ ...caseData, visitations: updatedVisitations });
      setShowVisitationLogForm(false);
      setSelectedVisitationForLog(null);
    } catch (err) {
      console.error("Error adding log entry:", err);
      setError("Failed to add log entry");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLogEntry = async (visitationId, logEntryId) => {
    try {
      setActionLoading(true);
      const updatedVisitations = (caseData.visitations || []).map((v) => {
        if (v.id === visitationId) {
          return {
            ...v,
            logEntries: (v.logEntries || []).filter((l) => l.id !== logEntryId),
            updatedAt: new Date().toISOString(),
          };
        }
        return v;
      });

      await updateCase(userRecord.id, caseData.id, { visitations: updatedVisitations });
      setCaseData({ ...caseData, visitations: updatedVisitations });
    } catch (err) {
      console.error("Error deleting log entry:", err);
      setError("Failed to delete log entry");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleVisitationExpanded = (visitationId) => {
    setExpandedVisitations((prev) => ({
      ...prev,
      [visitationId]: !prev[visitationId],
    }));
  };

  // Get visitations grouped by type
  const getVisitationsByType = (type) => {
    return (caseData?.visitations || []).filter((v) => v.type === type);
  };

  // Get family member names for display
  const getFamilyMemberNames = (memberIds) => {
    if (!memberIds || !caseData?.familyMembers) return "";
    return memberIds
      .map((id) => {
        const member = caseData.familyMembers.find((m) => m.id === id);
        return member ? `${member.firstName} (${member.familyRole})` : "";
      })
      .filter(Boolean)
      .join(", ");
  };

  // Get authority display text
  const getAuthorityDisplay = (visitation) => {
    if (visitation.authorityType === "other") {
      return visitation.authorityOther || "Other";
    }
    if (visitation.authorityContactId && caseData?.contacts) {
      const contact = caseData.contacts.find((c) => c.id === visitation.authorityContactId);
      if (contact) {
        return `${contact.name} (${contact.role})`;
      }
    }
    const typeLabels = {
      court: "Court Ordered",
      dcf: "DCF Recommended",
      agreement: "Family Agreement",
    };
    return typeLabels[visitation.authorityType] || visitation.authorityType;
  };

  const formatMemberLabel = (member) => {
    const isChild = CHILD_ROLES.includes(member.familyRole);
    let label = `${member.firstName} - ${member.age}yo ${member.gender} (${member.familyRole})`;
    if (isChild && member.placement) {
      label += ` | ${member.placement}`;
    }
    if (!isChild && member.statuses?.length > 0) {
      label += ` | ${member.statuses.join(", ")}`;
    }
    if (member.medicated) {
      label += ` | Medicated: ${member.medicated}`;
    }
    return label;
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Render note details based on type
  const renderNoteDetails = (note) => {
    const details = [];

    switch (note.noteType) {
      case "Case update":
        if (note.changesDescription) {
          details.push(
            <div key="changes" className="mt-2">
              <span className="font-medium text-gray-700">Changes made: </span>
              <span className="text-gray-600">{note.changesDescription}</span>
            </div>
          );
        }
        break;

      case "Recent visit":
        details.push(
          <div key="visit" className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-gray-700">Visit: </span>
            {formatDateOnly(note.visitDate)}
            {note.visitTime && ` at ${formatTime(note.visitTime)}`}
            {note.visitLocation && ` - ${note.visitLocation}`}
          </div>
        );
        break;

      case "Contact":
        details.push(
          <div key="contact" className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-gray-700">Method: </span>
            {note.contactMethod}
            {note.contactPartyLocations && (
              <div className="ml-4 mt-1">
                <span className="font-medium text-gray-700">Locations: </span>
                {note.contactPartyLocations}
              </div>
            )}
            {note.inPersonLocation && (
              <div className="ml-4 mt-1">
                <span className="font-medium text-gray-700">Location: </span>
                {note.inPersonLocation}
              </div>
            )}
          </div>
        );
        break;

      case "Recommendation":
        details.push(
          <div key="rec" className="mt-2 text-sm space-y-1">
            <div>
              <span className="font-medium text-gray-700">Recommended action: </span>
              <span className="text-gray-600">{note.recommendedAction}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Reasoning: </span>
              <span className="text-gray-600">{note.reasoning}</span>
            </div>
            {note.supervisorMeetingDate && (
              <div>
                <span className="font-medium text-gray-700">Bringing to supervisor: </span>
                <span className="text-gray-600">{formatDateOnly(note.supervisorMeetingDate)}</span>
              </div>
            )}
          </div>
        );
        break;

      case "Court report":
        details.push(
          <div key="court" className="mt-2 text-sm space-y-1">
            <div>
              <span className="font-medium text-gray-700">Hearing: </span>
              <span className="text-gray-600">
                {note.hearingType} on {formatDateOnly(note.hearingDate)}
                {note.hearingTime && ` at ${formatTime(note.hearingTime)}`}
              </span>
            </div>
            {note.attendees && (
              <div>
                <span className="font-medium text-gray-700">Attendees: </span>
                <span className="text-gray-600">{note.attendees}</span>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Report overview: </span>
              <span className="text-gray-600">{note.reportOverview}</span>
            </div>
          </div>
        );
        break;

      case "Supervision":
        details.push(
          <div key="sup" className="mt-2 text-sm space-y-1">
            <div>
              <span className="font-medium text-gray-700">Meeting: </span>
              <span className="text-gray-600">
                {note.supervisionType} on {formatDateOnly(note.supervisionDate)}
                {note.supervisionTime && ` at ${formatTime(note.supervisionTime)}`}
                {note.supervisionLocation && ` - ${note.supervisionLocation}`}
              </span>
            </div>
            {note.supervisionNotes && (
              <div>
                <span className="font-medium text-gray-700">Discussion: </span>
                <span className="text-gray-600">{note.supervisionNotes}</span>
              </div>
            )}
          </div>
        );
        break;
    }

    if (note.content) {
      details.push(
        <div key="content" className="mt-2 text-sm">
          <span className="font-medium text-gray-700">Notes: </span>
          <span className="text-gray-600">{note.content}</span>
        </div>
      );
    }

    return details;
  };

  // Get summary for collapsed note view
  const getNoteSummary = (note) => {
    switch (note.noteType) {
      case "Case update":
        return note.changesDescription?.substring(0, 100) || "Case information updated";
      case "Recent visit":
        return `Visit on ${formatDateOnly(note.visitDate)}${note.visitLocation ? ` at ${note.visitLocation}` : ""}`;
      case "Contact":
        return `${note.contactMethod} contact`;
      case "Recommendation":
        return note.recommendedAction?.substring(0, 100) || "Recommendation made";
      case "Court report":
        return `${note.hearingType} on ${formatDateOnly(note.hearingDate)}`;
      case "Supervision":
        return `${note.supervisionType} on ${formatDateOnly(note.supervisionDate)}`;
      default:
        return note.content?.substring(0, 100) || "Note added";
    }
  };

  if (!hasCaseAccess) {
    return null;
  }

  return (
    <div className="bg-white px-6 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-blue-dark">My Case</h1>
          <p className="text-gray-600 mt-1">
            Track case information, family members, and notes
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-600 py-12">Loading case data...</div>
        ) : (
          <div className="space-y-6">
            {/* Case Information Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("caseInfo")}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-brand-blue" />
                  <h3 className="font-semibold text-brand-blue-dark">Case Information</h3>
                </div>
                <div className="flex items-center gap-2">
                  {!editingCaseInfo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCaseInfo(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-brand-red text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {expandedSections.caseInfo ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>

              {expandedSections.caseInfo && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  {editingCaseInfo ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            DCF Involvement
                          </label>
                          <select
                            value={dcfInvolvement}
                            onChange={(e) => setDcfInvolvement(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          >
                            <option value="">Select...</option>
                            {DCF_INVOLVEMENT_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Case Designation
                          </label>
                          <select
                            value={caseDesignation}
                            onChange={(e) => setCaseDesignation(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          >
                            <option value="">Select...</option>
                            {CASE_DESIGNATION_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Permanency Goal
                          </label>
                          <select
                            value={permanencyGoal}
                            onChange={(e) => setPermanencyGoal(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          >
                            <option value="">Select...</option>
                            {PERMANENCY_GOAL_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Court and DCF Office */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Court
                          </label>
                          <select
                            value={court}
                            onChange={(e) => setCourt(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          >
                            <option value="">Select court...</option>
                            {JUVENILE_COURTS.map((c) => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            DCF Area Office
                          </label>
                          <select
                            value={dcfOffice}
                            onChange={(e) => setDcfOffice(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                          >
                            <option value="">Select DCF office...</option>
                            {DCF_AREA_OFFICES.map((office) => (
                              <option key={office.name} value={office.name}>{office.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Additional Agencies */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Agencies Involved
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {ADDITIONAL_AGENCIES.map((agency) => (
                            <div key={agency.abbrev} className="relative group">
                              <label
                                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={additionalAgencies.includes(agency.abbrev)}
                                  onChange={() => handleAgencyToggle(agency.abbrev)}
                                  className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                                />
                                <span>{agency.abbrev}</span>
                              </label>
                              {agency.abbrev !== agency.full && (
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded z-50 hidden group-hover:block max-w-xs text-center">
                                  {agency.full}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Other Agencies */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Other Agencies (specify)
                        </label>
                        <textarea
                          value={otherAgencies}
                          onChange={(e) => setOtherAgencies(e.target.value)}
                          placeholder="List any other agencies involved that are not listed above..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={handleCancelCaseInfo}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCaseInfo}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-brand-blue text-white font-medium rounded hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400"
                        >
                          {actionLoading ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="block text-sm font-medium text-gray-500">DCF Involvement</span>
                          <span className="text-gray-800">{dcfInvolvement || "Not set"}</span>
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-gray-500">Case Designation</span>
                          <span className="text-gray-800">{caseDesignation || "Not set"}</span>
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-gray-500">Permanency Goal</span>
                          <span className="text-gray-800">{permanencyGoal || "Not set"}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-sm font-medium text-gray-500">Court</span>
                          <span className="text-gray-800">{court || "Not set"}</span>
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-gray-500">DCF Area Office</span>
                          <span className="text-gray-800">{dcfOffice || "Not set"}</span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-sm font-medium text-gray-500 mb-1">Additional Agencies</span>
                        {additionalAgencies.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {additionalAgencies.map((agencyAbbrev) => {
                              const agencyData = ADDITIONAL_AGENCIES.find(a => a.abbrev === agencyAbbrev);
                              const showTooltip = agencyData && agencyData.abbrev !== agencyData.full;
                              return (
                                <div key={agencyAbbrev} className="relative group">
                                  <span
                                    className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded cursor-default inline-block"
                                  >
                                    {agencyAbbrev}
                                  </span>
                                  {showTooltip && (
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded z-50 hidden group-hover:block max-w-xs text-center">
                                      {agencyData.full}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-800">None selected</span>
                        )}
                      </div>

                      {otherAgencies && (
                        <div>
                          <span className="block text-sm font-medium text-gray-500 mb-1">Other Agencies</span>
                          <p className="text-gray-800 whitespace-pre-wrap">{otherAgencies}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Case Issues Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("issues")}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-brand-blue" />
                  <h3 className="font-semibold text-brand-blue-dark">Relevant Case Issues</h3>
                </div>
                <div className="flex items-center gap-2">
                  {!editingIssues && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingIssues(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-brand-red text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {expandedSections.issues ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>

              {expandedSections.issues && (
                <div className="p-4 border-t border-gray-200 space-y-4">
                  {editingIssues ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Issues (select all that apply)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {CASE_ISSUES.map((issue) => (
                            <label
                              key={issue}
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={caseIssues.includes(issue)}
                                onChange={() => handleIssueToggle(issue)}
                                className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                              />
                              {issue}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          onClick={handleCancelCaseIssues}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCaseIssues}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-brand-blue text-white font-medium rounded hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400"
                        >
                          {actionLoading ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <span className="block text-sm font-medium text-gray-500 mb-2">Issues</span>
                      {caseIssues.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {caseIssues.map((issue) => (
                            <span
                              key={issue}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">No issues selected</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Case Contacts Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("contacts")}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-6 w-6 text-brand-blue" />
                  <div className="text-left">
                    <h3 className="font-semibold text-brand-blue-dark">Case Contacts</h3>
                    <p className="text-sm text-gray-600">
                      {(caseData?.contacts || []).length} contact
                      {(caseData?.contacts || []).length !== 1 ? "s" : ""} added
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddContact();
                    }}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand-blue text-white text-sm font-medium rounded hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add
                  </button>
                  {expandedSections.contacts ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>

              {expandedSections.contacts && (
                <div className="p-4 border-t border-gray-200 space-y-6">
                  {/* Required Court Contacts */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Court Team</h4>
                    <div className="space-y-2">
                      {REQUIRED_CONTACT_ROLES.map((role) => {
                        const contact = getRequiredContact(role);
                        return (
                          <div
                            key={role}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">{role}</span>
                                {contact?.name && (
                                  <span className="text-sm text-gray-500">—</span>
                                )}
                                {contact?.name && (
                                  <span className="text-sm text-gray-800 truncate">{contact.name}</span>
                                )}
                              </div>
                              {contact?.company && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{contact.company}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleEditRequiredContact(role)}
                              disabled={actionLoading}
                              className="p-1.5 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded flex-shrink-0"
                              title={contact?.name ? "Edit" : "Add"}
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Contacts */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Additional Contacts</h4>
                      <button
                        onClick={handleAddContact}
                        disabled={actionLoading}
                        className="flex items-center gap-1 px-2 py-1 text-brand-blue text-sm font-medium hover:bg-blue-50 rounded transition-colors disabled:text-gray-400"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                    {getAdditionalContacts().length > 0 ? (
                      <div className="space-y-2">
                        {getAdditionalContacts().map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-100"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  {contact.role}
                                </span>
                                <span className="text-sm text-gray-800 truncate">{contact.name}</span>
                              </div>
                              {contact.company && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{contact.company}</p>
                              )}
                              {contact.domain && (
                                <p className="text-xs text-gray-600 mt-0.5 truncate italic">
                                  {contact.domain}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleEditContact(contact)}
                                disabled={actionLoading}
                                className="p-1.5 text-gray-500 hover:text-brand-blue hover:bg-blue-100 rounded"
                                title="Edit"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                disabled={actionLoading}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remove"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No additional contacts added yet. Click "Add" to add contacts like therapists, teachers, or mentors.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Family Members Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("familyMembers")}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="h-6 w-6 text-brand-blue" />
                  <div className="text-left">
                    <h3 className="font-semibold text-brand-blue-dark">Family Members</h3>
                    <p className="text-sm text-gray-600">
                      {caseData?.familyMembers?.length || 0} member
                      {caseData?.familyMembers?.length !== 1 ? "s" : ""} added
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddMember();
                    }}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand-blue text-white text-sm font-medium rounded hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add
                  </button>
                  {expandedSections.familyMembers ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>

              {expandedSections.familyMembers && (
                <div className="p-4 border-t border-gray-200">
                  {caseData?.familyMembers?.length > 0 ? (
                    <div className="space-y-2">
                      {caseData.familyMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <span className="text-gray-800 text-sm">
                            {formatMemberLabel(member)}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditMember(member)}
                              disabled={actionLoading}
                              className="p-1.5 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.id)}
                              disabled={actionLoading}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Remove"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <UserGroupIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>No family members added yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Visitation Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("visitation")}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <CalendarDaysIcon className="h-6 w-6 text-brand-blue" />
                  <div className="text-left">
                    <h3 className="font-semibold text-brand-blue-dark">Visitation</h3>
                    <p className="text-sm text-gray-600">
                      {(caseData?.visitations || []).length} arrangement
                      {(caseData?.visitations || []).length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddVisitation();
                    }}
                    disabled={actionLoading || !caseData?.familyMembers?.length}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand-blue text-white text-sm font-medium rounded hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400"
                    title={!caseData?.familyMembers?.length ? "Add family members first" : "Add visitation"}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add
                  </button>
                  {expandedSections.visitation ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>

              {expandedSections.visitation && (
                <div className="p-4 border-t border-gray-200 space-y-6">
                  {!caseData?.familyMembers?.length ? (
                    <div className="text-center py-6 text-gray-500">
                      <CalendarDaysIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>Add family members first to track visitation.</p>
                    </div>
                  ) : (caseData?.visitations || []).length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <CalendarDaysIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>No visitation arrangements added yet.</p>
                      <p className="text-sm mt-1">Click "Add" to create a visitation record.</p>
                    </div>
                  ) : (
                    <>
                      {/* Sibling Visitation */}
                      {getVisitationsByType("sibling").length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            Sibling Visitation
                          </h4>
                          <div className="space-y-3">
                            {getVisitationsByType("sibling").map((vis) => (
                              <VisitationCard
                                key={vis.id}
                                visitation={vis}
                                expanded={expandedVisitations[vis.id]}
                                onToggleExpand={() => toggleVisitationExpanded(vis.id)}
                                onEdit={() => handleEditVisitation(vis)}
                                onDelete={() => handleDeleteVisitation(vis.id)}
                                onAddLog={() => handleAddLogEntry(vis.id)}
                                onDeleteLog={(logId) => handleDeleteLogEntry(vis.id, logId)}
                                getFamilyMemberNames={getFamilyMemberNames}
                                getAuthorityDisplay={getAuthorityDisplay}
                                formatDateOnly={formatDateOnly}
                                actionLoading={actionLoading}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Parental Visitation */}
                      {getVisitationsByType("parental").length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                            Parental Visitation
                          </h4>
                          <div className="space-y-3">
                            {getVisitationsByType("parental").map((vis) => (
                              <VisitationCard
                                key={vis.id}
                                visitation={vis}
                                expanded={expandedVisitations[vis.id]}
                                onToggleExpand={() => toggleVisitationExpanded(vis.id)}
                                onEdit={() => handleEditVisitation(vis)}
                                onDelete={() => handleDeleteVisitation(vis.id)}
                                onAddLog={() => handleAddLogEntry(vis.id)}
                                onDeleteLog={(logId) => handleDeleteLogEntry(vis.id, logId)}
                                getFamilyMemberNames={getFamilyMemberNames}
                                getAuthorityDisplay={getAuthorityDisplay}
                                formatDateOnly={formatDateOnly}
                                actionLoading={actionLoading}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Kinship Visitation */}
                      {getVisitationsByType("kinship").length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                            Kinship Visitation
                          </h4>
                          <div className="space-y-3">
                            {getVisitationsByType("kinship").map((vis) => (
                              <VisitationCard
                                key={vis.id}
                                visitation={vis}
                                expanded={expandedVisitations[vis.id]}
                                onToggleExpand={() => toggleVisitationExpanded(vis.id)}
                                onEdit={() => handleEditVisitation(vis)}
                                onDelete={() => handleDeleteVisitation(vis.id)}
                                onAddLog={() => handleAddLogEntry(vis.id)}
                                onDeleteLog={(logId) => handleDeleteLogEntry(vis.id, logId)}
                                getFamilyMemberNames={getFamilyMemberNames}
                                getAuthorityDisplay={getAuthorityDisplay}
                                formatDateOnly={formatDateOnly}
                                actionLoading={actionLoading}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Other Visitation */}
                      {getVisitationsByType("other").length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                            Other Visitation
                          </h4>
                          <div className="space-y-3">
                            {getVisitationsByType("other").map((vis) => (
                              <VisitationCard
                                key={vis.id}
                                visitation={vis}
                                expanded={expandedVisitations[vis.id]}
                                onToggleExpand={() => toggleVisitationExpanded(vis.id)}
                                onEdit={() => handleEditVisitation(vis)}
                                onDelete={() => handleDeleteVisitation(vis.id)}
                                onAddLog={() => handleAddLogEntry(vis.id)}
                                onDeleteLog={(logId) => handleDeleteLogEntry(vis.id, logId)}
                                getFamilyMemberNames={getFamilyMemberNames}
                                getAuthorityDisplay={getAuthorityDisplay}
                                formatDateOnly={formatDateOnly}
                                actionLoading={actionLoading}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Case Notes Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection("notes")}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-6 w-6 text-brand-blue" />
                  <div className="text-left">
                    <h3 className="font-semibold text-brand-blue-dark">Case Notes</h3>
                    <p className="text-sm text-gray-600">
                      {caseData?.notes?.length || 0} note
                      {caseData?.notes?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNoteForm(true);
                    }}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand-blue text-white text-sm font-medium rounded hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Note
                  </button>
                  {expandedSections.notes ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
              </button>

              {expandedSections.notes && (
                <div className="p-4 border-t border-gray-200">
                  {caseData?.notes?.length > 0 ? (
                    <div className="space-y-3">
                      {caseData.notes.map((note) => (
                        <div
                          key={note.id}
                          className={`p-3 rounded border ${
                            NOTE_TYPE_COLORS[note.noteType] || "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white bg-opacity-50">
                                {note.noteType || "Note"}
                              </span>
                              <span className="text-xs opacity-75">
                                {formatDate(note.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleNoteExpanded(note.id)}
                                className="p-1 hover:bg-white hover:bg-opacity-50 rounded text-xs font-medium"
                              >
                                {expandedNotes[note.id] ? "Less" : "More"}
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                disabled={actionLoading}
                                className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
                                title="Delete note"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {expandedNotes[note.id] ? (
                            <div className="mt-2">{renderNoteDetails(note)}</div>
                          ) : (
                            <p className="mt-2 text-sm truncate">
                              {getNoteSummary(note)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <DocumentTextIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>No notes added yet.</p>
                      <p className="text-sm mt-1">Click "Add Note" to create your first case note.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showMemberForm && (
          <FamilyMemberForm
            member={editingMember}
            onSave={handleSaveMember}
            onCancel={() => {
              setShowMemberForm(false);
              setEditingMember(null);
            }}
          />
        )}

        {showNoteForm && (
          <CaseNoteForm
            onSave={handleSaveNote}
            onCancel={() => setShowNoteForm(false)}
          />
        )}

        {showContactForm && (
          <CaseContactForm
            contact={editingContact}
            isRequired={editingContactIsRequired}
            onSave={handleSaveContact}
            onCancel={() => {
              setShowContactForm(false);
              setEditingContact(null);
            }}
          />
        )}

        {showVisitationForm && (
          <VisitationForm
            visitation={editingVisitation}
            familyMembers={caseData?.familyMembers || []}
            contacts={caseData?.contacts || []}
            onSave={handleSaveVisitation}
            onCancel={() => {
              setShowVisitationForm(false);
              setEditingVisitation(null);
            }}
          />
        )}

        {showVisitationLogForm && (
          <VisitationLogForm
            visitationId={selectedVisitationForLog}
            onSave={handleSaveLogEntry}
            onCancel={() => {
              setShowVisitationLogForm(false);
              setSelectedVisitationForLog(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
