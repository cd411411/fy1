// src/components/Pagination.tsx (新文件)

import React from 'react';

interface Props {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<Props> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    // 简单的分页逻辑，可以根据需要扩展为更复杂的 (e.g., ...)
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="join mt-8 flex justify-center">
            <button className="join-item btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>«</button>
            {pageNumbers.map(number => (
                <button 
                    key={number} 
                    className={`join-item btn ${currentPage === number ? 'btn-active' : ''}`}
                    onClick={() => onPageChange(number)}
                >
                    {number}
                </button>
            ))}
            <button className="join-item btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>»</button>
        </div>
    );
};