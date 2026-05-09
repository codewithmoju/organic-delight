import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, AlertTriangle, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    showDetails: boolean;
    copied: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        copied: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null, showDetails: false, copied: false };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false, copied: false });
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false, copied: false });
        window.location.href = '/';
    };

    private toggleDetails = () => {
        this.setState((s) => ({ showDetails: !s.showDetails }));
    };

    private copyError = async () => {
        const { error, errorInfo } = this.state;
        const text = [
          `Error: ${error?.message}`,
          '',
          error?.stack || '',
          '',
          errorInfo?.componentStack || '',
        ].join('\n');
        try {
          await navigator.clipboard.writeText(text);
          this.setState({ copied: true });
          setTimeout(() => this.setState({ copied: false }), 2000);
        } catch { /* clipboard blocked */ }
    };

    public render() {
        if (this.state.hasError) {
            const { error, errorInfo, showDetails, copied } = this.state;

            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <div className="card-theme p-8 max-w-lg w-full text-center shadow-2xl border-error-500/20">
                        <div className="w-20 h-20 bg-error-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-error-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-3">Something went wrong</h1>

                        {/* Always show the error message */}
                        {error && (
                            <div className="mb-4 p-3 bg-error-500/10 border border-error-500/20 rounded-lg text-left">
                                <p className="text-error-400 font-semibold text-sm">{error.name || 'Error'}</p>
                                <p className="text-error-300 text-sm mt-1">{error.message}</p>
                            </div>
                        )}

                        <p className="text-foreground-muted mb-6 text-sm">
                            You can try refreshing the page or going back to the dashboard.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
                            <button
                                onClick={this.handleReset}
                                className="btn-primary flex items-center justify-center gap-2 px-6"
                            >
                                <RefreshCcw className="w-4 h-4" />
                                Refresh Page
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="btn-secondary flex items-center justify-center gap-2 px-6"
                            >
                                <Home className="w-4 h-4" />
                                Go to Home
                            </button>
                        </div>

                        {/* Toggle full stack trace */}
                        {(error?.stack || errorInfo?.componentStack) && (
                            <div className="mt-4">
                                <button
                                    onClick={this.toggleDetails}
                                    className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
                                >
                                    {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    {showDetails ? 'Hide details' : 'Show details'}
                                </button>

                                {showDetails && (
                                    <div className="mt-3 relative">
                                        <button
                                            onClick={this.copyError}
                                            className="absolute top-2 right-2 p-1.5 rounded-md bg-dark-700/80 hover:bg-dark-600 text-gray-400 hover:text-white transition-colors z-10"
                                            title="Copy error"
                                        >
                                            {copied ? <Check className="w-3.5 h-3.5 text-success-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                        <div className="p-4 bg-dark-900 rounded-xl text-left overflow-auto max-h-64 border border-border/50">
                                            {error?.stack && (
                                                <pre className="text-error-400 font-mono text-xs whitespace-pre-wrap mb-3">{error.stack}</pre>
                                            )}
                                            {errorInfo?.componentStack && (
                                                <>
                                                    <p className="text-gray-500 font-mono text-xs mb-1">Component Stack:</p>
                                                    <pre className="text-gray-400 font-mono text-xs whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
