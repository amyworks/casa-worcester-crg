import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useToast } from "../../contexts/ToastContext";

// Log entry types for tracking visitation changes
const LOG_ENTRY_TYPES = [
  { value: "ordered", label: "Ordered", color: "bg-blue-100 text-blue-800" },
  { value: "recommended", label: "Recommended", color: "bg-blue-50 text-blue-700" },
  { value: "started", label: "Started", color: "bg-green-100 text-green-800" },
  { value: "modified", label: "Modified", color: "bg-yellow-100 text-yellow-800" },
  { value: "suspended", label: "Suspended", color: "bg-red-100 text-red-800" },
  { value: "paused", label: "Paused", color: "bg-orange-100 text-orange-800" },
  { value: "resumed", label: "Resumed", color: "bg-green-50 text-green-700" },
  { value: "revoked", label: "Revoked", color: "bg-red-200 text-red-900" },
  { value: "lapsed", label: "Lapsed", color: "bg-gray-100 text-gray-800" },
  { value: "completed", label: "Completed", color: "bg-gray-200 text-gray-800" },
  { value: "behavioral_note", label: "Behavioral Note", color: "bg-purple-100 text-purple-800" },
  { value: "incident", label: "Incident", color: "bg-red-50 text-red-700" },
  { value: "positive_update", label: "Positive Update", color: "bg-emerald-100 text-emerald-800" },
];

export default function VisitationLogForm({ visitationId, onSave, onCancel }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    entryType: "modified",
    date: new Date().toISOString().split("T")[0],
    details: "",
    behavioralObservations: "",
    actionTaken: "",
    orderedBy: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.details.trim()) {
      toast.warning("Please provide details for this log entry");
      return;
    }

    const logEntry = {
      id: `log-${Date.now()}`,
      visitationId,
      ...formData,
      createdAt: new Date().toISOString(),
    };

    onSave(logEntry);
  };

  const selectedType = LOG_ENTRY_TYPES.find((t) => t.value === formData.entryType);

  // Show behavioral observations field for certain entry types
  const showBehavioralField = [
    "suspended",
    "paused",
    "revoked",
    "lapsed",
    "behavioral_note",
    "incident",
    "modified",
  ].includes(formData.entryType);

  // Show action taken field for status changes
  const showActionField = [
    "suspended",
    "paused",
    "revoked",
    "modified",
    "incident",
  ].includes(formData.entryType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-brand-blue-dark">
            Add Visitation Log Entry
          </h2>
          <button
            onClick={onCancel}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Entry Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entry Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {LOG_ENTRY_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer rounded border transition-colors ${
                    formData.entryType === type.value
                      ? type.color + " border-current font-medium"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="entryType"
                    value={type.value}
                    checked={formData.entryType === type.value}
                    onChange={(e) => handleChange("entryType", e.target.value)}
                    className="sr-only"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              required
            />
          </div>

          {/* Ordered By (for certain types) */}
          {["ordered", "recommended", "modified", "revoked"].includes(
            formData.entryType
          ) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.entryType === "recommended"
                  ? "Recommended By"
                  : formData.entryType === "ordered"
                  ? "Ordered By"
                  : "Decision Made By"}
              </label>
              <input
                type="text"
                value={formData.orderedBy}
                onChange={(e) => handleChange("orderedBy", e.target.value)}
                placeholder="e.g., Judge Smith, DCF Worker Jones"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>
          )}

          {/* Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => handleChange("details", e.target.value)}
              placeholder={`Describe what happened or changed...${
                formData.entryType === "behavioral_note"
                  ? "\n\nFor behavioral notes, describe the behavior observed during or around visitation time."
                  : ""
              }`}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              required
            />
          </div>

          {/* Behavioral Observations */}
          {showBehavioralField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Behavioral Observations
              </label>
              <textarea
                value={formData.behavioralObservations}
                onChange={(e) =>
                  handleChange("behavioralObservations", e.target.value)
                }
                placeholder="Note any behavioral changes observed in children related to this visitation change (e.g., anxiety, acting out, regression, positive engagement)..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps track correlations between visitation changes and
                child behavior.
              </p>
            </div>
          )}

          {/* Action Taken */}
          {showActionField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Taken / Next Steps
              </label>
              <textarea
                value={formData.actionTaken}
                onChange={(e) => handleChange("actionTaken", e.target.value)}
                placeholder="What actions were taken or what are the next steps?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
              />
            </div>
          )}

          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Preview:</p>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded ${selectedType?.color}`}
              >
                {selectedType?.label}
              </span>
              <span className="text-sm text-gray-600">{formData.date}</span>
            </div>
            {formData.details && (
              <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                {formData.details}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-blue text-white font-medium rounded hover:bg-brand-blue-dark transition-colors"
            >
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
