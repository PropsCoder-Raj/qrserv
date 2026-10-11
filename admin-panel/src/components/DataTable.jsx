import { useState } from 'react';
import { HiOutlineSearch, HiOutlineChevronUp, HiOutlineChevronDown, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { HiViewGrid, HiViewList } from 'react-icons/hi';

const VIEW_STORAGE_KEY = 'admin-table-view';

export default function DataTable({
  columns,
  data,
  loading,
  // Search
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  // Sort
  sortBy,
  sortOrder,
  onSort,
  // Pagination
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
}) {
  const [view, setView] = useState(() => {
    try {
      return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'cards' ? 'cards' : 'table';
    } catch {
      return 'table';
    }
  });
  const hasPagination = !!onPageChange;
  const hasSearch = !!onSearchChange;

  const from = total > 0 ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const changeView = (nextView) => {
    setView(nextView);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    } catch {
      // Keep the selected view for this page when storage is unavailable.
    }
  };

  const isActionColumn = (column) => /actions?/i.test(column.key) || /actions?/i.test(column.label);
  const titleColumn = columns.find((column) => !isActionColumn(column));
  const detailColumns = columns.filter((column) => column !== titleColumn && !isActionColumn(column));
  const actionColumns = columns.filter(isActionColumn);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-stroke px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        {hasSearch ? (
          <div className="relative w-full max-w-xs">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-stroke py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        ) : <span />}
        <div className="inline-flex self-start rounded-lg border border-stroke p-1 sm:self-auto" role="group" aria-label="Display mode">
          <button
            type="button"
            onClick={() => changeView('table')}
            aria-label="Table view"
            aria-pressed={view === 'table'}
            title="Table view"
            className={`rounded-md p-2 ${view === 'table' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <HiViewList size={18} />
          </button>
          <button
            type="button"
            onClick={() => changeView('cards')}
            aria-label="Card view"
            aria-pressed={view === 'cards'}
            title="Card view"
            className={`rounded-md p-2 ${view === 'cards' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <HiViewGrid size={18} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !data?.length ? (
        <div className="py-12 text-center text-sm text-slate-500">
          No records found.
        </div>
      ) : (
        <>
          {view === 'cards' ? (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((row, i) => (
                <article key={row._id || i} className="flex min-w-0 flex-col rounded-lg border border-stroke bg-white">
                  <div className="border-b border-stroke px-4 py-3">
                    <h3 className="truncate font-semibold text-slate-800">
                      {titleColumn ? (titleColumn.render ? titleColumn.render(row) : row[titleColumn.key]) : `Record ${i + 1}`}
                    </h3>
                  </div>
                  <dl className="grid gap-3 p-4">
                    {detailColumns.map((column) => (
                      <div key={column.key} className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-start gap-3 text-sm">
                        <dt className="text-slate-500">{column.label}</dt>
                        <dd className="min-w-0 break-words text-right text-slate-700">
                          {column.render ? column.render(row) : row[column.key]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {actionColumns.length > 0 && (
                    <div className="mt-auto flex items-center justify-end gap-2 border-t border-stroke px-4 py-2">
                      {actionColumns.map((column) => (
                        <div key={column.key}>
                          {column.render ? column.render(row) : row[column.key]}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stroke bg-slate-50">
                  {columns.map((col) => {
                    const isSortable = col.sortable && onSort;
                    const isActive = sortBy === col.key;
                    return (
                      <th
                        key={col.key}
                        className={`whitespace-nowrap px-4 py-3 font-semibold text-slate-600 ${isSortable ? 'cursor-pointer select-none hover:text-slate-900' : ''}`}
                        onClick={() => {
                          if (isSortable) {
                            onSort(col.key, isActive && sortOrder === 'asc' ? 'desc' : 'asc');
                          }
                        }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {isSortable && (
                            <span className="inline-flex flex-col leading-none">
                              <HiOutlineChevronUp
                                size={10}
                                className={isActive && sortOrder === 'asc' ? 'text-primary' : 'text-slate-300'}
                              />
                              <HiOutlineChevronDown
                                size={10}
                                className={isActive && sortOrder === 'desc' ? 'text-primary' : 'text-slate-300'}
                              />
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={row._id || i}
                    className="border-b border-stroke last:border-0 hover:bg-slate-50"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Pagination */}
          {hasPagination && totalPages > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-stroke px-4 py-3 sm:flex-row">
              <span className="text-sm text-slate-500">
                Showing {from} to {to} of {total} results
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <HiOutlineChevronLeft size={16} />
                </button>
                {getPageNumbers().map((p) => (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`min-w-[32px] rounded-lg px-2.5 py-1 text-sm font-medium ${
                      p === page
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <HiOutlineChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
