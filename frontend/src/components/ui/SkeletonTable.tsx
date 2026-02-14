import React from 'react';

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}

export default function SkeletonTable({
  rows = 5,
  columns = 4,
  hasHeader = true,
  className = ''
}: SkeletonTableProps) {
  return (
    <div className={`bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          {hasHeader && (
            <thead>
              <tr className="border-b border-zinc-800">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="px-6 py-4 text-left">
                    <div className="h-4 bg-zinc-800 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }}></div>
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Body */}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr 
                key={rowIndex}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div 
                      className="h-4 bg-zinc-800 rounded animate-pulse"
                      style={{ 
                        width: `${40 + Math.random() * 60}%`,
                        animationDelay: `${rowIndex * 100 + colIndex * 50}ms`
                      }}
                    ></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Variação com action buttons
export function SkeletonTableWithActions({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl overflow-hidden">
      {/* Header com search e filters */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between gap-4">
          <div className="h-10 bg-zinc-800 rounded-lg w-64 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 bg-zinc-800 rounded-lg w-32 animate-pulse"></div>
            <div className="h-10 bg-zinc-800 rounded-lg w-24 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              {['Nome', 'Status', 'Data', 'Ações'].map((header, i) => (
                <th key={i} className="px-6 py-4 text-left">
                  <div className="h-4 bg-zinc-800 rounded animate-pulse w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-zinc-800 rounded w-32 mb-2 animate-pulse"></div>
                      <div className="h-3 bg-zinc-800 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 bg-zinc-800 rounded-full w-20 animate-pulse"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-zinc-800 rounded w-24 animate-pulse"></div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <div className="h-8 bg-zinc-800 rounded w-8 animate-pulse"></div>
                    <div className="h-8 bg-zinc-800 rounded w-8 animate-pulse"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
        <div className="h-4 bg-zinc-800 rounded w-32 animate-pulse"></div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-zinc-800 rounded w-8 animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton para lista compacta
export function SkeletonListCompact({ items = 5 }: { items?: number }) {
  return (
    <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl divide-y divide-zinc-800">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-zinc-800 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="h-8 bg-zinc-800 rounded w-20 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}