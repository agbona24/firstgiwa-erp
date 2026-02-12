import api from './api';

/**
 * Document API service for PDF generation
 * Uses document template settings to customize output
 */
const documentAPI = {
    /**
     * Template Previews (with sample data)
     */
    previewTemplate: (templateType) => {
        const typeMap = {
            'Invoice': 'invoice',
            'Receipt': 'receipt',
            'Delivery Note': 'delivery-note',
            'Goods Received Note': 'grn',
            'Purchase Order': 'purchase-order',
            'Payslip': 'payslip',
        };
        const endpoint = typeMap[templateType] || templateType.toLowerCase().replace(/\s+/g, '-');
        return api.get(`/documents/template-preview/${endpoint}`, { responseType: 'blob' });
    },

    /**
     * Invoice PDF
     */
    downloadInvoice: (salesOrderId) => {
        return api.get(`/documents/invoice/${salesOrderId}`, { responseType: 'blob' });
    },

    previewInvoice: (salesOrderId) => {
        return api.get(`/documents/invoice/${salesOrderId}/preview`, { responseType: 'blob' });
    },

    /**
     * Receipt PDF
     */
    downloadReceipt: (paymentId) => {
        return api.get(`/documents/receipt/${paymentId}`, { responseType: 'blob' });
    },

    previewReceipt: (paymentId) => {
        return api.get(`/documents/receipt/${paymentId}/preview`, { responseType: 'blob' });
    },

    /**
     * Delivery Note PDF
     */
    downloadDeliveryNote: (salesOrderId) => {
        return api.get(`/documents/delivery-note/${salesOrderId}`, { responseType: 'blob' });
    },

    previewDeliveryNote: (salesOrderId) => {
        return api.get(`/documents/delivery-note/${salesOrderId}/preview`, { responseType: 'blob' });
    },

    /**
     * Goods Received Note (GRN) PDF
     */
    downloadGRN: (purchaseOrderId) => {
        return api.get(`/documents/grn/${purchaseOrderId}`, { responseType: 'blob' });
    },

    previewGRN: (purchaseOrderId) => {
        return api.get(`/documents/grn/${purchaseOrderId}/preview`, { responseType: 'blob' });
    },

    /**
     * Payslip PDF
     */
    downloadPayslip: (payrollRunId, staffId) => {
        return api.get(`/documents/payslip/${payrollRunId}/${staffId}`, { responseType: 'blob' });
    },

    previewPayslip: (payrollRunId, staffId) => {
        return api.get(`/documents/payslip/${payrollRunId}/${staffId}/preview`, { responseType: 'blob' });
    },
};

/**
 * Helper function to open PDF in new tab from blob
 */
export const openPdfInNewTab = async (blobPromise, filename = 'document.pdf') => {
    try {
        const response = await blobPromise;
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up URL after a short delay
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
        console.error('Error opening PDF:', error);
        throw error;
    }
};

/**
 * Helper function to download PDF from blob
 */
export const downloadPdf = async (blobPromise, filename = 'document.pdf') => {
    try {
        const response = await blobPromise;
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        throw error;
    }
};

export default documentAPI;
