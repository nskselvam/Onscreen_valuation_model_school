import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log the error to an external service here
    this.setState({ error, info });
    // Example: console.error(error, info)
    if (typeof window !== 'undefined') console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    // Simple recovery: reload the page
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:20, fontFamily: 'Inter, system-ui, -apple-system, Roboto, sans-serif'}}>
          <h2 style={{color:'#b00020'}}>Something went wrong</h2>
          <p>We're sorry — the application encountered an error. You can try reloading the page.</p>
          <div style={{marginTop:12}}>
            <button onClick={this.handleReload} style={{padding:'8px 12px', borderRadius:6, border:'none', background:'#1976d2', color:'#fff'}}>Reload</button>
          </div>
          <details style={{marginTop:12, whiteSpace:'pre-wrap'}}>
            <summary style={{cursor:'pointer'}}>Error details (for debugging)</summary>
            <div>
              <strong>Error:</strong>
              <pre>{String(this.state.error && this.state.error.toString())}</pre>
              {this.state.info && this.state.info.componentStack && (
                <>
                  <strong>Stack:</strong>
                  <pre>{this.state.info.componentStack}</pre>
                </>
              )}
            </div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
