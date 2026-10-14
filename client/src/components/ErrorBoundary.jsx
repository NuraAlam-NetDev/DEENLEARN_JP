import { Component } from 'react';

// Catches a crash inside any page, so one broken component shows a message instead of a blank screen.
// Wrap the app once in main.jsx:  <ErrorBoundary><App /></ErrorBoundary>
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // In production this is the place to send the error to a monitoring service
    console.error('UI error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-brand-800">{this.props.title ?? 'Something went wrong'}</h1>
        <p className="text-slate-600">{this.props.text ?? 'Please reload the page. If it keeps happening, contact support.'}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800"
        >
          {this.props.reloadLabel ?? 'Reload page'}
        </button>
      </div>
    );
  }
}
