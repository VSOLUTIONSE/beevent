"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-[#030305] text-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="font-serif text-4xl text-white mb-4">Something went wrong</h1>
          <p className="text-[#B0A8A8] mb-6">An unexpected error occurred.</p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 bg-[#E33539] text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-[#E33539]/25"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
