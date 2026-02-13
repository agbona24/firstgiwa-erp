/**
 * FactoryPulse Offline Storage Service
 * IndexedDB wrapper for offline data storage and synchronization
 */

const DB_NAME = 'factorypulse-offline';
const DB_VERSION = 1;

// Store names
export const STORES = {
    PRODUCTS: 'products',
    CUSTOMERS: 'customers',
    CATEGORIES: 'categories',
    PENDING_SALES: 'pending_sales',
    PENDING_PAYMENTS: 'pending_payments',
    PENDING_ORDERS: 'pending_orders',
    SYNC_QUEUE: 'sync_queue',
    CACHE_META: 'cache_meta'
};

class OfflineStorage {
    constructor() {
        this.db = null;
        this.isReady = false;
        this.readyPromise = this.init();
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB not supported');
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                console.log('✅ IndexedDB initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Products store
                if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
                    const productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
                    productStore.createIndex('sku', 'sku', { unique: false });
                    productStore.createIndex('category_id', 'category_id', { unique: false });
                    productStore.createIndex('name', 'name', { unique: false });
                }

                // Customers store
                if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
                    const customerStore = db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
                    customerStore.createIndex('phone', 'phone', { unique: false });
                    customerStore.createIndex('name', 'name', { unique: false });
                }

