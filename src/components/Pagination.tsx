import React from "react";

type PaginationProps = {
  page: number;
  onPageChange: (page: number) => void;
  canGoNext?: boolean;
  isLoading?: boolean;
  className?: string;
  showPageInfo?: boolean;
};

const Pagination: React.FC<PaginationProps> = ({
  page,
  onPageChange,
  canGoNext = false,
  isLoading = false,
  className = "",
  showPageInfo = true,
}) => {
  return (
    <div className={`flex items-center justify-center gap-2 mt-6 ${className}`}>
      <button
        className="px-3 py-1 text-xs border rounded disabled:opacity-50 transition-colors duration-150 hover:bg-[#FF7A00]/10 active:bg-[#FF7A00] active:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1 || isLoading}
        aria-label="Previous page"
      >
        Prev
      </button>

      {showPageInfo && <span className="text-xs text-gray-500">Page {page}</span>}

      <button
        className="px-3 py-1 text-xs border rounded disabled:opacity-50 transition-colors duration-150 hover:bg-[#FF7A00]/10 active:bg-[#FF7A00] active:text-white focus:outline-none focus:ring-2 focus:ring-[#FF7A00]"
        onClick={() => onPageChange(page + 1)}
        disabled={isLoading || !canGoNext}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
