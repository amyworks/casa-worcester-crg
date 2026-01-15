import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

const FAMILY_ROLES = [
  "parent",
  "child",
  "grandparent",
  "aunt",
  "uncle",
  "adult sibling",
  "stepparent",
  "stepsibling",
  "half sibling",
  "adoptive sibling",
  "godparent",
];

const GENDERS = ["boy", "girl", "man", "woman", "nonbinary", "genderfluid"];

// Roles that are considered "children" for form purposes
const CHILD_ROLES = ["child", "stepsibling", "half sibling", "adoptive sibling"];

// Child placement types
const PLACEMENT_TYPES = [
  "With parent(s)",
  "Foster home",
  "Kinship placement",
  "Adoptive / guardianship home",
  "Residential care",
  "Shelter care",
  "In-patient psychiatric facility",
];

// Contact role options for placement
const PLACEMENT_CONTACT_ROLES = [
  "Foster parent",
  "Kinship caregiver",
  "Adoptive parent",
  "Residential worker",
  "Facility staff",
  "Other",
];

// IEP/504 status options
const IEP_504_OPTIONS = [
  "None",
  "IEP",
  "504 Plan",
  "Both IEP and 504",
  "In evaluation",
  "Unknown",
];

// Adult housing status options
const HOUSING_STATUS_OPTIONS = [
  "Housed",
  "Homeless",
  "Shelter",
  "Transitional housing",
  "Incarcerated",
  "Unknown",
];

// Adult employment status options
const EMPLOYMENT_STATUS_OPTIONS = [
  "Employed full-time",
  "Employed part-time",
  "Unemployed",
  "Disabled",
  "Retired",
  "Student",
  "Unknown",
];

// Adult education level options
const EDUCATION_LEVEL_OPTIONS = [
  "Less than high school",
  "High school / GED",
  "Some college",
  "Associate degree",
  "Bachelor's degree",
  "Graduate degree",
  "Unknown",
];

// Adult agency involvement options (multiselect)
const AGENCY_INVOLVEMENT_OPTIONS = [
  "DCF",
  "DYS",
  "DMH",
  "DDS",
  "Probation",
  "Parole",
  "Immigration",
  "None",
  "Unknown",
];

// Individual issues (for both adults and children, but more applicable to adults)
const INDIVIDUAL_ISSUES = [
  "Substance use",
  "Mental health",
  "Domestic violence",
  "Trauma history",
  "Criminal history",
  "Medical issues",
  "Intellectual disability",
  "Learning disability",
  "Physical disability",
];

// Treatment and services options (for both adults and children)
const TREATMENT_SERVICES_OPTIONS = [
  "Individual therapy",
  "Family therapy",
  "Group therapy",
  "Substance use treatment",
  "Psychiatric services",
  "Medication management",
  "Occupational therapy",
  "Speech therapy",
  "Physical therapy",
  "ABA therapy",
  "Counseling",
  "Case management",
  "In-home support",
  "Mentoring program",
  "Parenting classes",
  "Anger management",
  "Domestic violence services",
  "Educational support",
  "Vocational services",
];

