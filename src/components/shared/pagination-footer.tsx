"use client";

export function PaginationFooter({
  start,
  end,
  total,
  totalLabel = "items",
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25],
}: {
  start: number;
  end: number;
  total: number;
  totalLabel?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  return (
    <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">
        Showing {total === 0 ? 0 : start} to {end} of {total.toLocaleString()} {totalLabel}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-8 rounded border px-2 text-sm disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              type="button"
              className={["h-8 w-8 rounded border text-sm", p === currentPage ? "bg-primary text-primary-foreground" : ""].join(" ")}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          );
        })}
        <button
          type="button"
          className="h-8 rounded border px-2 text-sm disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
        {pageSize && onPageSizeChange ? (
          <select
            className="h-8 rounded border px-2 text-sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}
