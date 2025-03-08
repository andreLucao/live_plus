'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Sidebar from '@/components/Sidebar';

/**
 * Client-side component for role-based protection
 * To be used in page components that need role protection
 */
export default function RoleProtection({ 
  children, 
  allowedRoles = ['owner'],
  fallback = 'redirect' // can be 'redirect' or 'message'
}) {
  const router = useRouter();
  const { tenant } = useParams();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        if (!tenant) {
          throw new Error("No tenant found in URL");
        }
        
        const response = await fetch(`/api/${tenant}/auth/verify-role`);
        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated, redirect to login
            router.push(`/${tenant}/login`);
            return;
          }
          throw new Error(`Authorization failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.role || !allowedRoles.includes(data.role)) {
          // User doesn't have required role
          console.log(`Access denied. User role: ${data.role}, Required roles: ${allowedRoles.join(', ')}`);
          
          if (fallback === 'redirect') {
            router.push(`/${tenant}/unauthorized`);
            return;
          }
          
          setError(`Esta página requer permissão de ${allowedRoles.join(' ou ')}.`);
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
        
      } catch (error) {
        console.error("Role verification error:", error);
        setError("Falha ao verificar permissões. Por favor, tente novamente.");
        
        if (fallback === 'redirect') {
          router.push(`/${tenant}/login`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthorization();
  }, [router, tenant, allowedRoles, fallback]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }
  
  // If not authorized and showing in-place message
  if (!authorized && fallback === 'message') {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Acesso Restrito</AlertTitle>
            <AlertDescription>
              {error || "Você não tem permissão para acessar esta página."}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }
  
  // If authorized, render children
  if (authorized) {
    return children;
  }
  
  // If we're here, we're redirecting
  return null;
}