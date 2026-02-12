import { useState, useMemo } from 'react';
import EmptyState from './EmptyState';
import Button from './Button';

export default function DataTable({
    columns,
    data,
    actions,
    selectable = false,
    onRowClick,
    bulkActions,
    emptyMessage = 'No data available',
    emptyIcon,
    isLoading = false,
    pageSize: initialPageSize = 20,
    enablePagination = true,
    enableSorting = true
}) {
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Sorting logic
    const sortedData = useMemo(() => {
        if (!enableSorting || !sortConfig.key) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (typeof aValue === 'string') {
                const comparison = aValue.localeCompare(bValue);
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig, enableSorting]);

    // Pagination logic
    const paginatedData = useMemo(() => {
        if (!enablePagination) return sortedData;
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize, enablePagination]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    const handleSort = (key) => {
        if (!enableSorting) return;

        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedRows(new Set(paginatedData.map((_, idx) => idx)));
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleSelectRow = (index, checked) => {
        const newSelected = new Set(selectedRows);
        if (checked) {
            newSelected.add(index);
        } else {
            newSelected.delete(index);
        }
        setSelectedRows(newSelected);
    };

    const allSelected = paginatedData.length > 0 && selectedRows.size === paginatedData.length;
    const someSelected = selectedRows.size > 0 && selectedRows.size < paginatedData.length;

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-gradient-to-r from-blue-900 to-blue-800">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th key={idx} className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        {col.label || col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {[...Array(5)].map((_, idx) => (
                                <tr key={idx} className="animate-pulse">
                                    {columns.map((_, colIdx) => (
                                        <td key={colIdx} className="px-6 py-4">
                                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
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

    // Empty state
    if (!data || data.length === 0) {
        return <EmptyState message={emptyMessage} icon={emptyIcon} />;
    }

    return (
        <div className="space-y-4">
            {/* Bulk Actions Toolbar */}
            {selectable && selectedRows.size > 0 && bulkActions && (
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                        {selectedRows.size} {selectedRows.size === 1 ? 'item' : 'items'} selected
                    </span>
                    <div className="flex gap-2">
                        {bulkActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => action.onClick(Array.from(selectedRows))}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-gradient-to-r from-blue-900 to-blue-800">
                            <tr>
                                {selectable && (
                                    <th className="px-6 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            ref={input => {
                                                if (input) input.indeterminate = someSelected;
                                            }}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                )}
                                {columns.map((column, idx) => (
                                    <th
                                        key={idx}
                                        onClick={() => column.sortable !== false && handleSort(column.key)}
                                        className={`px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider ${
                                            column.sortable !== false && enableSorting ? 'cursor-pointer select-none hover:bg-blue-800' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.label || column.header}
                                            {column.sortable !== false && enableSorting && (
                                                <span className="text-blue-300">
                                                    {sortConfig.key === column.key ? (
                                                        sortConfig.direction === 'asc' ? '↑' : '↓'
                                                    ) : '↕'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                                {actions && actions.length > 0 && (
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {paginatedData.map((row, rowIdx) => (
                                <tr
                                    key={rowIdx}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={`${
                                        onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-slate-50'
                                    } transition ${row.critical ? 'bg-red-50' : ''}`}
                                >
                                    {selectable && (
                                        <td className="px-6 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.has(rowIdx)}
                                                onChange={(e) => handleSelectRow(rowIdx, e.target.checked)}
                                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                    )}
                                    {columns.map((column, colIdx) => (
                                        <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            {column.render
                                                ? column.render(row[column.key], row)
                                                : row[column.key]}
                                        </td>
                                    ))}
                                    {actions && actions.length > 0 && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-2">
                                                {actions.map((action, actionIdx) => {
                                                    // Check if action should be shown for this row
                                                    if (action.show && typeof action.show === 'function' && !action.show(row)) {
                                                        return null;
                                                    }
                                                    return (
                                                        <Button
                                                            key={actionIdx}
                                                            size="sm"
                                                            variant={typeof action.variant === 'function' ? action.variant(row) : (action.variant || 'ghost')}
                                                            onClick={() => action.onClick(row)}
                                                        >
                                                            {typeof action.label === 'function' ? action.label(row) : action.label}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {enablePagination && totalPages > 1 && (
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-700">
                                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
                            </span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={10}>10 per page</option>
                                <option value={20}>20 per page</option>
                                <option value={50}>50 per page</option>
                                <option value={100}>100 per page</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                First
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-1 text-sm text-slate-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
