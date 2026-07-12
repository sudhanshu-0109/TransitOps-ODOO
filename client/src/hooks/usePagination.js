import { useState, useEffect } from 'react';

export const usePagination = ({ total = 0, initialPage = 1, initialLimit = 20 }) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const nextPage = () => setPage(p => Math.min(totalPages, p + 1));
  const prevPage = () => setPage(p => Math.max(1, p - 1));
  
  // Ensure current page is valid when total or limit changes
  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages);
  }, [page, totalPages]);

  return { page, limit, setPage, setLimit, totalPages, nextPage, prevPage };
};
