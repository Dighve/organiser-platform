import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { trackError } from '../lib/analytics';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorCount = this.state.errorCount + 1;
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorCount
    });

    // Track error in analytics
    trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown',
      errorCount,
      page: window.location.pathname
    });

    // Send to error tracking service (Sentry, etc.)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        },
        tags: {
          errorBoundary: this.props.name || 'Unknown'
        }
      });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Reload the page if error persists
    if (this.state.errorCount > 2) {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI from props
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.handleReset
        });
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {this.props.title || 'Oops! Something went wrong'}
              </h1>
              
              <p className="text-gray-600 mb-6">
                {this.props.message || "We're sorry for the inconvenience. The page encountered an unexpected error."}
              </p>

              {/* Error Details (Development Only) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
                  <p className="text-sm font-mono text-red-800 break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-purple-500 hover:text-purple-600 transition-all duration-200"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </button>
              </div>

              {/* Help Text */}
              <p className="text-sm text-gray-500 mt-6">
                If this problem persists, please contact support at{' '}
                <a href="mailto:support@outmeets.com" className="text-purple-600 hover:underline">
                  support@outmeets.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
