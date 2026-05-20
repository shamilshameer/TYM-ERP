import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('💥 Uncaught error inside ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearData = async () => {
    if (confirm('Are you sure you want to clear your local database? All unsynced sales data will be lost.')) {
      indexedDB.deleteDatabase('SyncERPDatabase');
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6">
          <div className="max-w-md w-full border border-red-500/20 bg-slate-900/50 backdrop-blur-md rounded-2xl p-8 text-center shadow-2xl shadow-red-500/5">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-6">
              SyncERP has encountered an unexpected application crash. Unsynced local sales remain stored securely in your browser.
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left text-xs font-mono mb-6 max-h-40 overflow-y-auto text-red-400">
              {this.state.error && this.state.error.toString()}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition rounded-xl text-sm font-semibold cursor-pointer shadow-lg shadow-indigo-600/15"
              >
                Reload Application
              </button>
              
              <button
                onClick={this.handleClearData}
                className="w-full py-2 px-4 border border-slate-800 hover:border-slate-700 active:bg-slate-800 transition rounded-xl text-sm font-medium text-slate-400 hover:text-slate-300 cursor-pointer"
              >
                Clear Database & Reset (Danger)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
