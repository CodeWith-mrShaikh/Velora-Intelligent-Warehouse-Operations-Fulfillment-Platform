import { Response } from 'express';

export const generateCsv = (data: any[], columns: { key: string, label: string }[]): string => {
  const header = columns.map(col => `"${col.label.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      const val = row[col.key];
      const strVal = val === null || val === undefined ? '' : String(val);
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(',');
  });
  return [header, ...rows].join('\n');
};

export const streamCsvResponse = (res: Response, data: any[], columns: { key: string, label: string }[], filename: string): void => {
  const csvContent = generateCsv(data, columns);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
};
