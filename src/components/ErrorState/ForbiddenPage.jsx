import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ErrorState from './ErrorState';

/**
 * ForbiddenPage Component
 *
 * 403 page shown when a signed-in user without the required role (e.g. a
 * USER hitting an ADMIN-only page like Audit Logs) tries to access a page.
 *
 * @component
 * @returns {React.ReactElement} ForbiddenPage component
 */
function ForbiddenPage() {
  const navigate = useNavigate();
  const user = useAuth();
  return (
    <ErrorState
      code={403}
      icon="🔒"
      title="Access Denied"
      message={
        user
          ? `Your account (${user.role} role) does not have permission to view this page.`
          : "You don't have permission to view this page. Please log in."
      }
      suggestion="If you believe this is a mistake, contact your IT Administrator to request access."
      primaryAction={{ label: 'Go to Dashboard', onClick: () => navigate('/') }}
      secondaryAction={{ label: 'Go Back', onClick: () => navigate(-1) }}
    />
  );
}

export default ForbiddenPage;
