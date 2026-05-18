import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional label shown in the fallback ("Admin section", "this page" etc.) */
  scope?: string;
  /** Optional path to navigate to when the user clicks the home button. Default: '/' */
  homePath?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface to the console so devs can debug, but never let it crash the tree.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', this.props.scope ?? 'app', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  reload = () => {
    this.reset();
    window.location.reload();
  };

  goHome = () => {
    this.reset();
    window.location.href = this.props.homePath ?? '/';
  };

  render() {
    if (!this.state.error) return this.props.children;

    const message = this.state.error.message || 'Something went wrong on this page.';

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-slate-900">
            {this.props.scope ? `${this.props.scope} ran into a problem` : 'Something went wrong'}
          </h1>
          <p className="mt-2 break-words text-sm text-slate-600">{message}</p>
          <p className="mt-1 text-xs text-slate-400">
            Your unsaved work in forms is preserved in this browser. Try reloading.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={this.reload}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reload page
            </button>
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.goHome}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
