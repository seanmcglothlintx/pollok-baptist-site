// Minimal RFC 4180 CSV parser for the Google Sheets CSV export.
// Handles quoted fields, embedded commas and newlines, doubled quotes, CRLF.

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\r") {
      i += 1;
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

// First row is the header. Headers are trimmed; missing cells become "".
export function csvToObjects(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return [];
  }
  const headers = rows[0].map((h) => h.trim());
  const objects = [];
  for (const cells of rows.slice(1)) {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = index < cells.length ? cells[index] : "";
    });
    objects.push(obj);
  }
  return objects;
}
