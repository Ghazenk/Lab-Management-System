import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let message = this.state.error?.message || "An unexpected error occurred.";
      
      try {
        const parsed = JSON.parse(message);
        if (parsed.error && parsed.operationType) {
          message = `Security Access Denied: Unable to ${parsed.operationType} at ${parsed.path}. Please verify your permissions.`;
        }
      } catch (e) {
        // Not a JSON error
      }

      // Check for Supabase table missing error
      if (message.includes('PGRST205') || message.includes('schema cache')) {
        message = "Database tables are missing. Please run the supabase-setup.sql script in your Supabase SQL Editor.";
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-surface">
          <div className="max-w-md w-full border border-rose-500/20 bg-rose-500/5 p-12">
            <h2 className="text-2xl font-serif text-rose-500 mb-4">System Protocol Error</h2>
            <p className="text-on-surface-dim text-sm mb-8 leading-relaxed">{message}</p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-rose-500 text-white text-[11px] uppercase tracking-widest font-bold hover:bg-rose-600 transition-all"
              >
                Restart Node
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-3 border border-border text-on-surface-dim text-[11px] uppercase tracking-widest font-bold hover:text-on-surface transition-all"
              >
                Return to Base
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
