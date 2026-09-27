// Tiny CSV export helper (no library). Guards against spreadsheet formula injection.
export function downloadCsv(filename, columns, rows) {
    const esc = (v) => {
        let s = v === null || v === undefined ? '' : String(v);
        if (/^[=+\-@]/.test(s))
            s = "'" + s;
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.map(c => esc(c.label)).join(',')];
    rows.forEach(r => lines.push(columns.map(c => esc(r[c.key])).join(',')));
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}
