import axios from 'axios';

const API_BASE = '/api/v1';

/**
 * Installation API Service
 * Handles application installation, database setup, and environment configuration
 */

/**
 * Check if the application is already installed
 */
export const checkInstallStatus = async () => {
    const response = await axios.get(`${API_BASE}/install/status`);
    return response.data;
};

/**
 * Check system requirements (PHP version, extensions, permissions)
 */
export const checkRequirements = async () => {
    const response = await axios.get(`${API_BASE}/install/requirements`);
    return response.data;
};

/**
 * Test database connection without saving
 */
export const testDatabaseConnection = async (config) => {
    const response = await axios.post(`${API_BASE}/install/test-database`, config);
    return response.data;
};

/**
 * Save database configuration to .env file
 */
export const saveDatabaseConfig = async (config) => {
    const response = await axios.post(`${API_BASE}/install/save-database`, config);
    return response.data;
};

/**
 * Run database migrations
 */
export const runMigrations = async () => {
    const response = await axios.post(`${API_BASE}/install/migrate`);
    return response.data;
};

/**
 * Complete installation and optimize
 */
export const completeInstallation = async () => {
    const response = await axios.post(`${API_BASE}/install/complete`);
    return response.data;
};

export default {
    checkInstallStatus,
    checkRequirements,
    testDatabaseConnection,
    saveDatabaseConfig,
    runMigrations,
    completeInstallation,
};
