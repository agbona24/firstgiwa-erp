import { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../hooks/useConfirm';
import posAPI from '../../services/posAPI';
import { taxesAPI, bankAccountsAPI } from '../../services/settingsAPI';
import OpenRegisterModal from './OpenRegisterModal';
import CloseRegisterModal from './CloseRegisterModal';

export default function POSTerminal() {
    // Register Session State
    const [session, setSession] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [showOpenRegisterModal, setShowOpenRegisterModal] = useState(false);
    const [showCloseRegisterModal, setShowCloseRegisterModal] = useState(false);

    const [cart, setCart] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showQtyModal, setShowQtyModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [discount, setDiscount] = useState(0);
    const [lastReceipt, setLastReceipt] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [lastTicket, setLastTicket] = useState(null);
    const [pendingTickets, setPendingTickets] = useState([]);
    const [showPendingTickets, setShowPendingTickets] = useState(false);
    
    // API data
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [taxes, setTaxes] = useState([]);
    const [selectedTaxId, setSelectedTaxId] = useState('');
    const [bankAccounts, setBankAccounts] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState('');
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);
    
    // Customer search
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    const toast = useToast();
    const confirm = useConfirm();

    // Check for active session on mount
    useEffect(() => {
        checkActiveSession();
    }, []);

    const checkActiveSession = async () => {
        try {
            setSessionLoading(true);
            const response = await posAPI.getActiveSession();
            if (response.success && response.has_active_session) {
                setSession(response.data);
                // Load POS data after session confirmed
                fetchInitialData();
            } else {
                setSession(null);
                setShowOpenRegisterModal(true);
            }
        } catch (error) {
            console.error('Error checking session:', error);
            setSession(null);
            setShowOpenRegisterModal(true);
        } finally {
            setSessionLoading(false);
        }
    };

    const handleRegisterOpened = (newSession) => {
        setSession(newSession);
        setShowOpenRegisterModal(false);
        fetchInitialData();
        toast.success(`Shift ${newSession.session_number} started`);
    };

    const handleRegisterClosed = () => {
        setSession(null);
        setShowCloseRegisterModal(false);
        setShowOpenRegisterModal(true);
        // Clear cart and state
        setCart([]);
        setSelectedCustomer(null);
    };

    // Fetch data on mount
    useEffect(() => {
        if (session) {
            fetchInitialData();
        }
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [productsRes, customersRes, categoriesRes, ticketsRes, taxesRes, bankAccountsRes] = await Promise.all([
                posAPI.getProducts(),
                posAPI.getCustomers(),
                posAPI.getCategories(),
                posAPI.getTickets(),
                taxesAPI.list(),
                bankAccountsAPI.list()
            ]);
            
            setProducts(productsRes.data || []);
            setCustomers(customersRes.data || []);
            setCategories(categoriesRes.data || []);
            setPendingTickets(ticketsRes.data || []);
            
            // Parse taxes from API response
            const taxData = taxesRes.data?.data?.taxes || taxesRes.data?.taxes || taxesRes.data?.data || [];
            setTaxes(Array.isArray(taxData) ? taxData : []);
            
            // Don't set default tax - start with no tax selected
            // User should explicitly select a tax if needed
            
            // Parse bank accounts from API response
            const bankData = bankAccountsRes.data?.data?.bank_accounts || bankAccountsRes.data?.bank_accounts || bankAccountsRes.data?.data || bankAccountsRes.data || [];
            setBankAccounts(Array.isArray(bankData) ? bankData : []);
            
            // Set default walk-in customer
            const walkIn = customersRes.data?.find(c => c.customer_type === 'walk-in');
            if (walkIn) setSelectedCustomer(walkIn);
        } catch (error) {
            console.error('Error fetching POS data:', error);
            toast.error('Failed to load POS data');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (categoryId = null, search = null) => {
        try {
            const params = {};
            if (categoryId && categoryId !== 'all') params.category_id = categoryId;
            if (search) params.search = search;
            
            const response = await posAPI.getProducts(params);
            setProducts(response.data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchTickets = async () => {
        try {
            const response = await posAPI.getTickets();
            setPendingTickets(response.data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };

    // Get selected tax info
    const getSelectedTax = () => {
        if (!selectedTaxId) return null;
        const taxList = Array.isArray(taxes) ? taxes : [];
        return taxList.find(t => t.id === Number(selectedTaxId));
    };

    // Get tax rate (0 if no tax selected)
    const getTaxRate = () => {
        const selectedTax = getSelectedTax();
        if (!selectedTax) return 0;
        const rate = parseFloat(selectedTax.rate);
        // Rate might be stored as percentage (e.g., 7.5) or decimal (e.g., 0.075)
        return rate > 1 ? rate / 100 : rate;
    };

    // Get tax display name
    const getTaxDisplayName = () => {
        const selectedTax = getSelectedTax();
        if (!selectedTax) return 'No Tax';
        const rate = parseFloat(selectedTax.rate);
        const displayRate = rate > 1 ? rate : rate * 100;
        return `${selectedTax.name} (${displayRate}%)`;
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const taxRate = getTaxRate();
    const tax = (subtotal - discountAmount) * taxRate;
    const total = subtotal - discountAmount + tax;

    // Filter products (client-side filtering for quick response)
    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory || product.category_id == selectedCategory;
        const matchesSearch = searchQuery === '' || product.name.toLowerCase().includes(searchQuery.toLowerCase()) || (product.barcode && product.barcode.includes(searchQuery));
        return matchesCategory && matchesSearch;
    });

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 3) {
                fetchProducts(selectedCategory, searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            // F1 - Complete Sale
            if (e.key === 'F1') {
                e.preventDefault();
                if (cart.length > 0) handleCompleteSale();
            }
            // F2 - Clear Cart
            if (e.key === 'F2') {
                e.preventDefault();
                if (cart.length > 0) handleClearCart();
            }
            // F3 - Focus Search
            if (e.key === 'F3') {
                e.preventDefault();
                document.getElementById('pos-search')?.focus();
            }
            // F4 - Save as Ticket
            if (e.key === 'F4') {
                e.preventDefault();
                if (cart.length > 0) handleSaveTicket();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [cart]);

    const handleAddToCart = (product) => {
        if (product.stock === 0) {
            toast.error('Product is out of stock');
            return;
        }

        // Check if product is already in cart
        const existing = cart.find(item => item.id === product.id);
        const currentQty = existing ? existing.quantity : 0;

        // Check stock availability
        if (currentQty + 1 > product.stock) {
            toast.error(`Only ${product.stock} units available in stock`);
            return;
        }

        if (existing) {
            // Increment quantity
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
            toast.success(`Added another ${product.name}`);
        } else {
            // Add new item with quantity 1
            setCart([...cart, { ...product, quantity: 1 }]);
            toast.success(`Added ${product.name} to cart`);
        }
    };

    const confirmAddToCart = () => {
        const existing = cart.find(item => item.id === selectedProduct.id);
        const currentQty = existing ? existing.quantity : 0;

        if (currentQty + quantity > selectedProduct.stock) {
            toast.error(`Only ${selectedProduct.stock} units available in stock`);
            return;
        }

        if (existing) {
            setCart(cart.map(item =>
                item.id === selectedProduct.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            ));
            toast.success(`Updated ${selectedProduct.name} quantity`);
        } else {
            setCart([...cart, { ...selectedProduct, quantity }]);
            toast.success(`Added ${selectedProduct.name} to cart`);
        }

        setShowQtyModal(false);
        setSelectedProduct(null);
        setQuantity(1);
    };

    const updateCartItemQty = (productId, newQty) => {
        const product = products.find(p => p.id === productId);

        if (newQty > product.stock) {
            toast.error(`Only ${product.stock} units available`);
            return;
        }

        if (newQty <= 0) {
            handleRemoveFromCart(productId);
            return;
        }

        setCart(cart.map(item =>
            item.id === productId ? { ...item, quantity: newQty } : item
        ));
    };

    const handleRemoveFromCart = async (productId) => {
        const confirmed = await confirm({
            title: 'Remove Item',
            message: 'Are you sure you want to remove this item from the cart?',
            confirmText: 'Remove',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (confirmed) {
            setCart(cart.filter(item => item.id !== productId));
            toast.success('Item removed from cart');
        }
    };

    const handleClearCart = async () => {
        const confirmed = await confirm({
            title: 'Clear Cart',
            message: 'Are you sure you want to clear all items from the cart?',
            confirmText: 'Clear All',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (confirmed) {
            setCart([]);
            toast.success('Cart cleared');
        }
    };

    const handleCompleteSale = () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        // Prefill amount for cash payment (default method)
        if (paymentMethod === 'cash') {
            setAmountReceived(total.toString());
        }
        setShowPaymentModal(true);
    };

    const processPayment = async () => {
        // Validate payment
        if (paymentMethod === 'cash') {
            const received = parseFloat(amountReceived) || 0;
            if (received < total) {
                toast.error('Amount received is less than total');
                return;
            }
        }

        if (paymentMethod === 'transfer') {
            if (bankAccounts.filter(b => b.is_active).length === 0) {
                toast.error('No bank accounts available. Please add a bank account in Settings.');
                return;
            }
            if (!selectedBankId) {
                toast.error('Please select a bank account for transfer');
                return;
            }
        }

        if (paymentMethod === 'credit') {
            const creditLimit = parseFloat(selectedCustomer?.credit_limit) || 0;
            const outstanding = parseFloat(selectedCustomer?.outstanding_balance) || 0;
            const availableCredit = creditLimit - outstanding;
            
            if (selectedCustomer?.customer_type === 'walk-in') {
                toast.error('Credit payment not available for walk-in customers');
                return;
            }
            if (creditLimit <= 0) {
                toast.error('Customer does not have a credit facility');
                return;
            }
            if (selectedCustomer?.credit_blocked) {
                toast.error('Customer credit is blocked');
                return;
            }
            if (total > availableCredit) {
                toast.error(`Insufficient credit. Available: ${window.formatCurrency(availableCredit)}`);
                return;
            }
        }

        if (!selectedCustomer || !selectedCustomer.id) {
            toast.error('Please select a customer');
            return;
        }

        setProcessingPayment(true);
        
        try {
            // Prepare items for API
            const items = cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                name: item.name
            }));

            // Get selected tax info
            const selectedTax = getSelectedTax();
            const taxRate = getTaxRate();

            // Get selected bank account for transfer
            const selectedBank = bankAccounts.find(b => b.id.toString() === selectedBankId);

            const response = await posAPI.createSale({
                items,
                payment_method: paymentMethod === 'pos' ? 'card' : paymentMethod,
                customer_id: selectedCustomer?.id || null,
                discount: discount,
                discount_type: 'percentage',
                amount_received: paymentMethod === 'cash' ? parseFloat(amountReceived) : total,
                tax_id: selectedTax?.id || null,
                tax_rate: taxRate,
                tax_name: selectedTax ? `${selectedTax.name} (${taxRate * 100}%)` : null,
                bank_account_id: paymentMethod === 'transfer' ? selectedBankId : null,
                bank_account_name: paymentMethod === 'transfer' && selectedBank ? `${selectedBank.bank_name} - ${selectedBank.account_number}` : null
            });

            if (response.success) {
                // Add tax name to receipt if tax was applied
                const receiptData = response.data.receipt;
                if (selectedTax && receiptData) {
                    receiptData.taxName = `${selectedTax.name} (${taxRate * 100}%)`;
                }
                setLastReceipt(receiptData);
                setCart([]);
                setDiscount(0);
                setAmountReceived('');
                setShowPaymentModal(false);
                setShowReceiptModal(true);
                toast.success('Sale completed successfully!');
                
                // Refresh products to update stock
                fetchProducts(selectedCategory, searchQuery);
            } else {
                toast.error(response.message || 'Failed to process sale');
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error(error.response?.data?.message || 'Failed to process payment');
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleSaveTicket = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }
        if (!selectedCustomer || !selectedCustomer.id) {
            toast.error('Please select a customer (not walk-in) to save ticket');
            return;
        }

        try {
            const items = cart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                name: item.name
            }));

            // Get selected tax info
            const selectedTax = getSelectedTax();
            const taxRate = getTaxRate();

            const response = await posAPI.saveTicket({
                items,
                customer_id: selectedCustomer.id,
                discount: discount,
                discount_type: 'percentage',
                tax_id: selectedTax?.id || null,
                tax_rate: taxRate,
                tax_name: selectedTax ? `${selectedTax.name} (${taxRate * 100}%)` : null
            });

            if (response.success) {
                // Add tax name to ticket if tax was applied
                const ticketData = response.data;
                if (selectedTax && ticketData) {
                    ticketData.taxName = `${selectedTax.name} (${taxRate * 100}%)`;
                }
                setLastTicket(ticketData);
                setPendingTickets([ticketData, ...pendingTickets]);
                setCart([]);
                setDiscount(0);
                setShowTicketModal(true);
                toast.success('Order ticket saved! Customer can pay later.');
            } else {
                toast.error(response.message || 'Failed to save ticket');
            }
        } catch (error) {
            console.error('Error saving ticket:', error);
            toast.error(error.response?.data?.message || 'Failed to save ticket');
        }
    };

    const handleResumeTicket = async (ticket) => {
        try {
            // Load ticket items back into cart
            const cartItems = ticket.items.map(item => ({
                id: item.product_id || item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                stock: 999 // Will be updated when products refresh
            }));
            
            setCart(cartItems);
            setSelectedCustomer(ticket.customer);
            setDiscount(0);
            setPendingTickets(pendingTickets.filter(t => t.id !== ticket.id));
            setShowPendingTickets(false);
            toast.info(`Ticket ${ticket.id} loaded into cart`);
        } catch (error) {
            console.error('Error resuming ticket:', error);
            toast.error('Failed to resume ticket');
        }
    };

    const handleCancelTicket = async (ticketId) => {
        const confirmed = await confirm({
            title: 'Cancel Ticket',
            message: 'Are you sure you want to cancel this order ticket?',
            confirmText: 'Cancel Ticket',
            cancelText: 'Keep',
            variant: 'danger'
        });
        if (confirmed) {
            try {
                await posAPI.cancelTicket(ticketId);
                setPendingTickets(pendingTickets.filter(t => t.id !== ticketId));
                toast.success('Ticket cancelled');
            } catch (error) {
                console.error('Error cancelling ticket:', error);
                toast.error('Failed to cancel ticket');
            }
        }
    };

    const printReceipt = () => {
        if (!lastReceipt) return;
        
        // Create thermal printer receipt (58mm width = ~32 characters)
        const receiptWidth = '58mm';
        const charWidth = 32;
        
        const line = (char = '-') => char.repeat(charWidth);
        const center = (text) => {
            const padding = Math.max(0, Math.floor((charWidth - text.length) / 2));
            return ' '.repeat(padding) + text;
        };
        const leftRight = (left, right) => {
            const spaces = Math.max(1, charWidth - left.length - right.length);
            return left + ' '.repeat(spaces) + right;
        };
        const formatCurrency = (amount) => window.formatCurrency(amount, { minimumFractionDigits: 0 });
        
        let receipt = '';
        
        // Header
        receipt += center('FactoryPulse') + '\n';
        receipt += center('Sales Receipt') + '\n';
        receipt += center(lastReceipt.id || '') + '\n';
        receipt += line() + '\n';
        
        // Date & Customer
        receipt += `Date: ${lastReceipt.date}\n`;
        receipt += `Customer: ${lastReceipt.customer?.name || 'Walk-in'}\n`;
        if (lastReceipt.customer?.phone) {
            receipt += `Phone: ${lastReceipt.customer.phone}\n`;
        }
        receipt += line() + '\n';
        
        // Items
        (lastReceipt.items || []).forEach(item => {
            const itemName = item.name.length > 20 ? item.name.substring(0, 20) + '..' : item.name;
            const itemTotal = formatCurrency(item.price * item.quantity);
            receipt += `${itemName} x${item.quantity}\n`;
            receipt += leftRight('', itemTotal) + '\n';
        });
        
        receipt += line() + '\n';
        
        // Totals
        receipt += leftRight('Subtotal:', formatCurrency(lastReceipt.subtotal)) + '\n';
        
        if (lastReceipt.discount > 0) {
            receipt += leftRight('Discount:', '-' + formatCurrency(lastReceipt.discount)) + '\n';
        }
        
        if (lastReceipt.tax > 0) {
            const taxLabel = lastReceipt.taxName || 'Tax';
            receipt += leftRight(taxLabel + ':', formatCurrency(lastReceipt.tax)) + '\n';
        }
        
        receipt += line('=') + '\n';
        receipt += leftRight('TOTAL:', formatCurrency(lastReceipt.total)) + '\n';
        receipt += line('=') + '\n';
        
        // Payment Info
        receipt += leftRight('Payment:', (lastReceipt.paymentMethod || '').toUpperCase()) + '\n';
        
        if (lastReceipt.paymentMethod === 'cash') {
            receipt += leftRight('Received:', formatCurrency(lastReceipt.amountReceived)) + '\n';
            receipt += leftRight('Change:', formatCurrency(lastReceipt.change)) + '\n';
        }
        
        if (lastReceipt.paymentMethod === 'transfer' && lastReceipt.bankAccountName) {
            receipt += `Bank: ${lastReceipt.bankAccountName}\n`;
        }
        
        receipt += line() + '\n';
        receipt += center('Thank you for your') + '\n';
        receipt += center('business!') + '\n';
        receipt += '\n\n\n'; // Extra lines for paper cutting
        
        // Create print window optimized for thermal printer
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${lastReceipt.id}</title>
                <style>
                    @page {
                        size: ${receiptWidth} auto;
                        margin: 0;
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        line-height: 1.3;
                        margin: 0;
                        padding: 4mm;
                        width: ${receiptWidth};
                        background: white;
                    }
                    pre {
                        margin: 0;
                        white-space: pre-wrap;
                        word-break: break-all;
                    }
                    @media print {
                        body { 
                            width: ${receiptWidth};
                            padding: 2mm;
                        }
                    }
                </style>
            </head>
            <body>
                <pre>${receipt}</pre>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Auto-trigger print dialog
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
        
        toast.success('Receipt sent to printer');
    };

    const printTicket = () => {
        if (!lastTicket) return;
        
        // Create thermal printer ticket (58mm width = ~32 characters)
        const receiptWidth = '58mm';
        const charWidth = 32;
        
        const line = (char = '-') => char.repeat(charWidth);
        const center = (text) => {
            const padding = Math.max(0, Math.floor((charWidth - text.length) / 2));
            return ' '.repeat(padding) + text;
        };
        const leftRight = (left, right) => {
            const spaces = Math.max(1, charWidth - left.length - right.length);
            return left + ' '.repeat(spaces) + right;
        };
        const formatCurrency = (amount) => window.formatCurrency(amount, { minimumFractionDigits: 0 });
        
        let ticket = '';
        
        // Header
        ticket += center('FactoryPulse') + '\n';
        ticket += center('** ORDER TICKET **') + '\n';
        ticket += center(lastTicket.ticketNumber || '') + '\n';
        ticket += line() + '\n';
        
        // Date & Customer
        ticket += `Date: ${lastTicket.date}\n`;
        ticket += `Customer: ${lastTicket.customer?.name || 'Walk-in'}\n`;
        if (lastTicket.customer?.phone) {
            ticket += `Phone: ${lastTicket.customer.phone}\n`;
        }
        ticket += line() + '\n';
        
        // Items
        (lastTicket.items || []).forEach(item => {
            const itemName = item.name.length > 20 ? item.name.substring(0, 20) + '..' : item.name;
            const itemTotal = formatCurrency(item.price * item.quantity);
            ticket += `${itemName} x${item.quantity}\n`;
            ticket += leftRight('', itemTotal) + '\n';
        });
        
        ticket += line() + '\n';
        
        // Totals
        ticket += leftRight('Subtotal:', formatCurrency(lastTicket.subtotal)) + '\n';
        
        if (lastTicket.discount > 0) {
            ticket += leftRight('Discount:', '-' + formatCurrency(lastTicket.discount)) + '\n';
        }
        
        if (lastTicket.tax > 0) {
            const taxLabel = lastTicket.taxName || 'Tax';
            ticket += leftRight(taxLabel + ':', formatCurrency(lastTicket.tax)) + '\n';
        }
        
        ticket += line('=') + '\n';
        ticket += leftRight('TOTAL DUE:', formatCurrency(lastTicket.total)) + '\n';
        ticket += line('=') + '\n';
        
        ticket += '\n';
        ticket += center('** PENDING PAYMENT **') + '\n';
        ticket += center('Order saved. Pay anytime.') + '\n';
        ticket += '\n\n\n'; // Extra lines for paper cutting
        
        // Create print window optimized for thermal printer
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ticket - ${lastTicket.ticketNumber}</title>
                <style>
                    @page {
                        size: ${receiptWidth} auto;
                        margin: 0;
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 12px;
                        line-height: 1.3;
                        margin: 0;
                        padding: 4mm;
                        width: ${receiptWidth};
                        background: white;
                    }
                    pre {
                        margin: 0;
                        white-space: pre-wrap;
                        word-break: break-all;
                    }
                    @media print {
                        body { 
                            width: ${receiptWidth};
                            padding: 2mm;
                        }
                    }
                </style>
            </head>
            <body>
                <pre>${ticket}</pre>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Auto-trigger print dialog
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
        
        toast.success('Ticket sent to printer');
    };

    const getStockBadge = (product) => {
        if (product.stock === 0) return <Badge variant="rejected">Out of Stock</Badge>;
        if (product.stock <= product.lowStockThreshold) return <Badge variant="pending">Low Stock</Badge>;
        return null;
    };

    // Session loading state
    if (sessionLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600">Checking register status...</span>
            </div>
        );
    }

    // No active session - show open register modal
    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <div className="text-center mb-8">
                    <svg className="w-24 h-24 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-slate-700 mb-2">Register Closed</h2>
                    <p className="text-slate-500 mb-6">Open the register to start your shift</p>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => setShowOpenRegisterModal(true)}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Open Register
                    </Button>
                </div>
                
                <OpenRegisterModal
                    isOpen={showOpenRegisterModal}
                    onClose={() => setShowOpenRegisterModal(false)}
                    onSuccess={handleRegisterOpened}
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600">Loading POS Terminal...</span>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">POS Terminal</h1>
                    <p className="text-slate-600 mt-2">Point of Sale - Quick checkout interface</p>
                    <p className="text-xs text-slate-500 mt-1">F1: Complete Sale | F2: Clear Cart | F3: Search | F4: Save Ticket</p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Session Info Badge */}
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                                <p className="text-xs text-green-600 font-medium">{session.session_number}</p>
                                <p className="text-xs text-green-500">
                                    Since {new Date(session.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCloseRegisterModal(true)}
                                className="ml-2 p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition"
                                title="Close Register"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowPendingTickets(true)}
                        className="relative px-4 py-2 bg-amber-50 border-2 border-amber-300 rounded-lg text-amber-800 font-medium text-sm hover:bg-amber-100 transition"
                    >
                        <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Pending Tickets
                        {pendingTickets.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {pendingTickets.length}
                            </span>
                        )}
                    </button>
                    <div className="text-right relative">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Customer</label>
                    <div className="relative min-w-[300px]">
                        <input
                            type="text"
                            value={showCustomerDropdown ? customerSearch : (selectedCustomer?.name || 'Select Customer')}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            onFocus={() => {
                                setShowCustomerDropdown(true);
                                setCustomerSearch('');
                            }}
                            placeholder="Search customer..."
                            className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {showCustomerDropdown && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowCustomerDropdown(false)} />
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-slate-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                                    {customers
                                        .filter(c => {
                                            if (!customerSearch) return true;
                                            const search = customerSearch.toLowerCase();
                                            return c.name?.toLowerCase().includes(search) || 
                                                   c.phone?.toLowerCase().includes(search) ||
                                                   c.email?.toLowerCase().includes(search);
                                        })
                                        .map(customer => (
                                            <button
                                                key={customer.id ?? 'walk-in'}
                                                onClick={() => {
                                                    setSelectedCustomer(customer);
                                                    setShowCustomerDropdown(false);
                                                    setCustomerSearch('');
                                                }}
                                                className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition flex justify-between items-center ${
                                                    selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''
                                                }`}
                                            >
                                                <div>
                                                    <div className="font-medium text-slate-900">{customer.name}</div>
                                                    {customer.phone && <div className="text-sm text-slate-500">{customer.phone}</div>}
                                                </div>
                                                {customer.customer_type === 'walk-in' && (
                                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">Default</span>
                                                )}
                                            </button>
                                        ))}
                                    {customers.filter(c => {
                                        if (!customerSearch) return true;
                                        const search = customerSearch.toLowerCase();
                                        return c.name?.toLowerCase().includes(search) || 
                                               c.phone?.toLowerCase().includes(search);
                                    }).length === 0 && (
                                        <div className="px-4 py-3 text-slate-500 text-sm">No customers found</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products Grid */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader premium>
                            <CardTitle className="text-white">Products</CardTitle>
                        </CardHeader>
                        <CardBody>
                            {/* Search */}
                            <div className="mb-4">
                                <input
                                    id="pos-search"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products or scan barcode..."
                                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                />
                            </div>

                            {/* Category Tabs */}
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                {categories.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                                            selectedCategory === category.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>

                            {/* Products */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                                {filteredProducts.map(product => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.stock === 0}
                                        className={`p-4 rounded-lg text-left border-2 transition ${
                                            product.stock === 0
                                                ? 'bg-slate-100 border-slate-300 cursor-not-allowed opacity-50'
                                                : 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <p className="font-semibold text-slate-900 text-sm">{product.name}</p>
                                            {getStockBadge(product)}
                                        </div>
                                        <p className="text-blue-700 font-mono text-lg font-bold">{window.getCurrencySymbol()}{product.price.toLocaleString()}</p>
                                        <p className="text-xs text-slate-600 mt-1">Stock: {product.stock} units</p>
                                    </button>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Cart */}
                <div>
                    <Card>
                        <CardHeader premium>
                            <CardTitle className="text-white">Cart ({cart.length})</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <div className="min-h-[300px] max-h-[400px] overflow-y-auto mb-4">
                                {cart.length === 0 ? (
                                    <div className="text-center text-slate-500 py-12">
                                        <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <p className="font-medium">Cart is empty</p>
                                        <p className="text-sm mt-2">Add products to get started</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map(item => (
                                            <div key={item.id} className="bg-slate-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-semibold text-slate-900 text-sm flex-1">{item.name}</p>
                                                    <button
                                                        onClick={() => handleRemoveFromCart(item.id)}
                                                        className="text-red-600 hover:text-red-700 ml-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                                                            className="w-7 h-7 flex items-center justify-center bg-white border-2 border-slate-300 rounded hover:bg-slate-50"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateCartItemQty(item.id, parseInt(e.target.value) || 0)}
                                                            className="w-16 px-2 py-1 text-center border-2 border-slate-300 rounded focus:border-blue-600 focus:outline-none"
                                                        />
                                                        <button
                                                            onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                                                            className="w-7 h-7 flex items-center justify-center bg-white border-2 border-slate-300 rounded hover:bg-slate-50"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <p className="font-mono font-bold text-blue-700">
                                                        {window.getCurrencySymbol()}{(item.price * item.quantity).toLocaleString()}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{window.getCurrencySymbol()}{item.price.toLocaleString()} each</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Discount & Tax */}
                            {cart.length > 0 && (
                                <div className="mb-4 pb-4 border-b-2 border-slate-200 space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tax</label>
                                        <select
                                            value={selectedTaxId}
                                            onChange={(e) => setSelectedTaxId(e.target.value)}
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none text-sm"
                                        >
                                            <option value="">No Tax</option>
                                            {(Array.isArray(taxes) ? taxes : []).filter(t => t.is_active).map(t => {
                                                const rate = parseFloat(t.rate);
                                                const displayRate = rate > 1 ? rate : rate * 100;
                                                return (
                                                    <option key={t.id} value={t.id}>
                                                        {t.name} ({displayRate}%)
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Discount %</label>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                                            placeholder="0"
                                            className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Totals */}
                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Subtotal:</span>
                                    <span className="font-mono font-semibold">{window.getCurrencySymbol()}{subtotal.toLocaleString()}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Discount ({discount}%):</span>
                                        <span className="font-mono font-semibold text-red-600">-{window.getCurrencySymbol()}{discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">{getTaxDisplayName()}:</span>
                                        <span className="font-mono font-semibold">{window.getCurrencySymbol()}{tax.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-center">
                                    <span className="text-lg font-semibold">Total:</span>
                                    <span className="text-3xl font-bold text-blue-800 font-mono">{window.getCurrencySymbol()}{total.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-2">
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={handleCompleteSale}
                                    disabled={cart.length === 0 || !selectedCustomer}
                                >
                                    Complete Sale (F1)
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleSaveTicket}
                                    disabled={cart.length === 0 || !selectedCustomer}
                                >
                                    Save as Ticket (F4)
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleClearCart}
                                    disabled={cart.length === 0}
                                >
                                    Clear Cart (F2)
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Quantity Modal */}
            <Modal
                isOpen={showQtyModal}
                onClose={() => setShowQtyModal(false)}
                title="Add to Cart"
                size="sm"
            >
                {selectedProduct && (
                    <div className="p-6">
                        <p className="font-semibold text-slate-900 mb-2">{selectedProduct.name}</p>
                        <p className="text-blue-700 font-mono text-lg mb-4">{window.getCurrencySymbol()}{selectedProduct.price.toLocaleString()}</p>
                        <p className="text-sm text-slate-600 mb-4">Available: {selectedProduct.stock} units</p>

                        <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 flex items-center justify-center bg-slate-100 border-2 border-slate-300 rounded-lg hover:bg-slate-200 text-lg font-bold"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, Math.min(selectedProduct.stock, parseInt(e.target.value) || 1)))}
                                className="flex-1 px-4 py-2 text-center text-2xl font-bold border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                            />
                            <button
                                onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                                className="w-10 h-10 flex items-center justify-center bg-slate-100 border-2 border-slate-300 rounded-lg hover:bg-slate-200 text-lg font-bold"
                            >
                                +
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setShowQtyModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={confirmAddToCart} className="flex-1">
                                Add to Cart
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Payment Modal */}
            <Modal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                title="Complete Payment"
                size="md"
            >
                <div className="p-6">
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-slate-900">Total Amount:</span>
                            <span className="text-3xl font-bold text-blue-800 font-mono">{window.getCurrencySymbol()}{total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['cash', 'pos', 'transfer', 'credit'].map(method => {
                                // Check if credit is available for this customer
                                const creditLimit = parseFloat(selectedCustomer?.credit_limit) || 0;
                                const outstanding = parseFloat(selectedCustomer?.outstanding_balance) || 0;
                                const availableCredit = creditLimit - outstanding;
                                const canUseCredit = method === 'credit' ? (creditLimit > 0 && availableCredit >= total && !selectedCustomer?.credit_blocked) : true;
                                const isWalkIn = selectedCustomer?.customer_type === 'walk-in';
                                const creditDisabled = method === 'credit' && (isWalkIn || !canUseCredit);
                                
                                return (
                                    <button
                                        key={method}
                                        onClick={() => {
                                            if (creditDisabled) return;
                                            setPaymentMethod(method);
                                            // Prefill amount for cash
                                            if (method === 'cash') {
                                                setAmountReceived(total.toString());
                                            } else {
                                                setAmountReceived('');
                                            }
                                        }}
                                        disabled={creditDisabled}
                                        className={`px-3 py-3 rounded-lg font-medium capitalize transition text-sm ${
                                            paymentMethod === method
                                                ? 'bg-blue-600 text-white'
                                                : creditDisabled
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                        title={creditDisabled ? (isWalkIn ? 'Credit not available for walk-in customers' : 'Insufficient credit limit') : ''}
                                    >
                                        {method === 'pos' ? 'POS/Card' : method === 'transfer' ? 'Transfer' : method === 'credit' ? 'Credit' : 'Cash'}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {paymentMethod === 'cash' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Amount Received</label>
                            <input
                                type="number"
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                            />
                            {amountReceived && parseFloat(amountReceived) >= total && (
                                <p className="text-green-600 text-sm mt-2 font-medium">
                                    Change: {window.getCurrencySymbol()}{(parseFloat(amountReceived) - total).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}

                    {paymentMethod === 'transfer' && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Select Bank Account</label>
                            {bankAccounts.filter(b => b.is_active).length === 0 ? (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 text-center">
                                    <svg className="w-8 h-8 mx-auto text-amber-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <p className="text-amber-800 font-medium">No Bank Accounts Available</p>
                                    <p className="text-amber-600 text-sm mt-1">Please add a bank account in Settings → Bank Accounts</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {bankAccounts.filter(b => b.is_active).map(bank => (
                                        <button
                                            key={bank.id}
                                            onClick={() => setSelectedBankId(bank.id.toString())}
                                            className={`w-full px-4 py-3 rounded-lg text-left transition border-2 ${
                                                selectedBankId === bank.id.toString()
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="font-medium text-slate-900">{bank.bank_name}</div>
                                            <div className="text-sm text-slate-600">{bank.account_number} • {bank.account_name}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {paymentMethod === 'credit' && (
                        <div className="mb-6">
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-purple-900">Credit Payment</p>
                                        <p className="text-sm text-purple-700">Payment due in {selectedCustomer?.payment_terms_days || 30} days</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-white rounded-lg p-2">
                                        <p className="text-xs text-slate-500">Credit Limit</p>
                                        <p className="font-bold text-slate-900">{window.getCurrencySymbol()}{(parseFloat(selectedCustomer?.credit_limit) || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <p className="text-xs text-slate-500">Outstanding</p>
                                        <p className="font-bold text-amber-600">{window.getCurrencySymbol()}{(parseFloat(selectedCustomer?.outstanding_balance) || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <p className="text-xs text-slate-500">Available</p>
                                        <p className="font-bold text-green-600">{window.getCurrencySymbol()}{((parseFloat(selectedCustomer?.credit_limit) || 0) - (parseFloat(selectedCustomer?.outstanding_balance) || 0)).toLocaleString()}</p>
                                    </div>
                                </div>
                                {total > ((parseFloat(selectedCustomer?.credit_limit) || 0) - (parseFloat(selectedCustomer?.outstanding_balance) || 0)) && (
                                    <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-sm text-center">
                                        ⚠️ Sale amount exceeds available credit
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={() => setShowPaymentModal(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            onClick={processPayment} 
                            className="flex-1"
                            disabled={
                                (paymentMethod === 'transfer' && bankAccounts.filter(b => b.is_active).length === 0) ||
                                (paymentMethod === 'credit' && (total > ((parseFloat(selectedCustomer?.credit_limit) || 0) - (parseFloat(selectedCustomer?.outstanding_balance) || 0))))
                            }
                        >
                            {paymentMethod === 'credit' ? 'Charge to Credit' : 'Process Payment'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Receipt Modal */}
            <Modal
                isOpen={showReceiptModal}
                onClose={() => setShowReceiptModal(false)}
                title="Receipt"
                size="sm"
            >
                {lastReceipt && (
                    <div className="p-6">
                        <div className="bg-white border-2 border-slate-200 rounded-lg p-6 mb-6">
                            <div className="text-center mb-4">
                                <h2 className="text-2xl font-bold text-blue-800">FactoryPulse</h2>
                                <p className="text-sm text-slate-600">Sales Receipt</p>
                                <p className="text-xs text-slate-500 mt-1">{lastReceipt.id}</p>
                            </div>

                            <div className="border-t border-b border-slate-300 py-3 mb-3">
                                <p className="text-sm"><span className="font-medium">Date:</span> {lastReceipt.date}</p>
                                <p className="text-sm"><span className="font-medium">Customer:</span> {lastReceipt.customer.name}</p>
                                {lastReceipt.customer.phone && (
                                    <p className="text-sm"><span className="font-medium">Phone:</span> {lastReceipt.customer.phone}</p>
                                )}
                            </div>

                            <div className="space-y-2 mb-3">
                                {lastReceipt.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.name} x{item.quantity}</span>
                                        <span className="font-mono">{window.getCurrencySymbol()}{(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-slate-300 pt-3 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span className="font-mono">{window.getCurrencySymbol()}{lastReceipt.subtotal.toLocaleString()}</span>
                                </div>
                                {lastReceipt.discount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Discount:</span>
                                        <span className="font-mono">-{window.getCurrencySymbol()}{lastReceipt.discount.toLocaleString()}</span>
                                    </div>
                                )}
                                {lastReceipt.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>{lastReceipt.taxName || 'Tax'}:</span>
                                        <span className="font-mono">{window.getCurrencySymbol()}{lastReceipt.tax.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-2">
                                    <span>Total:</span>
                                    <span className="font-mono">{window.getCurrencySymbol()}{lastReceipt.total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="border-t border-slate-300 mt-3 pt-3 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>Payment Method:</span>
                                    <span className="font-medium capitalize">{lastReceipt.paymentMethod}</span>
                                </div>
                                {lastReceipt.paymentMethod === 'cash' && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span>Amount Received:</span>
                                            <span className="font-mono">{window.getCurrencySymbol()}{lastReceipt.amountReceived.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Change:</span>
                                            <span className="font-mono">{window.getCurrencySymbol()}{lastReceipt.change.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <p className="text-center text-xs text-slate-500 mt-4">Thank you for your business!</p>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowReceiptModal(false)} className="flex-1">
                                Close
                            </Button>
                            <Button variant="primary" onClick={printReceipt} className="flex-1">
                                Print Receipt
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Order Ticket Modal */}
            <Modal
                isOpen={showTicketModal}
                onClose={() => setShowTicketModal(false)}
                title="Order Ticket"
                size="sm"
            >
                {lastTicket && (
                    <div className="p-6">
                        <div className="bg-white border-2 border-amber-300 rounded-lg p-6 mb-6">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-2">
                                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-slate-900">ORDER TICKET</h2>
                                <p className="text-xs text-slate-500 mt-1 font-mono">{lastTicket.id}</p>
                                <Badge variant="pending" className="mt-2">Payment Pending</Badge>
                            </div>

                            <div className="border-t border-b border-slate-200 py-3 mb-3">
                                <p className="text-sm"><span className="font-medium">Date:</span> {lastTicket.date}</p>
                                <p className="text-sm"><span className="font-medium">Customer:</span> {lastTicket.customer.name}</p>
                                {lastTicket.customer.phone && (
                                    <p className="text-sm"><span className="font-medium">Phone:</span> {lastTicket.customer.phone}</p>
                                )}
                            </div>

                            <table className="w-full text-sm mb-3">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="py-1.5 text-left text-xs font-semibold text-slate-500">Item</th>
                                        <th className="py-1.5 text-center text-xs font-semibold text-slate-500">Qty</th>
                                        <th className="py-1.5 text-right text-xs font-semibold text-slate-500">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lastTicket.items.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100">
                                            <td className="py-1.5 text-slate-700">{item.name}</td>
                                            <td className="py-1.5 text-center text-slate-600">x{item.quantity}</td>
                                            <td className="py-1.5 text-right font-mono">{window.getCurrencySymbol()}{(item.price * item.quantity).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="border-t border-slate-300 pt-3 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span className="font-mono">{window.getCurrencySymbol()}{lastTicket.subtotal.toLocaleString()}</span>
                                </div>
                                {lastTicket.discount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600">
                                        <span>Discount:</span>
                                        <span className="font-mono">-{window.getCurrencySymbol()}{lastTicket.discount.toLocaleString()}</span>
                                    </div>
                                )}
                                {lastTicket.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>{lastTicket.taxName || 'Tax'}:</span>
                                        <span className="font-mono">{window.getCurrencySymbol()}{lastTicket.tax.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold border-t border-slate-300 pt-2">
                                    <span>Total Due:</span>
                                    <span className="font-mono text-amber-700">{window.getCurrencySymbol()}{lastTicket.total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-xs text-amber-800 text-center font-medium">This order is saved. Customer can pay at any time.</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowTicketModal(false)} className="flex-1">
                                Close
                            </Button>
                            <Button variant="primary" onClick={printTicket} className="flex-1">
                                Print Ticket
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Pending Tickets Modal */}
            <Modal
                isOpen={showPendingTickets}
                onClose={() => setShowPendingTickets(false)}
                title={`Pending Tickets (${pendingTickets.length})`}
                size="md"
            >
                <div className="p-6">
                    {pendingTickets.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="font-medium">No pending tickets</p>
                            <p className="text-sm mt-1">All orders have been settled</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {pendingTickets.map(ticket => (
                                <div key={ticket.id} className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-sm font-semibold text-amber-800">{ticket.id}</span>
                                        <Badge variant="pending">Pending</Badge>
                                    </div>
                                    <div className="text-sm text-slate-700 mb-1">
                                        <span className="font-medium">{ticket.customer.name}</span>
                                        {ticket.customer.phone && <span className="text-slate-500 ml-2">{ticket.customer.phone}</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 mb-2">{ticket.date}</div>
                                    <div className="text-xs text-slate-600 mb-3">
                                        {ticket.items.length} item{ticket.items.length !== 1 ? 's' : ''} &middot; <span className="font-semibold font-mono text-amber-800">{window.getCurrencySymbol()}{ticket.total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="primary" size="sm" onClick={() => handleResumeTicket(ticket)} className="flex-1">
                                            Resume & Pay
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => { setLastTicket(ticket); setShowPendingTickets(false); setShowTicketModal(true); }}>
                                            View
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleCancelTicket(ticket.id)} className="text-red-600">
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Open Register Modal */}
            <OpenRegisterModal
                isOpen={showOpenRegisterModal}
                onClose={() => setShowOpenRegisterModal(false)}
                onSuccess={handleRegisterOpened}
            />

            {/* Close Register Modal */}
            <CloseRegisterModal
                isOpen={showCloseRegisterModal}
                onClose={() => setShowCloseRegisterModal(false)}
                onSuccess={handleRegisterClosed}
                session={session}
            />
        </div>
    );
}
