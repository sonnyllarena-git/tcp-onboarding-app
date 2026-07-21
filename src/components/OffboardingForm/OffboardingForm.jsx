import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Step1EmployeeInfo, { validateStep1, getTodayIsoDate } from './Step1EmployeeInfo';
import Step2OffboardingActions, { validateStep2 } from './Step2OffboardingActions';
import Step3Review from './Step3Review';
import CancelConfirmationModal from './CancelConfirmationModal';
import SuccessModal from './SuccessModal';
import * as userService from '../../services/userService';
import * as requestService from '../../services/requestService';
import { NotFoundPage } from '../ErrorState';
import { useAuth } from '../../hooks/useAuth';

const TOTAL_STEPS = 3;

const STEP_LABELS = {
  1: 'Confirm Offboarding',
  2: 'Offboarding Actions',
  3: 'Review & Submit',
};

/**
 * Builds the initial wizard form data from a looked-up user record.
 *
 * @param {Object|null} user - The employee being offboarded, or null if not found
 * @param {string} userId - Raw userId from the URL, used as a fallback
 * @returns {Object} Initial form data
 */
function buildInitialFormData(user, userId) {
  return {
    userId: user ? user.id : userId,
    employeeName: user ? user.name : '',
    email: user ? user.email : '',
    department: user ? user.department : '',
    manager: user ? user.manager : '',
    dateOnboarded: user ? user.dateOnboarded : '',
    offboardingReason: '',
    offboardingDate: getTodayIsoDate(),
    finalDay: '',
    timing: 'immediate',
    selectedPlatforms: [],
    confirmationChecked: false,
  };
}

/**
 * OffboardingForm Component
 *
 * 3-step wizard for offboarding an active employee, reached via
 * /offboard/:userId. Collects the offboarding reason/dates, the
 * platforms to disable, and a final review before mock-submitting.
 *
 * @component
 * @returns {React.ReactElement} OffboardingForm component
 */
function OffboardingForm() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const loggedInUser = useAuth();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [pendingOffboardRequest, setPendingOffboardRequest] = useState(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => buildInitialFormData(null, userId));
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingUser(true);
      try {
        const fetchedUser = await userService.getUser(userId);
        if (cancelled) return;
        setUser(fetchedUser);
        setFormData(buildInitialFormData(fetchedUser, userId));
        const requests = await requestService.listRequests({ userId, status: 'PENDING' });
        if (cancelled) return;
        setPendingOffboardRequest(requests.find((r) => r.type === 'Offboarding') || null);
      } catch (error) {
        console.error('[OffboardingForm] failed to load user:', error.message);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

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
    setShowCancelModal(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelModal(false);
    navigate('/');
  };

  const handleCancelDismiss = () => {
    setShowCancelModal(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await requestService.submitOffboardingRequest({
        userId: formData.userId,
        submittedBy: loggedInUser?.name || 'Unknown User',
        platforms: formData.selectedPlatforms,
      });

      // The employee stays active until this request is actually approved
      // in RequestDetails - mirrors onboarding's own pending -> active
      // symmetry, and avoids deactivating someone whose offboarding could
      // still be rejected.
      //
      // No local recordAuditLog here - the backend already records
      // OFFBOARDING_SUBMITTED for this call, and AuditLogs.jsx merges
      // that real entry in automatically.

      setSubmittedRequest({
        requestId: created.id,
        employeeName: formData.employeeName,
        submittedBy: loggedInUser?.name || 'Unknown User',
        submittedAt: new Date().toISOString(),
        selectedPlatforms: formData.selectedPlatforms,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('[OffboardingForm] submit failed:', error.message);
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  const handleViewRequest = () => {
    setShowSuccessModal(false);
    navigate(`/requests/${submittedRequest.requestId}`);
  };

  if (loadingUser) {
    return <div className="p-6 text-white">Loading...</div>;
  }

  if (!user) {
    return <NotFoundPage />;
  }

  if (user.status !== 'active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] dark:from-[#0a0f1e] dark:to-[#0a0f1e] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-xl border border-[#f56565]/40 bg-[#f56565]/10 p-6">
          <p role="alert" className="text-sm text-[#f56565]">
            {user.name} cannot be offboarded because their status is not Active.
          </p>
          <button
            type="button"
            onClick={() => navigate('/manage-users')}
            className="mt-4 rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
          >
            &larr; Back to Manage Users
          </button>
        </div>
      </div>
    );
  }

  if (pendingOffboardRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] dark:from-[#0a0f1e] dark:to-[#0a0f1e] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl rounded-xl border border-[#f56565]/40 bg-[#f56565]/10 p-6">
          <p role="alert" className="text-sm text-[#f56565]">
            {user.name} already has a pending offboarding request.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(`/requests/${pendingOffboardRequest.id}`)}
              className="rounded-lg bg-[#d4a574] px-4 py-2 text-sm font-bold text-[#1a365d] transition-colors hover:bg-[#c99a63] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
            >
              View Request
            </button>
            <button
              type="button"
              onClick={() => navigate('/manage-users')}
              className="rounded-lg border border-[#d4a574] px-4 py-2 text-sm font-bold text-[#d4a574] transition-colors hover:bg-[#d4a574] hover:text-[#1a365d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a574]"
            >
              &larr; Back to Manage Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] to-[#0d1b30] dark:from-[#0a0f1e] dark:to-[#0a0f1e] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-[#d4a574]/30 bg-[#1a365d] p-6 shadow-lg">
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-300">
            Step {currentStep} of {TOTAL_STEPS}: {STEP_LABELS[currentStep]}
          </p>
          <ol className="mt-3 flex items-center" aria-label="Offboarding progress">
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
          <Step2OffboardingActions
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
          />
        )}
      </div>

      <CancelConfirmationModal
        isOpen={showCancelModal}
        employeeName={formData.employeeName}
        onConfirm={handleCancelConfirm}
        onDismiss={handleCancelDismiss}
      />
      <SuccessModal
        isOpen={showSuccessModal}
        requestData={submittedRequest}
        onGoToDashboard={handleGoToDashboard}
        onViewRequest={handleViewRequest}
      />
    </div>
  );
}

export default OffboardingForm;
