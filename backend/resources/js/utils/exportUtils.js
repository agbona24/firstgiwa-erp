/**
 * Export data to CSV and trigger download
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Array of column definitions with key and label
 * @param {string} filename - Name of the file (without extension)
 */
export function exportToCSV(data, columns, filename = 'export') {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Create headers
    const headers = columns.map(col => col.label || col.header || col.key);
    
    // Create rows
    const rows = data.map(row => {
        return columns.map(col => {
            let value = row[col.key];
            
            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }
            
            // Handle objects (convert to string)
            if (typeof value === 'object') {
                if (value.name) return value.name;
                return JSON.stringify(value);
            }
            
            // Handle booleans
            if (typeof value === 'boolean') {
                return value ? 'Yes' : 'No';
            }
            
            // Handle numbers
            if (typeof value === 'number') {
                return value.toString();
            }
            
            // Escape quotes and wrap in quotes if contains comma or quotes
            value = String(value);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
        }).join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export selected items from a list
 * @param {Array} selectedIndices - Array of selected row indices
 * @param {Array} data - Full data array
 * @param {Array} columns - Column definitions
 * @param {string} filename - Export filename
 */
export function exportSelectedToCSV(selectedIndices, data, columns, filename = 'export') {
    const selectedData = selectedIndices.map(idx => data[idx]).filter(Boolean);
    exportToCSV(selectedData, columns, filename);
}
