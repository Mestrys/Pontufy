const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '""';

  let str = String(value).trim();

  if (DANGEROUS_PREFIXES.some((prefix) => str.startsWith(prefix))) {
    str = `'${str}`;
  }

  str = str.replace(/"/g, '""');

  return `"${str}"`;
}

export function buildCsvRow(fields: unknown[]): string {
  return fields.map(sanitizeCsvField).join(',');
}
