export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-card bg-accent text-lg font-semibold text-accent-ink">
            Rs
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Finance</h1>
        </div>
        <div className="rounded-card border border-border bg-surface p-6">{children}</div>
      </div>
    </div>
  );
}
