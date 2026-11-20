import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error) {
        readable = `Database access error during ${parsed.operationType ?? 'operation'} on ${parsed.path ?? 'resource'}: ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('BookLoop ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-black/10 rounded-xl p-8">
            <div className="flex items-center gap-3 text-[#991B1B] mb-4">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h1 className="font-display text-xl font-semibold text-[#14181F]">
                Something interrupted BookLoop
              </h1>
            </div>
            <p className="text-sm text-[#4A5568] leading-relaxed mb-6">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5E43] text-white text-sm font-medium rounded-lg hover:bg-[#154A34] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              Reload BookLoop
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
