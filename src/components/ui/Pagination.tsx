'use client';

import React from 'react';
import { Button } from './Button';

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    showItemsPerPage?: boolean;
    itemsPerPageOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    showItemsPerPage = true,
    itemsPerPageOptions = [10, 20, 50, 100],
}) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 7;

        if (totalPages <= maxVisible) {
            // Show all pages if total is less than max visible
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage <= 3) {
                // Near the beginning
                for (let i = 2; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('ellipsis');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Near the end
                pages.push('ellipsis');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // In the middle
                pages.push('ellipsis');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('ellipsis');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (totalPages <= 1 && !showItemsPerPage) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg border border-gray-300 p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Items Per Page Selector */}
            {showItemsPerPage && onItemsPerPageChange && (
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">
                        Items per page:
                    </label>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {itemsPerPageOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Page Info */}
            <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing <span className="font-semibold text-gray-900">{startItem}</span> to{' '}
                <span className="font-semibold text-gray-900">{endItem}</span> of{' '}
                <span className="font-semibold text-gray-900">{totalItems}</span> participants
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start w-full sm:w-auto">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="min-w-[56px] sm:min-w-[80px]"
                    >
                        First
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="min-w-[56px] sm:min-w-[80px]"
                    >
                        Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 overflow-x-auto max-w-full sm:max-w-none scrollbar-thin scrollbar-thumb-gray-200">
                        {(typeof window !== 'undefined' && window.innerWidth < 640
                            ? (() => {
                                const pages: (number | string)[] = [];
                                if (totalPages <= 3) {
                                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                                } else {
                                    if (currentPage > 2) pages.push(1);
                                    if (currentPage > 3) pages.push('ellipsis');

                                    if (currentPage === 1) {
                                        pages.push(1, 2, 3);
                                    } else if (currentPage === totalPages) {
                                        pages.push(totalPages - 2, totalPages - 1, totalPages);
                                    } else {
                                        pages.push(currentPage - 1, currentPage, currentPage + 1);
                                    }

                                    if (currentPage < totalPages - 2) pages.push('ellipsis');
                                    if (currentPage < totalPages - 1) pages.push(totalPages);
                                }
                                return pages;
                            })()
                            : getPageNumbers()
                        ).map((page, index) => {
                            if (page === 'ellipsis') {
                                return (
                                    <span
                                        key={`ellipsis-${index}`}
                                        className="px-2 text-gray-500"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            const pageNumber = page as number;
                            return (
                                <button
                                    key={pageNumber}
                                    onClick={() => onPageChange(pageNumber)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors min-w-[40px] ${currentPage === pageNumber
                                        ? 'bg-blue-600 text-white font-medium'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    style={{
                                        minWidth: '40px',
                                    }}
                                >
                                    {pageNumber}
                                </button>
                            );
                        })}
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="min-w-[56px] sm:min-w-[80px]"
                    >
                        Next
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="min-w-[56px] sm:min-w-[80px]"
                    >
                        Last
                    </Button>
                </div>
            )}
        </div>
    );
};

