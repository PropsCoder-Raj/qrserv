export default function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-warm">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary-100 border-t-primary" />
        <p className="text-sm text-text-light">Loading...</p>
      </div>
    </div>
  );
}
