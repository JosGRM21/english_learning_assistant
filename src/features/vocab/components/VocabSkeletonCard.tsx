export function VocabSkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200/70 dark:border-white/[0.06] bg-white/60 dark:bg-[#121622]/60 p-5 space-y-4 animate-pulse shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-4 w-20 bg-indigo-100/60 dark:bg-indigo-950/40 rounded-md" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-8 bg-gray-200 dark:bg-gray-800 rounded-md" />
          <div className="h-5 w-14 bg-gray-200 dark:bg-gray-800 rounded-md" />
        </div>
      </div>

      {/* Translation & definition */}
      <div className="space-y-2 pt-1">
        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800/60 rounded" />
        <div className="h-5 w-44 bg-gray-200 dark:bg-gray-800 rounded-md" />
        <div className="h-3 w-full bg-gray-100 dark:bg-gray-800/60 rounded" />
        <div className="h-3 w-3/4 bg-gray-100 dark:bg-gray-800/60 rounded" />
      </div>

      {/* Context example box */}
      <div className="p-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/40 space-y-2">
        <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700/60 rounded" />
        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700/60 rounded" />
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
}

export function VocabSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <VocabSkeletonCard key={i} />
      ))}
    </div>
  );
}
