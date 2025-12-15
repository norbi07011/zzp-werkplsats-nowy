import React, { useState, useMemo, useCallback } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

export type SortDirection = "asc" | "desc" | null;

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  filter?: {
    type: "text" | "select" | "date" | "number";
    options?: Array<{ label: string; value: any }>;
  };
}

export interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  title?: string;
  searchable?: boolean;
  exportable?: boolean;
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
  };
  onRowClick?: (row: T, index: number) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchable = true,
  exportable = true,
  pagination = {
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
  },
  onRowClick,
  loading = false,
  emptyMessage = "Geen gegevens beschikbaar",
  className = "",
}: DataTableProps<T>) {
  // State management
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination.pageSize || 10);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Sorting logic
  const handleSort = useCallback(
    (column: TableColumn<T>) => {
      if (!column.sortable) return;

      const field = column.key;
      if (sortField === field) {
        setSortDirection((prev) =>
          prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
        );
        if (sortDirection === "desc") {
          setSortField(null);
        }
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
      setCurrentPage(1);
    },
    [sortField, sortDirection]
  );

  // Filter logic
  const handleFilterChange = useCallback((columnKey: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value || undefined,
    }));
    setCurrentPage(1);
  }, []);

  // Data processing with search, filter, and sort
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue !== undefined && filterValue !== "") {
        result = result.filter((row) => {
          const rowValue = row[key];
          if (typeof filterValue === "string") {
            return rowValue
              ?.toString()
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          }
          return rowValue === filterValue;
        });
      }
    });

    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === bValue) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        const compareResult = aValue < bValue ? -1 : 1;
        return sortDirection === "asc" ? compareResult : -compareResult;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortField, sortDirection, columns]);

  // Pagination logic
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = pagination.enabled
    ? processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : processedData;

  // Export functionality
  const handleExport = useCallback(
    (format: "csv" | "json") => {
      if (format === "csv") {
        const headers = columns.map((col) => col.title).join(",");
        const rows = processedData.map((row) =>
          columns
            .map((col) => {
              const value = row[col.key];
              // Handle values that contain commas or quotes
              const stringValue = value?.toString() || "";
              return stringValue.includes(",") || stringValue.includes('"')
                ? `"${stringValue.replace(/"/g, '""')}"`
                : stringValue;
            })
            .join(",")
        );
        const csvContent = [headers, ...rows].join("\\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title || "data"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "json") {
        const jsonContent = JSON.stringify(processedData, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title || "data"}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [processedData, columns, title]
  );

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Laden van gegevens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            )}
            <p className="text-sm text-gray-500">
              {processedData.length} van {data.length} records
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            {searchable && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Zoeken..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-3 pr-10 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Filters"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </button>

            {/* Export */}
            {exportable && (
              <div className="relative group">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                  <DocumentArrowDownIcon className="h-5 w-5" />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport("csv")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Exporteer als CSV
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Exporteer als JSON
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {columns
                .filter((col) => col.filterable)
                .map((column) => (
                  <div key={String(column.key)} className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {column.title}
                    </label>
                    {column.filter?.type === "select" ? (
                      <select
                        value={filters[String(column.key)] || ""}
                        onChange={(e) =>
                          handleFilterChange(String(column.key), e.target.value)
                        }
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Alle</option>
                        {column.filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={column.filter?.type || "text"}
                        value={filters[String(column.key)] || ""}
                        onChange={(e) =>
                          handleFilterChange(String(column.key), e.target.value)
                        }
                        className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Filter ${column.title.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setFilters({})}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Reset alle filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable
                      ? "cursor-pointer hover:bg-gray-100 select-none"
                      : ""
                  }`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-1">
                    {column.title}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon
                          className={`h-3 w-3 ${
                            sortField === column.key && sortDirection === "asc"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                        <ChevronDownIcon
                          className={`h-3 w-3 -mt-1 ${
                            sortField === column.key && sortDirection === "desc"
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={`${
                    onRowClick ? "cursor-pointer hover:bg-gray-50" : ""
                  } transition-colors`}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render
                        ? column.render(row[column.key], row, index)
                        : row[column.key]?.toString() || "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {paginatedData.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          paginatedData.map((row, index) => (
            <div
              key={index}
              className={`p-4 ${
                onRowClick ? "cursor-pointer active:bg-gray-50" : ""
              } transition-colors`}
              onClick={() => onRowClick?.(row, index)}
            >
              {columns.map((column, colIndex) => (
                <div
                  key={String(column.key)}
                  className={`flex justify-between items-start py-1.5 ${
                    colIndex === 0 ? "pb-2" : ""
                  }`}
                >
                  <span
                    className={`text-xs font-medium text-gray-500 ${
                      colIndex === 0 ? "hidden" : "block"
                    }`}
                  >
                    {column.title}
                  </span>
                  <span
                    className={`text-sm text-gray-900 ${
                      colIndex === 0
                        ? "font-semibold text-base w-full"
                        : "text-right"
                    }`}
                  >
                    {column.render
                      ? column.render(row[column.key], row, index)
                      : row[column.key]?.toString() || "-"}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.enabled && totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Rijen per pagina:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pagination.pageSizeOptions?.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-700">
              {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, processedData.length)} van{" "}
              {processedData.length}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 min-h-[44px] text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Eerste
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 min-h-[44px] text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Vorige
            </button>

            {getPageNumbers().map((pageNum, index) => (
              <button
                key={index}
                onClick={() =>
                  typeof pageNum === "number" ? setCurrentPage(pageNum) : null
                }
                disabled={pageNum === "..."}
                className={`px-3 py-2 min-h-[44px] text-sm border border-gray-300 rounded-md disabled:cursor-default ${
                  pageNum === currentPage
                    ? "bg-blue-600 text-white border-blue-600"
                    : pageNum === "..."
                    ? "cursor-default"
                    : "hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 min-h-[44px] text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Volgende
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 min-h-[44px] text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Laatste
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
