export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-svh place-items-center overflow-hidden bg-background p-4">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
