import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Step1EmployeeInfo, { validateStep1 } from './Step1EmployeeInfo';
import Step2PlatformSelection, { validateStep2 } from './Step2PlatformSelection';
import Step3Review from './Step3Review';
import CancelConfirmationModal from './CancelConfirmationModal';
import SuccessModal from './SuccessModal';
import { useAuth } from '../../hooks/useAuth';
import { createOnboardingRequest, withTimelineEvent, saveRequest, buildPendingUser, saveUser } from '../../mockData';
import { recordAuditLog } from '../AuditLogs';

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
  const [submittedRequest, setSubmittedRequest] = useState(null);

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

  const handleSubmit = () => {
    setSubmitting(true);
    // TODO: Replace with a real API call to submit the onboarding request.
    setTimeout(() => {
      const baseRequest = createOnboardingRequest({
        ...formData,
        submittedBy: user?.name || 'Unknown User',
        submittedByRole: user?.role || 'Unknown',
        submittedByDept: user?.department || 'Unknown',
      });
      const newRequest = withTimelineEvent(baseRequest, 'Request Created', 'completed');
      saveRequest(newRequest);
      // Create the pending user immediately, matching the seed data's own
      // convention where every pending user already has a request on day
      // one - RequestDetails' Approve flow later finds this same user by
      // email and flips it to active once every platform is provisioned.
      saveUser(buildPendingUser(newRequest));

      recordAuditLog({
        userEmail: user?.email || 'unknown',
        userName: user?.name || 'Unknown User',
        department: user?.department || 'Unknown',
        action: 'ONBOARDING_SUBMITTED',
        requestId: newRequest.id,
        details: `${formData.employeeName} — ${formData.departmentName}`,
      });

      setSubmittedRequest(newRequest);
      setSubmitting(false);
      setShowSuccessModal(true);
    }, 1500);
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
