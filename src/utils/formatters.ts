import { DateFilterType, DateRange } from '../types';
import * as XLSX from 'xlsx';

export const formatBRL = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return new Intl.NumberFormat('pt-BR').format(value);
};

export const formatPercent = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0,0%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatCPFCNPJ = (value: string): string => {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

export const formatPhone = (value: string): string => {
  if (!value) return '';
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return clean.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
};

export const getDateRange = (filter: DateFilterType, customRange?: DateRange): DateRange => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (filter === 'custom' && customRange) {
    return customRange;
  }

  const start = new Date(now);
  const end = new Date(now);

  switch (filter) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr };
    case 'yesterday': {
      start.setDate(now.getDate() - 1);
      const yestStr = start.toISOString().split('T')[0];
      return { startDate: yestStr, endDate: yestStr };
    }
    case '7days': {
      start.setDate(now.getDate() - 7);
      return { startDate: start.toISOString().split('T')[0], endDate: todayStr };
    }
    case '30days': {
      start.setDate(now.getDate() - 30);
      return { startDate: start.toISOString().split('T')[0], endDate: todayStr };
    }
    case '90days': {
      start.setDate(now.getDate() - 90);
      return { startDate: start.toISOString().split('T')[0], endDate: todayStr };
    }
    case 'thisMonth': {
      start.setDate(1);
      return { startDate: start.toISOString().split('T')[0], endDate: todayStr };
    }
    case 'thisYear': {
      start.setMonth(0, 1);
      return { startDate: start.toISOString().split('T')[0], endDate: todayStr };
    }
    default:
      start.setDate(now.getDate() - 30);
      return { startDate: start.toISOString().split('T')[0], endDate: todayStr };
  }
};

export const exportToCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || !rows.length) return;
  const separator = ';';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = typeof cell === 'object' ? JSON.stringify(cell) : String(cell);
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n|;)/) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator)
      )
      .join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToExcel = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || !rows.length) return;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const triggerPrint = () => {
  window.print();
};
