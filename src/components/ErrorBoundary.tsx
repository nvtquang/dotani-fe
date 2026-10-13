import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled frontend error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-dvh items-center justify-center p-4">
          <div role="alert" className="max-w-sm rounded-2xl border border-accent-100 bg-white p-6 text-center shadow-card">
            <h1 className="text-lg font-semibold text-slate-900">Đã có lỗi xảy ra</h1>
            <p className="mt-2 text-sm text-slate-600">Vui lòng tải lại trang. Nếu lỗi lặp lại, hãy báo cho cán bộ quản trị.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Tải lại trang
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
