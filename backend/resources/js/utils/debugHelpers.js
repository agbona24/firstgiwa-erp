/**
 * Debug Helpers for FactoryPulse
 * 
 * These utilities help catch common React errors BEFORE they cause blank screens.
 * Import and use these throughout the app for safer rendering.
 */

// Check if we're in development mode
const isDev = import.meta.env.DEV;

/**
 * Safely converts any value to a renderable string.
 * Prevents React Error #31 (Objects are not valid as React children)
 * 
 * @param {any} value - The value to render
 * @param {string} fallback - Fallback if value is null/undefined
 * @returns {string} - A safe string to render
 */
export function safeRender(value, fallback = '-') {
    // Null or undefined
    if (value === null || value === undefined) {
        return fallback;
    }
    
    // Already a string or number - safe to render
    if (typeof value === 'string' || typeof value === 'number') {
        return value;
    }
    
    // Boolean
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    
    // Date object
    if (value instanceof Date) {
        return value.toLocaleDateString();
    }
    
    // Array - THIS CAUSES REACT ERROR #31
    if (Array.isArray(value)) {
        if (isDev) {
            console.warn('⚠️ safeRender: Attempted to render an array:', value);
        }
        return value.map(item => safeRender(item, fallback)).join(', ');
    }
    
    // Object - THIS CAUSES REACT ERROR #31
    if (typeof value === 'object') {
        if (isDev) {
            console.warn('⚠️ safeRender: Attempted to render an object:', value);
            console.warn('   Object keys:', Object.keys(value));
        }
        // Try common field names
        if (value.name) return String(value.name);
        if (value.title) return String(value.title);
        if (value.label) return String(value.label);
        if (value.id) return String(value.id);
        return '[Object]';
    }
    
    // Fallback - convert to string
    return String(value);
}

/**
 * Inspects an object and logs its structure for debugging.
 * Use this when you're not sure what data you're receiving from an API.
 * 
 * @param {any} data - The data to inspect
 * @param {string} label - A label for the log
 */
export function inspectData(data, label = 'Data') {
    if (!isDev) return;
    
    console.group(`🔍 ${label}`);
    console.log('Type:', typeof data);
    console.log('Value:', data);
    
    if (Array.isArray(data)) {
        console.log('Is Array: true');
        console.log('Length:', data.length);
        if (data.length > 0) {
            console.log('First item type:', typeof data[0]);
            console.log('First item:', data[0]);
            if (typeof data[0] === 'object' && data[0] !== null) {
                console.log('First item keys:', Object.keys(data[0]));
            }
        }
    } else if (typeof data === 'object' && data !== null) {
        console.log('Keys:', Object.keys(data));
        Object.entries(data).forEach(([key, value]) => {
            const type = Array.isArray(value) ? 'array' : typeof value;
            const preview = type === 'object' ? `{${Object.keys(value || {}).join(', ')}}` 
                          : type === 'array' ? `[${value.length} items]`
                          : String(value).substring(0, 50);
            console.log(`  ${key}: (${type}) ${preview}`);
        });
    }
    console.groupEnd();
}

/**
 * Safely transforms API data for use in React components.
 * Extracts only primitive values from nested objects.
 * 
 * @param {Object} item - The raw API item
 * @param {Object} mapping - Field mapping { targetField: 'source.path' or (item) => value }
 * @returns {Object} - Safe object with only primitive values
 */
export function transformItem(item, mapping) {
    const result = {};
    
    for (const [targetField, source] of Object.entries(mapping)) {
        if (typeof source === 'function') {
            // Custom extractor function
            result[targetField] = safeRender(source(item));
        } else if (typeof source === 'string') {
            // Dot notation path like 'product.name'
            const value = source.split('.').reduce((obj, key) => obj?.[key], item);
            result[targetField] = safeRender(value);
        } else {
            result[targetField] = safeRender(source);
        }
    }
    
    return result;
}

/**
 * Validates that all values in an object are safe to render in React.
 * Logs warnings for any problematic fields.
 * 
 * @param {Object} obj - The object to validate
 * @param {string} context - Context for error messages
 * @returns {boolean} - True if all fields are safe
 */
export function validateRenderableObject(obj, context = 'Object') {
    if (!isDev) return true;
    
    let isValid = true;
    
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && typeof value === 'object' && !React.isValidElement(value)) {
            console.error(`❌ ${context}.${key} is an object and cannot be rendered directly!`);
            console.error('   Value:', value);
            console.error('   Fix: Use safeRender() or extract the specific property you need.');
            isValid = false;
        }
    }
    
    return isValid;
}

/**
 * Creates a debug log that only appears in development.
 * Color-coded for easy scanning.
 */
export const debugLog = {
    info: (message, ...data) => {
        if (isDev) console.log(`ℹ️ ${message}`, ...data);
    },
    success: (message, ...data) => {
        if (isDev) console.log(`✅ ${message}`, ...data);
    },
    warn: (message, ...data) => {
        if (isDev) console.warn(`⚠️ ${message}`, ...data);
    },
    error: (message, ...data) => {
        if (isDev) console.error(`❌ ${message}`, ...data);
    },
    api: (endpoint, response) => {
        if (isDev) {
            console.group(`🌐 API: ${endpoint}`);
            console.log('Response:', response);
            if (response?.data) {
                inspectData(response.data, 'Response Data');
            }
            console.groupEnd();
        }
    }
};

/**
 * Wraps an async function with error logging.
 * Use this for API calls to always see what went wrong.
 */
export async function withErrorLogging(asyncFn, context = 'Operation') {
    try {
        return await asyncFn();
    } catch (error) {
        console.error(`❌ ${context} failed:`, error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
}

export default {
    safeRender,
    inspectData,
    transformItem,
    validateRenderableObject,
    debugLog,
    withErrorLogging
};
