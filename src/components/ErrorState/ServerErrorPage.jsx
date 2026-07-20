import React from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorState from './ErrorState';

/**
 * ServerErrorPage Component
 *
 * 500 page for unexpected/unrecoverable errors. Not yet wired to a route or
 * error boundary — available for a future task to use once one exists.
 *
 * @component
 * @returns {React.ReactElement} ServerErrorPage component
 */
function ServerErrorPage() {
  const navigate = useNavigate();
  return (
    <ErrorState
      code={500}
      icon="⚠️"
      title="Something Went Wrong"
      message="An unexpected server error occurred. Our team has been notified."
      suggestion="Try refreshing the page. If the problem persists, report it to IT Support."
      primaryAction={{ label: 'Refresh Page', onClick: () => window.location.reload() }}
      secondaryAction={{ label: 'Go to Dashboard', onClick: () => navigate('/') }}
    />
  );
}

export default ServerErrorPage;
