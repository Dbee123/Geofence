import React, { Component } from 'react';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
            <div className={styles.errorFallback}>
          <h2>Hey there, something went wrong.</h2>
          <p>Please refresh the page or try againlater after the error has been fixed.</p>
          {this.state.error && (
            <details className={styles.details}>
              <summary>Click to view error</summary>
              <pre>{this.state.error.toString()}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
