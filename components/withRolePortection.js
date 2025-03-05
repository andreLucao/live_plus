'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Higher-order component to protect routes based on user roles
 * @param {React.Component} Component - The component to wrap with role protection
 * @param {string[]} allowedRoles - Array of roles allowed to access this component
 * @param {Object} options - Additional options
 * @param {string} options.redirectTo - Path to redirect unauthorized users (defaults to /unauthorized)
 * @param {React.Component} options.LoadingComponent - Custom loading component
 * @returns {React.Component} Protected component
 */
export default function withRoleProtection(
  Component, 
  allowedRoles, 
  options = { redirectTo: '/unauthorized' }
) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    
    const { redirectTo, LoadingComponent } = options;
    
    useEffect(() => {
      const checkAuthorization = async () => {
        try {
          // Get tenant from URL
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          const tenant = pathParts[0];
          
          if (!tenant) {
            throw new Error('No tenant found in URL');
          }
          
          const response = await fetch(`/${tenant}/api/auth/verify-role`);
          if (!response.ok) {
            throw new Error('Not authorized');
          }
          
          const data = await response.json();
          
          if (!data.role || !allowedRoles.includes(data.role)) {
            router.push(redirectTo || `/${tenant}/unauthorized`);
            return;
          }
          
          setAuthorized(true);
        } catch (error) {
          console.error('Authorization check failed:', error);
          
          // Try to get tenant from URL for redirect
          const pathParts = window.location.pathname.split('/').filter(Boolean);
          const tenant = pathParts[0];
          
          router.push(tenant ? `/${tenant}/login` : '/');
        } finally {
          setLoading(false);
        }
      };
      
      checkAuthorization();
    }, [router, redirectTo]);
    
    if (loading) {
      return LoadingComponent ? <LoadingComponent /> : <div>Loading...</div>;
    }
    
    if (!authorized) {
      return null;
    }
    
    return <Component {...props} />;
  };
}
