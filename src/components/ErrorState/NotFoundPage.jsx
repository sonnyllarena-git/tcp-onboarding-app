import React from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from './ErrorState';

/**
 * NotFoundPage Component
 *
 * 404 page shown for unmatched routes, and by RequestDetails/OffboardingForm
 * when the requested id doesn't exist.
 *
 * @component
 * @returns {React.ReactElement} NotFoundPage component
 */
function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <ErrorState
      code={404}
      icon="🔍"
      title="Page Not Found"
      message="The page you're looking for doesn't exist or may have been moved."
      suggestion="Try going back to the Dashboard or check the URL and try again."
      primaryAction={{ label: 'Go to Dashboard', onClick: () => navigate('/') }}
      secondaryAction={{ label: 'Go Back', onClick: () => navigate(-1) }}
    />
  );
}

export default NotFoundPage;
