import axios from 'axios';

const API_BASE = '/api/v1';

/**
 * Setup API Service
 * Handles initial system setup and installation wizard
 */

/**
 * Check if initial setup has been completed
 * @returns {Promise<{isComplete: boolean, hasTenant: boolean, hasAdmin: boolean}>}
 */
export const checkSetupStatus = async () => {
    const response = await axios.get(`${API_BASE}/setup/status`);
    return response.data;
};

/**
 * Complete the initial setup wizard
 * @param {Object} setupData - Setup configuration data
 * @param {Object} setupData.company - Company profile data
 * @param {string} setupData.company.name - Company name
 * @param {string} setupData.company.email - Company email
 * @param {string} setupData.company.phone - Company phone
 * @param {string} setupData.company.address - Company address
 * @param {string} setupData.company.city - Company city
 * @param {string} setupData.company.state - Company state
 * @param {string} setupData.company.country - Company country
 * @param {string} setupData.company.tax_id - Tax ID / Registration number
 * @param {Object} setupData.business - Business configuration
 * @param {string} setupData.business.industry - Industry type
 * @param {string} setupData.business.currency - Default currency
 * @param {string} setupData.business.fiscal_year_start - Fiscal year start month
 * @param {Array} setupData.warehouses - Warehouse locations
 * @param {Array} setupData.departments - Departments
 * @param {Object} setupData.products - Products/inventory setup
 * @param {Array} setupData.products.categories - Product categories
 * @param {Array} setupData.products.units - Units of measure
 * @param {Object} setupData.admin - Admin user account
 * @param {string} setupData.admin.name - Admin name
 * @param {string} setupData.admin.email - Admin email
 * @param {string} setupData.admin.password - Admin password
 * @returns {Promise<{success: boolean, token: string, user: Object, message: string}>}
 */
export const completeSetup = async (setupData) => {
    const response = await axios.post(`${API_BASE}/setup/complete`, setupData);
    return response.data;
};

/**
 * Reset the application to factory default (Super Admin only).
 * Wipes all tenant data and returns the system to the setup state.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const resetSetup = async () => {
    const token = localStorage.getItem('auth_token');
    const response = await axios.post(
        `${API_BASE}/setup/reset`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    return response.data;
};

/**
 * Get the industry template registry (categories and subcategories)
 * @returns {Promise<Object>}
 */
export const getIndustryRegistry = async () => {
    const response = await axios.get(`${API_BASE}/industry-templates`);
    return response.data;
};

/**
 * Get a specific industry template preview for the wizard
 * @param {string} key - Template key (e.g., 'feed_mill')
 * @returns {Promise<Object>}
 */
export const getIndustryTemplate = async (key) => {
    const response = await axios.get(`${API_BASE}/industry-templates/${key}`);
    return response.data;
};

/**
 * Helper to transform wizard form data to API format
 * @param {Object} wizardData - Data from SetupWizard component
 * @returns {Object} - Formatted data for API
 */
export const formatWizardDataForAPI = (wizardData) => {
    return {
        company: {
            name: wizardData.companyName || '',
            email: wizardData.companyEmail || '',
            phone: wizardData.companyPhone || '',
            address: wizardData.address || '',
            city: wizardData.city || '',
            state: wizardData.state || '',
            country: wizardData.country || 'Nigeria',
            tax_id: wizardData.taxId || '',
            logo: wizardData.logo || null,
        },
        business: {
            industry: wizardData.industry || 'retail',
            currency: wizardData.currency || 'NGN',
            fiscal_year_start: wizardData.fiscalYearStart || 'January',
            enable_multi_warehouse: wizardData.multiWarehouse || false,
            enable_multi_branch: wizardData.multiBranch || false,
            enable_production: wizardData.enableProduction || false,
        },
        industry_category: wizardData.industryCategory || null,
        industry_subcategory: wizardData.industrySubcategory || null,
        warehouses: wizardData.warehouses || [],
        departments: wizardData.departments || [],
        products: {
            categories: wizardData.categories || [],
            units: wizardData.units || [],
        },
        admin: {
            name: wizardData.adminName || '',
            email: wizardData.adminEmail || '',
            password: wizardData.adminPassword || '',
        },
    };
};

export default {
    checkSetupStatus,
    completeSetup,
    resetSetup,
    getIndustryRegistry,
    getIndustryTemplate,
    formatWizardDataForAPI,
};
