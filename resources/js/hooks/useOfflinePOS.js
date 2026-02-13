/**
 * Offline POS Hook
 * Provides offline-capable POS operations with automatic sync
 */

import { useState, useEffect, useCallback } from 'react';
import offlineStorage from '../services/OfflineStorage';
import { usePWA } from '../contexts/PWAContext';
import { useToast } from '../contexts/ToastContext';

export function useOfflinePOS() {
    const { isOnline, triggerSync } = usePWA();
    const { showToast } = useToast();
    
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pendingSales, setPendingSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);

    // Load cached data on mount
    useEffect(() => {
        loadCachedData();
    }, []);

    // Refresh data when coming back online
    useEffect(() => {
        if (isOnline) {
            syncPendingData();
        }
    }, [isOnline]);

    const loadCachedData = async () => {
        setIsLoading(true);
        try {
            const [cachedProducts, cachedCustomers, cachedCategories, pending] = await Promise.all([
                offlineStorage.getProducts(),
                offlineStorage.getCustomers(),
                offlineStorage.getCategories(),
                offlineStorage.getPendingSales()
            ]);

            setProducts(cachedProducts);
            setCustomers(cachedCustomers);
            setCategories(cachedCategories);
            setPendingSales(pending);

            const meta = await offlineStorage.getCacheMeta('products');
            if (meta?.cachedAt) {
                setLastSync(new Date(meta.cachedAt));
            }
        } catch (error) {
            console.error('Failed to load cached data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Search products (works offline)
    const searchProducts = useCallback(async (query) => {
        if (!query || query.length < 2) {
            return products;
        }
        return offlineStorage.searchProducts(query);
    }, [products]);

    // Search customers (works offline)
    const searchCustomers = useCallback(async (query) => {
        if (!query || query.length < 2) {
            return customers;
        }
        return offlineStorage.searchCustomers(query);
    }, [customers]);

    // Get products by category
    const getProductsByCategory = useCallback(async (categoryId) => {
        if (!categoryId) return products;
        return products.filter(p => p.category_id === categoryId);
    }, [products]);

    // Create a sale (works offline)
    const createSale = useCallback(async (saleData) => {
        if (isOnline) {
            // Online: Try to create directly via API
            try {
                const response = await fetch('/api/pos/sales', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                    },
                    body: JSON.stringify(saleData)
                });

                if (!response.ok) {
                    throw new Error('Failed to create sale');
                }

                const result = await response.json();
                showToast('Sale completed successfully', 'success');
                return { success: true, data: result, offline: false };
            } catch (error) {
                // If online request fails, save offline
                console.warn('Online sale failed, saving offline:', error);
            }
        }

        // Offline: Save to IndexedDB
        try {
            const offlineSale = await offlineStorage.addPendingSale(saleData);
            setPendingSales(prev => [...prev, offlineSale]);
            
            showToast('Sale saved offline - will sync when online', 'info');
            
            // Try to trigger background sync
            triggerSync();
            
            return { 
                success: true, 
                data: offlineSale, 
                offline: true,
                offlineId: offlineSale.offlineId 
            };
        } catch (error) {
            console.error('Failed to save offline sale:', error);
            showToast('Failed to save sale', 'error');
            return { success: false, error: error.message };
        }
    }, [isOnline, triggerSync, showToast]);

    // Create a payment (works offline)
    const createPayment = useCallback(async (paymentData) => {
        if (isOnline) {
            try {
                const response = await fetch('/api/payments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                    },
                    body: JSON.stringify(paymentData)
                });

                if (!response.ok) {
                    throw new Error('Failed to create payment');
                }

                const result = await response.json();
                showToast('Payment recorded successfully', 'success');
                return { success: true, data: result, offline: false };
            } catch (error) {
                console.warn('Online payment failed, saving offline:', error);
            }
        }

        // Offline: Save to IndexedDB
        try {
            const offlinePayment = await offlineStorage.addPendingPayment(paymentData);
            showToast('Payment saved offline - will sync when online', 'info');
            triggerSync();
            return { 
                success: true, 
                data: offlinePayment, 
                offline: true 
            };
        } catch (error) {
            console.error('Failed to save offline payment:', error);
            showToast('Failed to save payment', 'error');
            return { success: false, error: error.message };
        }
    }, [isOnline, triggerSync, showToast]);

    // Sync all pending data
    const syncPendingData = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        setIsSyncing(true);
        try {
            // Get pending items
            const pendingSalesData = await offlineStorage.getPendingSales();
            const pendingPaymentsData = await offlineStorage.getPendingPayments();

            let syncedSales = 0;
            let syncedPayments = 0;

            // Sync pending sales
            for (const sale of pendingSalesData) {
                try {
                    const response = await fetch('/api/pos/sales', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                        },
                        body: JSON.stringify(sale)
                    });

                    if (response.ok) {
                        await offlineStorage.removePendingSale(sale.offlineId);
                        syncedSales++;
                    }
                } catch (error) {
                    console.error('Failed to sync sale:', sale.offlineId, error);
                }
            }

            // Sync pending payments
            for (const payment of pendingPaymentsData) {
                try {
                    const response = await fetch('/api/payments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                        },
                        body: JSON.stringify(payment)
                    });

                    if (response.ok) {
                        await offlineStorage.removePendingPayment(payment.offlineId);
                        syncedPayments++;
                    }
                } catch (error) {
                    console.error('Failed to sync payment:', payment.offlineId, error);
                }
            }

            // Refresh pending list
            const remainingPending = await offlineStorage.getPendingSales();
            setPendingSales(remainingPending);

            if (syncedSales > 0 || syncedPayments > 0) {
                showToast(`Synced ${syncedSales} sales and ${syncedPayments} payments`, 'success');
            }

            // Refresh cache from server
            await refreshFromServer();

        } catch (error) {
            console.error('Sync failed:', error);
            showToast('Sync failed - will retry later', 'error');
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing, showToast]);

    // Refresh cache from server
    const refreshFromServer = useCallback(async () => {
        if (!isOnline) {
            showToast('Cannot refresh while offline', 'warning');
            return false;
        }

        setIsLoading(true);
        try {
            // Fetch fresh data from server
            const [productsRes, customersRes, categoriesRes] = await Promise.all([
                fetch('/api/products?per_page=1000'),
                fetch('/api/customers?per_page=1000'),
                fetch('/api/categories')
            ]);

            const productsData = await productsRes.json();
            const customersData = await customersRes.json();
            const categoriesData = await categoriesRes.json();

            // Cache to IndexedDB
            if (productsData.data) {
                await offlineStorage.cacheProducts(productsData.data);
                setProducts(productsData.data);
            }

            if (customersData.data) {
                await offlineStorage.cacheCustomers(customersData.data);
                setCustomers(customersData.data);
            }

            if (categoriesData.data) {
                await offlineStorage.cacheCategories(categoriesData.data);
                setCategories(categoriesData.data);
            }

            setLastSync(new Date());
            showToast('Data refreshed and cached for offline use', 'success');
            return true;
        } catch (error) {
            console.error('Failed to refresh from server:', error);
            showToast('Failed to refresh data', 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isOnline, showToast]);

    // Get receipt for offline sale
    const getOfflineReceipt = useCallback((offlineId) => {
        return pendingSales.find(s => s.offlineId === offlineId);
    }, [pendingSales]);

    // Cancel pending offline sale
    const cancelPendingSale = useCallback(async (offlineId) => {
        try {
            await offlineStorage.removePendingSale(offlineId);
            setPendingSales(prev => prev.filter(s => s.offlineId !== offlineId));
            showToast('Pending sale cancelled', 'info');
            return true;
        } catch (error) {
            console.error('Failed to cancel pending sale:', error);
            return false;
        }
    }, [showToast]);

    return {
        // Data
        products,
        customers,
        categories,
        pendingSales,
        
        // State
        isLoading,
        isSyncing,
        isOnline,
        lastSync,
        hasPendingSync: pendingSales.length > 0,
        
        // Actions
        searchProducts,
        searchCustomers,
        getProductsByCategory,
        createSale,
        createPayment,
        syncPendingData,
        refreshFromServer,
        getOfflineReceipt,
        cancelPendingSale,
        loadCachedData
    };
}

export default useOfflinePOS;
