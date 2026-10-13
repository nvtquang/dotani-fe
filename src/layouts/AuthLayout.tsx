import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingSkeleton } from '../components/ui';
import dotaniLogo from '../assets/dotani-logo.webp';

export const AuthLayout = () => (
  <main className="flex min-h-dvh items-start justify-center bg-gradient-to-b from-brand-50 to-canvas px-4 py-8 sm:items-center">
    <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center text-center">
        <img src={dotaniLogo} alt="" width={72} height={72} className="size-18 rounded-full shadow-card" />
        <p className="mt-3 text-sm font-semibold text-brand-800">DOTANI · Đoàn phường Thượng Cát</p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-7">
        <Suspense fallback={<LoadingSkeleton rows={6} />}>
          <Outlet />
        </Suspense>
      </section>
    </div>
  </main>
);
