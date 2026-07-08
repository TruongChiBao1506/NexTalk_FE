interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div
    className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-zinc-800/80 ${className}`}
    aria-hidden="true"
  />
);

export const ChatListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="space-y-2 px-2 py-3" aria-label="Đang tải danh sách trò chuyện">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center gap-3 rounded-2xl bg-white/55 p-3 dark:bg-zinc-900/35">
        <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-3 w-44 max-w-full" />
        </div>
      </div>
    ))}
  </div>
);

export const CardListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Đang tải nội dung">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="nextalk-soft-card rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

export const SearchResultSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-3" aria-label="Đang tìm kiếm">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-5 md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-x-6 md:gap-y-4 md:space-y-0" aria-label="Đang tải hồ sơ">
    <div className="flex flex-col items-center border-b border-gray-150 pb-5 text-center dark:border-zinc-800/60 md:row-span-6 md:border-b-0 md:border-r md:pb-0 md:pr-6">
      <Skeleton className="mb-4 h-28 w-28 rounded-full" />
      <Skeleton className="h-6 w-36" />
      <Skeleton className="mt-3 h-5 w-32 rounded-md" />
      <div className="mt-6 w-full space-y-3">
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-16 w-full rounded-2xl" />
    </div>
    <Skeleton className="h-16 w-full rounded-2xl" />
    <div className="space-y-3">
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>
  </div>
);
