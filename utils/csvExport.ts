// @ts-nocheck
export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert('Không có dữ liệu để xuất.');
        return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(header => {
            const cell = row[header] === null || row[header] === undefined ? '' : row[header];
            // Escape quotes and wrap in quotes if contains comma
            const stringCell = String(cell).replace(/"/g, '""');
            return `"${stringCell}"`;
        }).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel UTF-8
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup after download
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 100);
};
