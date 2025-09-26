import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  Typography,
  Box,
  TablePagination,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Edit3,
  Trash2,
  Eye,
} from 'lucide-react';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
}

export interface Action<T = any> {
  icon: React.ReactNode;
  label: string;
  onClick: (row: T) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
}

interface DataTableProps<T = any> {
  title: string;
  data: T[];
  columns: Column<T>[];
  actions?: Action<T>[];
  loading?: boolean;
  error?: string | null;
  // Paginación
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  // Ordenamiento
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  // Acciones rápidas
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export default function DataTable<T extends { id: number | string }>({
  title,
  data,
  columns,
  actions = [],
  loading = false,
  error = null,
  page = 0,
  rowsPerPage = 10,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  sortField,
  sortDirection = 'asc',
  onSort,
  onView,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  const handleSort = (field: string) => {
    if (!onSort) return;

    const newDirection =
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, newDirection);
  };

  const defaultActions: Action<T>[] = [];

  if (onView) {
    defaultActions.push({
      icon: <Eye size={16} />,
      label: 'Ver',
      onClick: onView,
      color: 'info',
    });
  }

  if (onEdit) {
    defaultActions.push({
      icon: <Edit3 size={16} />,
      label: 'Editar',
      onClick: onEdit,
      color: 'primary',
    });
  }

  if (onDelete) {
    defaultActions.push({
      icon: <Trash2 size={16} />,
      label: 'Eliminar',
      onClick: onDelete,
      color: 'error',
    });
  }

  const allActions = [...defaultActions, ...actions];

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <Box p={2}>
        <Typography variant="h5" gutterBottom>
          {title}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align || 'left'}
                    width={column.width}
                  >
                    {column.sortable && onSort ? (
                      <TableSortLabel
                        active={sortField === column.key}
                        direction={sortField === column.key ? sortDirection : 'asc'}
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
                {allActions.length > 0 && (
                  <TableCell align="center">Acciones</TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map((row, index) => (
                <TableRow key={row.id || index}>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align || 'left'}
                    >
                      {column.render
                        ? column.render(row[column.key as keyof T], row)
                        : String(row[column.key as keyof T] || '')
                      }
                    </TableCell>
                  ))}

                  {allActions.length > 0 && (
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={0.5}>
                        {allActions.map((action, actionIndex) => (
                          <IconButton
                            key={actionIndex}
                            size="small"
                            color={action.color || 'primary'}
                            onClick={() => action.onClick(row)}
                            title={action.label}
                          >
                            {action.icon}
                          </IconButton>
                        ))}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {data.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (allActions.length > 0 ? 1 : 0)}
                    align="center"
                  >
                    <Typography variant="body2" color="textSecondary">
                      No hay datos para mostrar
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {(onPageChange || onRowsPerPageChange) && (
          <TablePagination
            component="div"
            count={totalCount || data.length}
            page={page}
            onPageChange={(_, newPage) => onPageChange?.(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) =>
              onRowsPerPageChange?.(parseInt(e.target.value, 10))
            }
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
            }
          />
        )}
      </Box>
    </Paper>
  );
}

// Utilidades para renderizado común
export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatStatus = (status: string, colorMap?: Record<string, string>) => {
  const statusLabels: Record<string, string> = {
    DRAFT: 'Borrador',
    CONFIRMED: 'Confirmado',
    CANCELLED: 'Cancelado',
    COMPLETED: 'Completado',
  };

  const statusColors: Record<string, any> = {
    DRAFT: 'warning',
    CONFIRMED: 'success',
    CANCELLED: 'error',
    COMPLETED: 'info',
    ...colorMap,
  };

  return (
    <Chip
      label={statusLabels[status] || status}
      color={statusColors[status] || 'default'}
      size="small"
    />
  );
};