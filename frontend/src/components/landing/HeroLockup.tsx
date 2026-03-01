"use client";

export function HeroLockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="hero-lockup-box relative inline-flex flex-col items-center gap-4 px-8 py-6 sm:gap-5 sm:px-12 sm:py-8">
      {children}
    </div>
  );
}
