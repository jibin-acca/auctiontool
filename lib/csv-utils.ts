'use client';

export interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface ImportResult {
  success: number;
  errors: { row: number; message: string }[];
  duplicates: number;
  total: number;
}

export function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i]);
    const data: Record<string, string> = {};
    headers.forEach((h, idx) => {
      data[h] = (cells[idx] ?? '').trim();
    });
    rows.push({ rowNumber: i + 1, data });
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const csv = [
    headers,
    ...rows,
  ].map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTemplate(filename: string, headers: string[]) {
  downloadCSV(filename, headers, []);
}
