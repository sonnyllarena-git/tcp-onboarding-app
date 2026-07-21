import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Step1EmployeeInfo, { validateStep1 } from './Step1EmployeeInfo';
import Step2PlatformSelection, { validateStep2 } from './Step2PlatformSelection';
import Step3Review from './Step3Review';
import CancelConfirmationModal from './CancelConfirmationModal';
import SuccessModal from './SuccessModal';
import { useAuth } from '../../hooks/useAuth';
import { generateWorkEmail, generateDuplicateWorkEmail, checkDuplicateActiveUser } from '../../mockData';
import * as userService from '../../services/userService';
import * as requestService from '../../services/requestService';

const TOTAL_STEPS = 3;

const STEP_LABELS = {
  1: 'Employee Information',
  2: 'Platform Selection',
  3: 'Review & Submit',
};

const INITIAL_FORM_DATA = {
  employeeName: '',
  email: '',
  startDate: '',
  departmentId: '',
  departmentName: '',
  managerId: '',
  managerName: '',
  jobTitleId: '',
  jobTitleLabel: '',
  role: '',
  floor: '',
  employeeType: '',
  employeeTypeLabel: '',
  azureGroupId: '',
  azureGroupName: '',
  azureGroupKey: '',
  selectedPlatforms: [],
};

/**
 * OnboardingForm Component
 *
 * 3-step wizard for onboarding new employees.
 * Collects employee info, platform selection, and review.
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
  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetched once here (not in Step1EmployeeInfo) since it's a real,
  // async backend call now instead of a synchronous mock lookup - the
  // manager dropdown and the duplicate-name check both need it.
  useEffect(() => {
    let cancelled = false;
    userService
      .getAllUsers()
      .then((users) => {
        if (!cancelled) setActiveUsers(users.filter((u) => u.status === 'active'));
      })
      .catch((error) => {
        console.error('[OnboardingForm] failed to load users:', error.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
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
    if (currentStep === 1 && !validateStep1(formData)) {
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
    setSubmitting(true);
    setSubmitError(null);
    try {
      // Real Azure AD account creation happens now, at submission time
      // (the backend requires a work email up front) - the old mock
      // flow deferred this to the platform-provisioning step, so the
      // work email is generated here with the same naming convention
      // it always used (firstname@, or firstname.lastname@ on a
      // duplicate-name collision) rather than asking for a new field.
      const isDuplicate = checkDuplicateActiveUser(formData.employeeName, activeUsers);
      const workEmail = isDuplicate
        ? generateDuplicateWorkEmail(formData.employeeName)
        : generateWorkEmail(formData.employeeName);

      const createdUser = await userService.createUser({ ...formData, workEmail });

      const createdRequest = await requestService.submitOnboardingRequest({
        userId: createdUser.id,
        submittedBy: user?.name || 'Unknown User',
        department: formData.departmentName,
        manager: formData.managerName,
        floor: formData.floor,
        role: formData.role,
        jobTitle: formData.jobTitleLabel,
        type: formData.employeeTypeLabel || 'Internal',
        platforms: formData.selectedPlatforms,
      });

      // No local recordAuditLog here - the backend already records
      // ONBOARDING_SUBMITTED for this call (see backend/routes/requests.js),
      // and AuditLogs.jsx merges that real entry in automatically.

      setSubmittedRequest({ id: createdRequest.id, employeeName: formData.employeeName });
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
          <Step1EmployeeInfo
            formData={formData}
            onDataChange={handleDataChange}
            onNext={handleNext}
            onCancel={handleCancel}
            activeUsers={activeUsers}
            loadingUsers={loadingUsers}
          />
        )}
        {currentStep === 2 && (
          <Step2PlatformSelection
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
            onSubmit={handleSubmit}
            onBack={handleBack}
            onCancel={handleCancel}
            submitting={submitting}
            error={submitError}
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
