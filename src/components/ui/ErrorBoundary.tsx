import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, AlertTriangle, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-theme p-8 max-w-lg w-full text-center shadow-2xl border-error-500/20"
                    >
                        <div className="w-20 h-20 bg-error-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-error-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-foreground mb-3">Something went wrong</h1>
                        <p className="text-muted-foreground mb-8 leading-relaxed">
                            We encountered an unexpected error. Don't worry, your data is safe.
                            You can try refreshing the page or going back to the dashboard.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mt-8 p-4 bg-black/40 rounded-xl text-left overflow-auto max-h-48 border border-border/50">
                                <p className="text-error-400 font-mono text-xs whitespace-pre-wrap">
                                    {this.state.error.stack}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}
