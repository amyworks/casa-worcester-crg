import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

const NOTE_TYPES = [
  "Case update",
  "Recent visit",
  "Contact",
  "Recommendation",
  "Court report",
  "Supervision",
];

const CONTACT_METHODS = ["Phone", "Email", "Video call", "In-person"];

const HEARING_TYPES = [
  "Emergency hearing",
  "72-hour hearing",
  "Temporary custody hearing",
  "Pretrial conference",
  "Trial",
  "Permanency hearing",
  "Review hearing",
  "Termination of parental rights",
  "Adoption hearing",
  "Other",
];

const SUPERVISION_TYPES = [
  "Monthly check-in",
  "Case review",
  "Training",
  "Court preparation",
  "Other",
];

export default function CaseNoteForm({ onSave, onCancel }) {
  const [noteType, setNoteType] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  // Case Update fields
  const [changesDescription, setChangesDescription] = useState("");

  // Recent Visit fields
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [visitLocation, setVisitLocation] = useState("");

  // Contact fields
  const [contactMethod, setContactMethod] = useState("");
  const [contactPartyLocations, setContactPartyLocations] = useState("");
  const [inPersonLocation, setInPersonLocation] = useState("");

  // Recommendation fields
  const [recommendedAction, setRecommendedAction] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [supervisorMeetingDate, setSupervisorMeetingDate] = useState("");

  // Court Report fields
  const [reportOverview, setReportOverview] = useState("");
  const [hearingDate, setHearingDate] = useState("");
  const [hearingTime, setHearingTime] = useState("");
  const [hearingType, setHearingType] = useState("");
  const [attendees, setAttendees] = useState("");

  // Supervision fields
  const [supervisionDate, setSupervisionDate] = useState("");
  const [supervisionTime, setSupervisionTime] = useState("");
  const [supervisionLocation, setSupervisionLocation] = useState("");
  const [supervisionType, setSupervisionType] = useState("");
  const [supervisionNotes, setSupervisionNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!noteType) {
      setError("Please select a note type");
      return;
    }

    // Validate required fields based on note type
    if (noteType === "Case update" && !changesDescription.trim()) {
      setError("Please describe what information changed and why");
      return;
    }

    if (noteType === "Recent visit") {
      if (!visitDate || !visitLocation.trim()) {
        setError("Please provide the visit date and location");
        return;
      }
    }

    if (noteType === "Contact") {
      if (!contactMethod) {
        setError("Please select a contact method");
        return;
      }
      if ((contactMethod === "Phone" || contactMethod === "Video call") && !contactPartyLocations.trim()) {
        setError("Please describe the location of each party");
        return;
      }
      if (contactMethod === "In-person" && !inPersonLocation.trim()) {
        setError("Please provide the meeting location");
        return;
      }
    }

    if (noteType === "Recommendation") {
      if (!recommendedAction.trim() || !reasoning.trim()) {
        setError("Please provide both the recommended action and your reasoning");
        return;
      }
    }

    if (noteType === "Court report") {
      if (!reportOverview.trim() || !hearingDate || !hearingType) {
        setError("Please provide the report overview, hearing date, and hearing type");
        return;
      }
    }

    if (noteType === "Supervision") {
      if (!supervisionDate || !supervisionType) {
        setError("Please provide the supervision date and type");
        return;
      }
    }

    // Build the note object
    const noteData = {
      id: crypto.randomUUID(),
      noteType,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    // Add type-specific fields
    switch (noteType) {
      case "Case update":
        noteData.changesDescription = changesDescription.trim();
        break;

      case "Recent visit":
        noteData.visitDate = visitDate;
        noteData.visitTime = visitTime;
        noteData.visitLocation = visitLocation.trim();
        break;

      case "Contact":
        noteData.contactMethod = contactMethod;
        if (contactMethod === "Phone" || contactMethod === "Video call") {
          noteData.contactPartyLocations = contactPartyLocations.trim();
        } else if (contactMethod === "In-person") {
          noteData.inPersonLocation = inPersonLocation.trim();
        }
        break;

      case "Recommendation":
        noteData.recommendedAction = recommendedAction.trim();
        noteData.reasoning = reasoning.trim();
        noteData.supervisorMeetingDate = supervisorMeetingDate;
        break;

      case "Court report":
        noteData.reportOverview = reportOverview.trim();
        noteData.hearingDate = hearingDate;
        noteData.hearingTime = hearingTime;
        noteData.hearingType = hearingType;
        noteData.attendees = attendees.trim();
        break;

      case "Supervision":
        noteData.supervisionDate = supervisionDate;
        noteData.supervisionTime = supervisionTime;
        noteData.supervisionLocation = supervisionLocation.trim();
        noteData.supervisionType = supervisionType;
        noteData.supervisionNotes = supervisionNotes.trim();
        break;
    }

    onSave(noteData);
  };

  const renderTypeSpecificFields = () => {
    switch (noteType) {
      case "Case update":
        return (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What information changed and why? *
              </label>
              <textarea
                value={changesDescription}
                onChange={(e) => setChangesDescription(e.target.value)}
                placeholder="Describe the changes made to case information (e.g., permanency goal changed from Reunification to Adoption because...)"
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              />
            </div>
          </div>
        );

      case "Recent visit":
        return (
          <div className="space-y-4 p-4 bg-green-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Date *
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Time
                </label>
                <input
                  type="time"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visit Location *
              </label>
              <input
                type="text"
                value={visitLocation}
                onChange={(e) => setVisitLocation(e.target.value)}
                placeholder="Where did the visit take place?"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
        );

      case "Contact":
        return (
          <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Method *
              </label>
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select method...</option>
                {CONTACT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {(contactMethod === "Phone" || contactMethod === "Video call") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location of Each Party *
                </label>
                <textarea
                  value={contactPartyLocations}
                  onChange={(e) => setContactPartyLocations(e.target.value)}
                  placeholder="Describe where each party was during the call (e.g., Child at foster home, Parent at DCF office)"
                  className="w-full h-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                />
              </div>
            )}

            {contactMethod === "In-person" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Location *
                </label>
                <input
                  type="text"
                  value={inPersonLocation}
                  onChange={(e) => setInPersonLocation(e.target.value)}
                  placeholder="Where did the in-person meeting take place?"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            )}
          </div>
        );

      case "Recommendation":
        return (
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recommended Action *
              </label>
              <textarea
                value={recommendedAction}
                onChange={(e) => setRecommendedAction(e.target.value)}
                placeholder="What action do you recommend?"
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reasoning *
              </label>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Why are you making this recommendation?"
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                When do you plan to bring this to your supervisor?
              </label>
              <input
                type="date"
                value={supervisorMeetingDate}
                onChange={(e) => setSupervisorMeetingDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          </div>
        );

      case "Court report":
        return (
          <div className="space-y-4 p-4 bg-red-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Overview *
              </label>
              <textarea
                value={reportOverview}
                onChange={(e) => setReportOverview(e.target.value)}
                placeholder="Summarize what you're including in the report for the judge (exclude full names and sensitive identifying information)"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hearing Date *
                </label>
                <input
                  type="date"
                  value={hearingDate}
                  onChange={(e) => setHearingDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hearing Time
                </label>
                <input
                  type="time"
                  value={hearingTime}
                  onChange={(e) => setHearingTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type of Hearing *
              </label>
              <select
                value={hearingType}
                onChange={(e) => setHearingType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select hearing type...</option>
                {HEARING_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Who needs to be at the hearing?
              </label>
              <textarea
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="List who needs to attend (by role, not name)"
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              />
            </div>
          </div>
        );

      case "Supervision":
        return (
          <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Date *
                </label>
                <input
                  type="date"
                  value={supervisionDate}
                  onChange={(e) => setSupervisionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Time
                </label>
                <input
                  type="time"
                  value={supervisionTime}
                  onChange={(e) => setSupervisionTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Location
              </label>
              <input
                type="text"
                value={supervisionLocation}
                onChange={(e) => setSupervisionLocation(e.target.value)}
                placeholder="Where did you meet with your supervisor?"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type of Meeting *
              </label>
              <select
                value={supervisionType}
                onChange={(e) => setSupervisionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value="">Select meeting type...</option>
                {SUPERVISION_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What was discussed?
              </label>
              <textarea
                value={supervisionNotes}
                onChange={(e) => setSupervisionNotes(e.target.value)}
                placeholder="Notes about what you discussed with your supervisor"
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-brand-blue-dark">Add Case Note</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Note Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {NOTE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNoteType(type)}
                  className={`px-3 py-2 text-sm font-medium rounded border transition-colors ${
                    noteType === type
                      ? "bg-brand-blue text-white border-brand-blue"
                      : "bg-white text-gray-700 border-gray-300 hover:border-brand-blue"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific fields */}
          {noteType && renderTypeSpecificFields()}

          {/* General notes field */}
          {noteType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Any additional observations or notes..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              />
              <p className="text-xs text-gray-500 mt-1">
                Remember: Do not include case numbers or sensitive identifying information beyond first names.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!noteType}
              className="px-4 py-2 bg-brand-blue text-white font-medium rounded hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400"
            >
              Add Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
