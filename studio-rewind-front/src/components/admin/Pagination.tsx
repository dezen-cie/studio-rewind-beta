// src/components/admin/AdminPagination.tsx
import React from 'react';

type AdminPaginationProps = {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

const AdminPagination: React.FC<AdminPaginationProps> = ({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
}) => {
  const pageCount = Math.ceil(totalItems / pageSize);

  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav
      className="pagination is-centered"
      role="navigation"
      aria-label="pagination"
      style={{ marginTop: '1rem' }}
    >
      <ul className="pagination-list">
        {pages.map((page) => (
          <li key={page}>
            <button
              type="button"
              className={
                'pagination-link' + (page === currentPage ? ' is-current' : '')
              }
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default AdminPagination;
