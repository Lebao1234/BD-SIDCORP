import React from 'react';

export const ReportDashboardSkeleton: React.FC<{ isAdmin?: boolean }> = ({ isAdmin = false }) => {
  return (
    <div className="flex flex-col gap-[18px] animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-48 rounded-lg bg-zinc-200/80 dark:bg-zinc-800 animate-pulse" />
          <div className="h-3.5 w-72 rounded-md bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {isAdmin && (
            <div className="h-[30px] w-36 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 animate-pulse" />
          )}
          <div className="h-[30px] w-24 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 animate-pulse" />
        </div>
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 rounded bg-zinc-200/80 dark:bg-zinc-800 animate-pulse" />
              <div className="h-4 w-4 rounded-md bg-zinc-200/60 dark:bg-zinc-800/80 animate-pulse" />
            </div>
            <div className="h-7 w-32 rounded-lg bg-zinc-200/90 dark:bg-zinc-800 animate-pulse my-0.5" />
            <div className="h-2.5 w-36 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Today Panel Skeleton */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 shadow-2xs">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-20 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-2.5 w-28 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>
          <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="h-4 w-48 rounded bg-zinc-100 dark:bg-zinc-800/50 animate-pulse" />
        </div>
      </div>

      {/* Row 1: Donut & Column Chart Skeletons */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[420px_minmax(0,1fr)]">
        {/* Donut Chart Skeleton */}
        <div className="rounded-xl border border-zinc-200/70 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-7 w-20 rounded bg-zinc-100 dark:bg-zinc-800/80 animate-pulse" />
          </div>
          <div className="flex items-center gap-6 py-2">
            <div className="h-32 w-32 rounded-full border-8 border-zinc-100 dark:border-zinc-800 animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-3">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="h-3 w-10 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column Chart Skeleton */}
        <div className="rounded-xl border border-zinc-200/70 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-2xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="h-7 w-20 rounded bg-zinc-100 dark:bg-zinc-800/80 animate-pulse" />
          </div>
          <div className="flex items-end justify-between gap-3 h-[180px] pt-4 px-4 border-b border-zinc-100 dark:border-zinc-800">
            {[35, 60, 20, 45, 15, 90].map((h, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full max-w-[36px] rounded-t-lg bg-zinc-200/80 dark:bg-zinc-800 animate-pulse"
                  style={{ height: `${h}%` }}
                />
                <div className="h-2.5 w-8 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Two horizontal bars Skeletons */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {[0, 1].map((p) => (
          <div key={p} className="rounded-xl border border-zinc-200/70 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-2xs flex flex-col gap-3.5">
            <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="flex flex-col gap-3 pt-1">
              {[0, 1, 2, 3, 4].map((j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    <div className="h-3 w-12 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

