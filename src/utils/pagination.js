const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePaginationParams(query) {
  let page = parseInt(query.page, 10) || DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;

  // Ensure positive values
  page = Math.max(1, page);
  limit = Math.max(1, Math.min(limit, MAX_LIMIT));

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

function buildPaginationMeta(totalItems, page, limit) {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
}

function applyPagination(query) {
  const { page, limit, offset } = parsePaginationParams(query);

  return {
    limit,
    offset,
    paginationParams: { page, limit },
  };
}
function formatPaginatedResponse(result, paginationParams) {
  const { count, rows } = result;
  const { page, limit } = paginationParams;

  return {
    data: rows,
    pagination: buildPaginationMeta(count, page, limit),
  };
}

module.exports = {
  parsePaginationParams,
  buildPaginationMeta,
  applyPagination,
  formatPaginatedResponse,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
