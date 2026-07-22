import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Step1PersonalInfo, { validateStep1 } from './Step1PersonalInfo';
import Step2EmploymentDetails, { validateStep2 } from './Step2EmploymentDetails';
import Step3Review, { validateStep3 } from './Step3Review';
import CancelConfirmationModal from './CancelConfirmationModal';
import SuccessModal from './SuccessModal';
import { useAuth } from '../../hooks/useAuth';
import * as userService from '../../services/userService';
import * as requestService from '../../services/requestService';

const TOTAL_STEPS = 3;

const STEP_LABELS = {
  1: 'Personal Info',
  2: 'Employment Details',
  3: 'Platforms',
};

const INITIAL_FORM_DATA = {
  // Step 1: Personal Info
  firstName: '',
  lastName: '',
  displayName: '',
  displayNameEdited: false,
  email: '',
  workingLocation: '',
  country: '',
  // Step 2: Employment Details
  startDate: '',
  role: '',
  department: '',
  manager: '',
  team: '',
  jobTitle: '',
  employeeType: '',
  // Step 3: Platforms
  selectedPlatforms: [],
};

/**
 * OnboardingForm Component
 *
 * 3-step wizard for onboarding new employees: Personal Info,
 * Employment Details, then Platforms (auto-populated from the
 * selected Role, editable, submits to the real backend which
 * creates the real Azure AD account).
 *
 * @component
 * @returns {React.ReactElement} OnboardingForm component
 */
function OnboardingForm() {
  const navigate = useNavigate();
  const user = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [existingEmails, setExistingEmails] = useState([]);

  // Full real Azure tenant directory (not just app-managed users -
  // a new hire's email must not collide with ANY real account),
  // fetched once, used only for Step 1's "Email already exists"
  // on-blur check.
  useEffect(() => {
    let cancelled = false;
    userService
      .getAllAzureUsers()
      .then((users) => {
        if (!cancelled) {
          setExistingEmails(
            users.flatMap((u) => [u.email, u.workEmail].filter(Boolean).map((e) => e.toLowerCase()))
          );
        }
      })
      .catch((error) => {
        console.error('[OnboardingForm] failed to load existing users for email check:', error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDataChange = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    // Re-validate here (not just in the step's disabled button) so the
    // transition itself is guarded, not only the button that triggers it.
    if (currentStep === 1 && !validateStep1(formData, existingEmails)) {
      return;
    }
    if (currentStep === 2 && !validateStep2(formData)) {
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    navigate('/');
  };

  const handleCancelDismiss = () => {
    setShowCancelConfirm(false);
  };

  const handleSubmit = async () => {
    setAttemptedSubmit(true);
    if (!validateStep3(formData)) {
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Work email: same firstname@ convention the app has always
      // used, derived from the real fields now available (no separate
      // "work email" field in the Phase 4 spec's Step 1/2).
      const workEmail = `${formData.firstName}`.trim().toLowerCase() + '@thecreditpros.com';

      // The real Azure AD account is NOT created here - only a local
      // record (deferAzure: true). It stays PENDING with no Azure
      // account until an IT admin clicks "MS Azure" on RequestDetails
      // (see userService.provisionAzure), matching every other
      // platform's manual/automated-trigger flow.
      const createdUser = await userService.createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: formData.displayName,
        email: formData.email,
        workEmail,
        department: formData.department,
        manager: formData.manager,
        jobTitle: formData.jobTitle,
        type: formData.employeeType,
        role: formData.role,
        team: formData.team,
        country: formData.country,
        workingLocation: formData.workingLocation,
        startDate: formData.startDate,
        deferAzure: true,
      });

      const createdRequest = await requestService.submitOnboardingRequest({
        userId: createdUser.id,
        submittedBy: user?.name || 'Unknown User',
        department: formData.department,
        manager: formData.manager,
        role: formData.role,
        jobTitle: formData.jobTitle,
        type: formData.employeeType,
        platforms: formData.selectedPlatforms,
        displayName: formData.displayName,
        team: formData.team,
        country: formData.country,
        workingLocation: formData.workingLocation,
        startDate: formData.startDate,
      });

      // No local recordAuditLog here - the backend already records
      // ONBOARDING_SUBMITTED for this call (see backend/routes/requests.js),
      // and AuditLogs.jsx merges that real entry in automatically.

      setSubmittedRequest({ id: createdRequest.id, employeeName: formData.displayName });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('[OnboardingForm] submit failed:', error.message);
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  const handleViewRequest = () => {
    setShowSuccessModal(false);
    navigate(`/requests/${submittedRequest.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] dark:from-[#0a0f1e] dark:to-[#0a0f1e] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 shadow-lg">
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-300">
            Step {currentStep} of {TOTAL_STEPS}: {STEP_LABELS[currentStep]}
          </p>
          <ol className="mt-3 flex items-center" aria-label="Onboarding progress">
            {[1, 2, 3].map((step) => (
              <li key={step} className="flex flex-1 items-center last:flex-none">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    step <= currentStep
                      ? 'bg-[#d4a574] text-[#1a365d]'
                      : 'border border-[#d4a574]/30 text-gray-400'
                  }`}
                  aria-current={step === currentStep ? 'step' : undefined}
                >
                  {step}
                </span>
                {step < TOTAL_STEPS && (
                  <span
                    className={`mx-2 h-0.5 flex-1 ${
                      step < currentStep ? 'bg-[#d4a574]' : 'bg-[#d4a574]/20'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>

        {currentStep === 1 && (
          <Step1PersonalInfo
            formData={formData}
            onDataChange={handleDataChange}
            onNext={handleNext}
            onCancel={handleCancel}
            existingEmails={existingEmails}
          />
        )}
        {currentStep === 2 && (
          <Step2EmploymentDetails
            formData={formData}
            onDataChange={handleDataChange}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        )}
        {currentStep === 3 && (
          <Step3Review
            formData={formData}
            onDataChange={handleDataChange}
            onSubmit={handleSubmit}
            onBack={handleBack}
            onCancel={handleCancel}
            submitting={submitting}
            error={submitError}
            attemptedSubmit={attemptedSubmit}
          />
        )}
      </div>

      <CancelConfirmationModal
        isOpen={showCancelConfirm}
        onConfirm={handleCancelConfirm}
        onDismiss={handleCancelDismiss}
      />
      <SuccessModal
        isOpen={showSuccessModal}
        employeeName={submittedRequest?.employeeName}
        requestId={submittedRequest?.id}
        onClose={handleSuccessClose}
        onViewRequest={handleViewRequest}
      />
    </div>
  );
}

export default OnboardingForm;