export default function FamilyMemberForm({ member, onSave, onCancel }) {
  // Basic info (both)
  const [firstName, setFirstName] = useState(member?.firstName || "");
  const [familyRole, setFamilyRole] = useState(member?.familyRole || "");
  const [gender, setGender] = useState(member?.gender || "");
  const [age, setAge] = useState(member?.age || "");
  const [notes, setNotes] = useState(member?.notes || "");

  // Treatment and services (both adults and children)
  const [treatmentServices, setTreatmentServices] = useState(member?.treatmentServices || []);
  const [treatmentServicesOther, setTreatmentServicesOther] = useState(member?.treatmentServicesOther || "");

  // Strengths (both adults and children)
  const [strengths, setStrengths] = useState(member?.strengths || "");

  // Adult-specific fields
  const [housingStatus, setHousingStatus] = useState(member?.housingStatus || "");
  const [agencyInvolvement, setAgencyInvolvement] = useState(member?.agencyInvolvement || []);
  const [employmentStatus, setEmploymentStatus] = useState(member?.employmentStatus || "");
  const [educationLevel, setEducationLevel] = useState(member?.educationLevel || "");
  const [individualIssues, setIndividualIssues] = useState(member?.individualIssues || []);
  const [individualIssuesOther, setIndividualIssuesOther] = useState(member?.individualIssuesOther || "");

  // Child-specific fields - Placement
  const [placementType, setPlacementType] = useState(member?.placementType || "");
  const [placementAddress, setPlacementAddress] = useState(member?.placementAddress || "");
  const [placementContactName, setPlacementContactName] = useState(member?.placementContactName || "");
  const [placementContactRole, setPlacementContactRole] = useState(member?.placementContactRole || "");
  const [placementContactPhone, setPlacementContactPhone] = useState(member?.placementContactPhone || "");
  const [placementContactEmail, setPlacementContactEmail] = useState(member?.placementContactEmail || "");

  // Child-specific fields - School
  const [schoolGrade, setSchoolGrade] = useState(member?.schoolGrade || "");
  const [schoolDistrict, setSchoolDistrict] = useState(member?.schoolDistrict || "");
  const [schoolName, setSchoolName] = useState(member?.schoolName || "");
  const [iep504Status, setIep504Status] = useState(member?.iep504Status || "");
  const [teacherName, setTeacherName] = useState(member?.teacherName || "");
  const [transportation, setTransportation] = useState(member?.transportation || "");

  // Child-specific fields - Activities
  const [extracurriculars, setExtracurriculars] = useState(member?.extracurriculars || "");
  const [hobbiesInterests, setHobbiesInterests] = useState(member?.hobbiesInterests || "");

  const [error, setError] = useState("");

  const isChildRole = CHILD_ROLES.includes(familyRole);

  useEffect(() => {
    if (member) {
      // Basic info
      setFirstName(member.firstName || "");
      setFamilyRole(member.familyRole || "");
      setGender(member.gender || "");
      setAge(member.age || "");
      setNotes(member.notes || "");

      // Treatment and services
      setTreatmentServices(member.treatmentServices || []);
      setTreatmentServicesOther(member.treatmentServicesOther || "");

      // Strengths
      setStrengths(member.strengths || "");

      // Adult fields
      setHousingStatus(member.housingStatus || "");
      setAgencyInvolvement(member.agencyInvolvement || []);
      setEmploymentStatus(member.employmentStatus || "");
      setEducationLevel(member.educationLevel || "");
      setIndividualIssues(member.individualIssues || []);
      setIndividualIssuesOther(member.individualIssuesOther || "");

      // Child placement fields
      setPlacementType(member.placementType || "");
      setPlacementAddress(member.placementAddress || "");
      setPlacementContactName(member.placementContactName || "");
      setPlacementContactRole(member.placementContactRole || "");
      setPlacementContactPhone(member.placementContactPhone || "");
      setPlacementContactEmail(member.placementContactEmail || "");

      // Child school fields
      setSchoolGrade(member.schoolGrade || "");
      setSchoolDistrict(member.schoolDistrict || "");
      setSchoolName(member.schoolName || "");
      setIep504Status(member.iep504Status || "");
      setTeacherName(member.teacherName || "");
      setTransportation(member.transportation || "");

      // Child activities
      setExtracurriculars(member.extracurriculars || "");
      setHobbiesInterests(member.hobbiesInterests || "");
    }
  }, [member]);

  const handleMultiSelectToggle = (value, currentValues, setValues) => {
    setValues((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) {
      setError("Please enter a first name");
      return;
    }
    if (!familyRole) {
      setError("Please select a family role");
      return;
    }
    if (!gender) {
      setError("Please select a gender");
      return;
    }
    if (age === "" || age < 0 || age > 120) {
      setError("Please enter a valid age (0-120)");
      return;
    }

    const memberData = {
      id: member?.id || crypto.randomUUID(),
      firstName: firstName.trim(),
      familyRole,
      gender,
      age: parseInt(age, 10),
      notes: notes.trim(),
      strengths: strengths.trim(),
      treatmentServices,
      treatmentServicesOther: treatmentServicesOther.trim(),
      addedAt: member?.addedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isChildRole) {
      // Child-specific data
      memberData.placementType = placementType;
      memberData.placementAddress = placementAddress.trim();
      memberData.placementContactName = placementContactName.trim();
      memberData.placementContactRole = placementContactRole;
      memberData.placementContactPhone = placementContactPhone.trim();
      memberData.placementContactEmail = placementContactEmail.trim();
      memberData.schoolGrade = schoolGrade.trim();
      memberData.schoolDistrict = schoolDistrict.trim();
      memberData.schoolName = schoolName.trim();
      memberData.iep504Status = iep504Status;
      memberData.teacherName = teacherName.trim();
      memberData.transportation = transportation.trim();
      memberData.extracurriculars = extracurriculars.trim();
      memberData.hobbiesInterests = hobbiesInterests.trim();
    } else {
      // Adult-specific data
      memberData.housingStatus = housingStatus;
      memberData.agencyInvolvement = agencyInvolvement;
      memberData.employmentStatus = employmentStatus;
      memberData.educationLevel = educationLevel;
      memberData.individualIssues = individualIssues;
      memberData.individualIssuesOther = individualIssuesOther.trim();
    }

    onSave(memberData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-brand-blue-dark">
            {member ? "Edit Family Member" : "Add Family Member"}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
              Basic Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Enter first name"
                />
              </div>

              {/* Family Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={familyRole}
                  onChange={(e) => setFamilyRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">Select role...</option>
                  {FAMILY_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">Select gender...</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  placeholder="Enter age"
                />
              </div>
            </div>
          </div>

          {/* Adult-Specific Fields */}
          {familyRole && !isChildRole && (
            <>
              {/* Adult Status Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                  Status Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Housing Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Housing Status
                    </label>
                    <select
                      value={housingStatus}
                      onChange={(e) => setHousingStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="">Select status...</option>
                      {HOUSING_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employment Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Status
                    </label>
                    <select
                      value={employmentStatus}
                      onChange={(e) => setEmploymentStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="">Select status...</option>
                      {EMPLOYMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Education Level */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Education Level
                    </label>
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="">Select level...</option>
                      {EDUCATION_LEVEL_OPTIONS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Agency Involvement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Involvement (select all that apply)
                  </label>
                  <div className="grid grid-cols-3 gap-2 border border-gray-200 rounded p-2">
                    {AGENCY_INVOLVEMENT_OPTIONS.map((agency) => (
                      <label
                        key={agency}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={agencyInvolvement.includes(agency)}
                          onChange={() => handleMultiSelectToggle(agency, agencyInvolvement, setAgencyInvolvement)}
                          className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                        />
                        {agency}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Individual Issues */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Individual Issues (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-gray-200 rounded p-2">
                    {INDIVIDUAL_ISSUES.map((issue) => (
                      <label
                        key={issue}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={individualIssues.includes(issue)}
                          onChange={() => handleMultiSelectToggle(issue, individualIssues, setIndividualIssues)}
                          className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                        />
                        {issue}
                      </label>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Issues / Details
                    </label>
                    <textarea
                      value={individualIssuesOther}
                      onChange={(e) => setIndividualIssuesOther(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                      rows={2}
                      placeholder="List any other issues or provide additional details..."
                    />
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strengths
                  </label>
                  <textarea
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                    rows={3}
                    placeholder="Describe this person's strengths, skills, positive qualities, supportive relationships, protective factors..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Child-Specific Fields */}
          {isChildRole && (
            <>
              {/* Placement Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                  Placement Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Placement Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type of Placement
                    </label>
                    <select
                      value={placementType}
                      onChange={(e) => setPlacementType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="">Select placement type...</option>
                      {PLACEMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Placement Contact Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Main Contact Role
                    </label>
                    <select
                      value={placementContactRole}
                      onChange={(e) => setPlacementContactRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="">Select role...</option>
                      {PLACEMENT_CONTACT_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Placement Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Main Contact Name
                    </label>
                    <input
                      type="text"
                      value={placementContactName}
                      onChange={(e) => setPlacementContactName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="e.g., Jane Smith"
                    />
                  </div>

                  {/* Placement Contact Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={placementContactPhone}
                      onChange={(e) => setPlacementContactPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Placement Contact Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={placementContactEmail}
                      onChange={(e) => setPlacementContactEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Placement Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placement Address
                    </label>
                    <input
                      type="text"
                      value={placementAddress}
                      onChange={(e) => setPlacementAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Enter address"
                    />
                  </div>
                </div>
              </div>

              {/* School Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                  School Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* School Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School Name
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Enter school name"
                    />
                  </div>

                  {/* School District */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School District
                    </label>
                    <input
                      type="text"
                      value={schoolDistrict}
                      onChange={(e) => setSchoolDistrict(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Enter district"
                    />
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <input
                      type="text"
                      value={schoolGrade}
                      onChange={(e) => setSchoolGrade(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="e.g., 5th, K, Pre-K"
                    />
                  </div>

                  {/* IEP/504 Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IEP / 504 Status
                    </label>
                    <select
                      value={iep504Status}
                      onChange={(e) => setIep504Status(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="">Select status...</option>
                      {IEP_504_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Teacher */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teacher
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="Teacher name"
                    />
                  </div>

                  {/* Transportation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transportation
                    </label>
                    <input
                      type="text"
                      value={transportation}
                      onChange={(e) => setTransportation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue"
                      placeholder="e.g., School bus, Parent, Van service"
                    />
                  </div>
                </div>
              </div>

              {/* Activities & Interests Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                  Activities & Interests
                </h4>

                {/* Extracurriculars */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extracurricular Activities
                  </label>
                  <textarea
                    value={extracurriculars}
                    onChange={(e) => setExtracurriculars(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                    rows={2}
                    placeholder="e.g., Soccer, dance, art club, scouting..."
                  />
                </div>

                {/* Hobbies & Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hobbies & Interests
                  </label>
                  <textarea
                    value={hobbiesInterests}
                    onChange={(e) => setHobbiesInterests(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                    rows={2}
                    placeholder="e.g., Drawing, video games, reading, animals..."
                  />
                </div>

                {/* Strengths */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Strengths
                  </label>
                  <textarea
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                    rows={3}
                    placeholder="Describe this child's strengths, skills, positive qualities, supportive relationships, protective factors..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Treatment & Services Section (for both) */}
          {familyRole && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
                Treatment & Services
              </h4>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Services (select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-gray-200 rounded p-2 max-h-48 overflow-y-auto">
                  {TREATMENT_SERVICES_OPTIONS.map((service) => (
                    <label
                      key={service}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={treatmentServices.includes(service)}
                        onChange={() => handleMultiSelectToggle(service, treatmentServices, setTreatmentServices)}
                        className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Services / Details
                </label>
                <textarea
                  value={treatmentServicesOther}
                  onChange={(e) => setTreatmentServicesOther(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                  rows={2}
                  placeholder="List any other services or provide details about current treatment..."
                />
              </div>
            </div>
          )}

          {/* Notes Section (for both) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-1">
              Additional Details
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                rows={3}
                placeholder="Any additional details or notes about this family member..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-gray-200">
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
              {member ? "Save Changes" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
