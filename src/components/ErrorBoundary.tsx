import React, { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    let message = "An unexpected error occurred.";
    
    try {
      const parsed = JSON.parse(error?.message || "");
      if (parsed.error && parsed.operationType) {
        message = `Security Access Denied: Unable to ${parsed.operationType} at ${parsed.path}. Please verify your permissions.`;
      }
    } catch (e) {
      // Not a JSON error
    }

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-12 text-center border border-rose-500/20 bg-rose-500/5">
        <h2 className="text-2xl font-serif text-rose-500 mb-4">System Protocol Error</h2>
        <p className="text-on-surface-dim text-sm max-w-md mb-8">{message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-2 border border-rose-500 text-rose-500 text-[11px] uppercase tracking-widest font-bold hover:bg-rose-500 hover:text-white transition-all"
        >
          Restart Node
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
