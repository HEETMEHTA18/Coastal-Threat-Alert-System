// Error Boundary component for Map components
import React from 'react';

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
          <div className="text-center p-8 max-w-2xl w-full">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-400">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-400">Map Error</h3>
            <p className="text-slate-400 text-sm mb-4">
              There was an error loading the map component. Please try refreshing the page or check the developer console for details.
            </p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-sm"
              >
                Reload Page
              </button>
            </div>
            <p className="text-slate-500 text-xs mt-4">Error: {this.state.error?.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;