                // Categories store
                if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                    db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
                }

                // Pending sales (offline POS)
                if (!db.objectStoreNames.contains(STORES.PENDING_SALES)) {
                    const salesStore = db.createObjectStore(STORES.PENDING_SALES, { keyPath: 'offlineId', autoIncrement: true });
                    salesStore.createIndex('created_at', 'created_at', { unique: false });
                    salesStore.createIndex('synced', 'synced', { unique: false });
                }

                // Pending payments
                if (!db.objectStoreNames.contains(STORES.PENDING_PAYMENTS)) {
                    const paymentsStore = db.createObjectStore(STORES.PENDING_PAYMENTS, { keyPath: 'offlineId', autoIncrement: true });
                    paymentsStore.createIndex('created_at', 'created_at', { unique: false });
                }

                // Pending orders
                if (!db.objectStoreNames.contains(STORES.PENDING_ORDERS)) {
                    const ordersStore = db.createObjectStore(STORES.PENDING_ORDERS, { keyPath: 'offlineId', autoIncrement: true });
                    ordersStore.createIndex('created_at', 'created_at', { unique: false });
                }

                // Sync queue for generic operations
                if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                    const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('type', 'type', { unique: false });
                    syncStore.createIndex('priority', 'priority', { unique: false });
                }

                // Cache metadata
                if (!db.objectStoreNames.contains(STORES.CACHE_META)) {
                    db.createObjectStore(STORES.CACHE_META, { keyPath: 'key' });
                }

                console.log('📦 IndexedDB stores created');
            };
        });
    }

    /**
     * Ensure DB is ready
     */
    async ensureReady() {
        if (!this.isReady) {
            await this.readyPromise;
        }
        return this.db;
    }

    /**
     * Generic put operation
     */
    async put(storeName, data) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic get operation
     */
    async get(storeName, key) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic getAll operation
     */
    async getAll(storeName) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Generic delete operation
     */
    async delete(storeName, key) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all data in a store
     */
    async clear(storeName) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Bulk put operation
     */
    async bulkPut(storeName, items) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            let completed = 0;
            items.forEach(item => {
                const request = store.put(item);
                request.onsuccess = () => {
                    completed++;
                    if (completed === items.length) {
                        resolve(completed);
                    }
                };
                request.onerror = () => reject(request.error);
            });
            
            if (items.length === 0) {
                resolve(0);
            }
        });
    }

    /**
     * Get items by index
     */
    async getByIndex(storeName, indexName, value) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Count items in a store
     */
    async count(storeName) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ==========================================
    // Product-specific methods
    // ==========================================

    async cacheProducts(products) {
        await this.clear(STORES.PRODUCTS);
        await this.bulkPut(STORES.PRODUCTS, products);
        await this.setCacheMeta('products', { cachedAt: Date.now(), count: products.length });
        console.log(`📦 Cached ${products.length} products`);
    }

    async getProducts() {
        return this.getAll(STORES.PRODUCTS);
    }

    async getProductById(id) {
        return this.get(STORES.PRODUCTS, id);
    }

    async searchProducts(query) {
        const products = await this.getAll(STORES.PRODUCTS);
        const searchLower = query.toLowerCase();
        return products.filter(p => 
            p.name?.toLowerCase().includes(searchLower) ||
            p.sku?.toLowerCase().includes(searchLower)
        );
    }

    // ==========================================
    // Customer-specific methods
    // ==========================================

    async cacheCustomers(customers) {
        await this.clear(STORES.CUSTOMERS);
        await this.bulkPut(STORES.CUSTOMERS, customers);
        await this.setCacheMeta('customers', { cachedAt: Date.now(), count: customers.length });
        console.log(`📦 Cached ${customers.length} customers`);
    }

    async getCustomers() {
        return this.getAll(STORES.CUSTOMERS);
    }

    async searchCustomers(query) {
        const customers = await this.getAll(STORES.CUSTOMERS);
        const searchLower = query.toLowerCase();
        return customers.filter(c => 
            c.name?.toLowerCase().includes(searchLower) ||
            c.phone?.includes(query) ||
            c.email?.toLowerCase().includes(searchLower)
        );
    }

    // ==========================================
    // Category-specific methods
    // ==========================================

    async cacheCategories(categories) {
        await this.clear(STORES.CATEGORIES);
        await this.bulkPut(STORES.CATEGORIES, categories);
        await this.setCacheMeta('categories', { cachedAt: Date.now(), count: categories.length });
    }

    async getCategories() {
        return this.getAll(STORES.CATEGORIES);
    }

    // ==========================================
    // Offline Sales (POS)
    // ==========================================

    async addPendingSale(saleData) {
        const sale = {
            ...saleData,
            created_at: new Date().toISOString(),
            synced: false,
            offlineId: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        await this.put(STORES.PENDING_SALES, sale);
        console.log('💾 Sale saved offline:', sale.offlineId);
        return sale;
    }

    async getPendingSales() {
        return this.getAll(STORES.PENDING_SALES);
    }

    async removePendingSale(offlineId) {
        return this.delete(STORES.PENDING_SALES, offlineId);
    }

    async getPendingSalesCount() {
        return this.count(STORES.PENDING_SALES);
    }

    // ==========================================
    // Offline Payments
    // ==========================================

    async addPendingPayment(paymentData) {
        const payment = {
            ...paymentData,
            created_at: new Date().toISOString(),
            offlineId: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        await this.put(STORES.PENDING_PAYMENTS, payment);
        console.log('💾 Payment saved offline:', payment.offlineId);
        return payment;
    }

    async getPendingPayments() {
        return this.getAll(STORES.PENDING_PAYMENTS);
    }

    async removePendingPayment(offlineId) {
        return this.delete(STORES.PENDING_PAYMENTS, offlineId);
    }

    // ==========================================
    // Sync Queue
    // ==========================================

    async addToSyncQueue(type, data, priority = 5) {
        const item = {
            type,
            data,
            priority,
            created_at: new Date().toISOString(),
            attempts: 0
        };
        return this.put(STORES.SYNC_QUEUE, item);
    }

    async getSyncQueue() {
        const items = await this.getAll(STORES.SYNC_QUEUE);
        // Sort by priority (lower = higher priority)
        return items.sort((a, b) => a.priority - b.priority);
    }

    async removeFromSyncQueue(id) {
        return this.delete(STORES.SYNC_QUEUE, id);
    }

    async clearSyncQueue() {
        return this.clear(STORES.SYNC_QUEUE);
    }

    // ==========================================
    // Cache Metadata
    // ==========================================

    async setCacheMeta(key, value) {
        return this.put(STORES.CACHE_META, { key, ...value });
    }

    async getCacheMeta(key) {
        return this.get(STORES.CACHE_META, key);
    }

    async isCacheStale(key, maxAgeMinutes = 60) {
        const meta = await this.getCacheMeta(key);
        if (!meta || !meta.cachedAt) return true;
        
        const age = Date.now() - meta.cachedAt;
        return age > maxAgeMinutes * 60 * 1000;
    }

    // ==========================================
    // Sync Operations
    // ==========================================

    /**
     * Sync pending sales to server
     */
    async syncPendingSales(apiClient) {
        const pendingSales = await this.getPendingSales();
        const results = { success: 0, failed: 0, errors: [] };

        for (const sale of pendingSales) {
            try {
                await apiClient.post('/api/pos/sales', sale);
                await this.removePendingSale(sale.offlineId);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({ offlineId: sale.offlineId, error: error.message });
            }
        }

        console.log(`🔄 Synced sales: ${results.success} success, ${results.failed} failed`);
        return results;
    }

    /**
     * Sync pending payments to server
     */
    async syncPendingPayments(apiClient) {
        const pendingPayments = await this.getPendingPayments();
        const results = { success: 0, failed: 0, errors: [] };

        for (const payment of pendingPayments) {
            try {
                await apiClient.post('/api/payments', payment);
                await this.removePendingPayment(payment.offlineId);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({ offlineId: payment.offlineId, error: error.message });
            }
        }

        console.log(`🔄 Synced payments: ${results.success} success, ${results.failed} failed`);
        return results;
    }

    /**
     * Full sync - refresh all cached data from server
     */
    async fullSync(apiClient) {
        try {
            // Fetch and cache products
            const productsRes = await apiClient.get('/api/products?per_page=1000');
            if (productsRes.data?.data) {
                await this.cacheProducts(productsRes.data.data);
            }

            // Fetch and cache customers
            const customersRes = await apiClient.get('/api/customers?per_page=1000');
            if (customersRes.data?.data) {
                await this.cacheCustomers(customersRes.data.data);
            }

            // Fetch and cache categories
            const categoriesRes = await apiClient.get('/api/categories');
            if (categoriesRes.data?.data) {
                await this.cacheCategories(categoriesRes.data.data);
            }

            console.log('✅ Full sync completed');
            return { success: true };
        } catch (error) {
            console.error('❌ Full sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if there's pending data to sync
     */
    async hasPendingSync() {
        const salesCount = await this.count(STORES.PENDING_SALES);
        const paymentsCount = await this.count(STORES.PENDING_PAYMENTS);
        const queueCount = await this.count(STORES.SYNC_QUEUE);
        return salesCount + paymentsCount + queueCount > 0;
    }

    /**
     * Get sync status summary
     */
    async getSyncStatus() {
        return {
            pendingSales: await this.count(STORES.PENDING_SALES),
            pendingPayments: await this.count(STORES.PENDING_PAYMENTS),
            syncQueue: await this.count(STORES.SYNC_QUEUE),
            productsCached: await this.count(STORES.PRODUCTS),
            customersCached: await this.count(STORES.CUSTOMERS),
            categoriesCached: await this.count(STORES.CATEGORIES),
            productsCache: await this.getCacheMeta('products'),
            customersCache: await this.getCacheMeta('customers'),
            categoriesCache: await this.getCacheMeta('categories')
        };
    }
}

// Singleton instance
const offlineStorage = new OfflineStorage();

export default offlineStorage;
