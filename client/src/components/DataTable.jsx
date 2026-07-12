import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

/**
 * DataTable — generic, reusable table with pagination.
 *
 * Accepts either:
 *   (A) pagination object: { page, totalPages, setPage, limit, setLimit, prevPage, nextPage }
 *   (B) flat props: page, totalPages, onPageChange
 */
const DataTable = ({
  columns,
  data,
  isLoading,
  // (A) pagination object
  pagination,
  // (B) flat props
  page: pageProp,
  totalPages: totalPagesProp,
  onPageChange,
  // sort
  onSort,
  sortConfig,
  emptyMessage = 'No data available',
}) => {
  // Normalize pagination interface
  const currentPage = pagination?.page ?? pageProp ?? 1;
  const numTotalPages = pagination?.totalPages ?? totalPagesProp ?? 1;
  const goToPage = (p) => {
    if (pagination?.setPage) pagination.setPage(p);
    else if (onPageChange) onPageChange(p);
  };
  const limit = pagination?.limit;
  const setLimit = pagination?.setLimit;
  const prevPage = () => goToPage(Math.max(1, currentPage - 1));
  const nextPage = () => goToPage(Math.min(numTotalPages, currentPage + 1));

  const showPagination = numTotalPages > 1 || (data?.length > 0 && currentPage > 1);

  return (
    <div className="space-y-4">
      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.sortable ? 'cursor-pointer select-none' : ''}
                  onClick={() => col.sortable && onSort && onSort(col.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    {col.sortable && sortConfig?.key === col.key && (
                      sortConfig.direction === 'asc'
                        ? <ArrowUp className="w-3 h-3" />
                        : <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : !data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={row.id || i} className="hover:bg-muted/30 transition-colors">
                  {columns.map((col) => (
                    <TableCell key={`${row.id || i}-${col.key}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {showPagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {limit && setLimit && (
              <>
                <p>Rows per page</p>
                <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={pageSize.toString()}>{pageSize}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium text-muted-foreground">
              Page {currentPage} of {numTotalPages}
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="outline" className="hidden w-8 h-8 p-0 lg:flex" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-8 h-8 p-0" onClick={prevPage} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="w-8 h-8 p-0" onClick={nextPage} disabled={currentPage >= numTotalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" className="hidden w-8 h-8 p-0 lg:flex" onClick={() => goToPage(numTotalPages)} disabled={currentPage >= numTotalPages}>
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { DataTable };
export default DataTable;
