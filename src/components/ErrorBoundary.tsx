import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackName?: string;
  onReset?: () => void;
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
    console.error(`[ErrorBoundary] Caught error in ${this.props.fallbackName || 'component'}:`, error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[360px] flex flex-col items-center justify-center p-6 bg-space-950/90 border border-red-500/30 rounded-xl text-center font-mono select-none backdrop-blur-md">
          <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-2xl text-red-400 mb-3 shadow-lg animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
            {this.props.fallbackName || 'Component'} Protected
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mb-3 font-sans">
            A rendering or WebGL context fault was safely intercepted to protect mission telemetry integrity.
          </p>
          {this.state.error && (
            <div className="text-[11px] text-red-300/80 bg-red-950/40 p-2.5 rounded border border-red-900/50 max-w-lg mb-4 break-all">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-space-850 hover:bg-space-800 border border-white/20 text-xs text-white transition-all shadow-md cursor-pointer hover:border-isro-cyan/50"
          >
            <RotateCcw className="w-3.5 h-3.5 text-isro-cyan" />
            <span>Restore Display</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
