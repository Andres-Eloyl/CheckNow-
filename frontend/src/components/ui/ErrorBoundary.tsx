"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-[#0A0A0B] rounded-[32px] border border-rose-100 dark:border-rose-900/30 w-full mt-4 mx-auto max-w-2xl">
          <div className="size-20 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <span className="material-symbols-outlined text-[40px]">warning</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">¡Ups! Algo inesperado pasó</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Tuvimos un problema procesando esta sección de la aplicación. Por favor, intenta de nuevo.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3.5 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-md focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
