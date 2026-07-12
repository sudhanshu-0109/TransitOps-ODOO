/** Normalize list responses with pagination metadata for the frontend. */
const wrapList = ({ data, total, page, limit }) => {
  const safeLimit = limit || 20;
  const safeTotal = total || 0;
  return {
    data,
    pagination: {
      total: safeTotal,
      page: page || 1,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(safeTotal / safeLimit)),
    },
  };
};

module.exports = { wrapList };
