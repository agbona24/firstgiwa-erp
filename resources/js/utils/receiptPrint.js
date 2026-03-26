/**
 * receiptPrint.js
 *
 * Shared receipt printing utility.
 * Reads Print & Receipts settings + company profile (cached in localStorage)
 * and respects every content toggle defined in Settings → Print & Receipts.
 *
 * Usage:
 *   import { buildReceiptHTML, printReceipt } from '../../utils/receiptPrint';
 *   await printReceipt(receiptData);
 */

import { printSettingsAPI, companyAPI } from '../services/settingsAPI';
// qzTray is loaded lazily so a missing/broken QZ package never prevents receipt printing
let _qzTray = null;
async function getQzTray() {
    if (_qzTray) return _qzTray;
    try { _qzTray = (await import('../services/qzTray')).default; } catch { _qzTray = null; }
    return _qzTray;
}

// ──────────────────────────────────────────────────────────────
// Settings cache (loaded once per page session, per open)
// ──────────────────────────────────────────────────────────────
let _settings = null;

export async function loadPrintSettings(force = false) {
    if (_settings && !force) return _settings;
    try {
        const res = await printSettingsAPI.get();
        _settings = res.data?.data || {};
    } catch {
        _settings = {};
    }
    return _settings;
}

/** Allow callers (e.g. Settings page) to inject already-loaded settings */
export function setPrintSettings(s) { _settings = s; }

/** Clear cache so next call re-fetches (useful after saving settings) */
export function clearPrintSettingsCache() { _settings = null; }

/** Synchronous read of the cached company info (populated after loadCompanyInfo()) */
export function getCompanyCache() { return _company; }

// ──────────────────────────────────────────────────────────────
// Company info — fetched from API (with session cache)
// ──────────────────────────────────────────────────────────────
let _company = null;

export async function loadCompanyInfo(force = false) {
    if (_company && !force) return _company;
    try {
        const res = await companyAPI.get();
        const d = res.data?.data || {};
        _company = {
            name:     d.name     || localStorage.getItem('company_name')     || '',
            address:  d.address  || localStorage.getItem('company_address')  || '',
            phone:    d.phone    || localStorage.getItem('company_phone')    || '',
            email:    d.email    || localStorage.getItem('company_email')    || '',
            logo_url: d.logo_url ? normalizeLogoUrl(d.logo_url)
                                 : (localStorage.getItem('company_logo_url') || ''),
        };
        // Keep localStorage in sync so other components benefit
        if (_company.name)     localStorage.setItem('company_name',     _company.name);
        if (_company.logo_url) localStorage.setItem('company_logo_url', _company.logo_url);
    } catch {
        _company = {
            name:     localStorage.getItem('company_name')     || '',
            address:  localStorage.getItem('company_address')  || '',
            phone:    localStorage.getItem('company_phone')    || '',
            email:    localStorage.getItem('company_email')    || '',
            logo_url: localStorage.getItem('company_logo_url') || '',
        };
    }
    return _company;
}

function normalizeLogoUrl(value) {
    if (!value) return '';
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/storage/')) return value;
    return `/storage/${value.replace(/^\/+/, '')}`;
}

const fmt = (n) =>
    typeof window.formatCurrency === 'function'
        ? window.formatCurrency(n, { minimumFractionDigits: 0 })
        : Number(n).toLocaleString();

// ──────────────────────────────────────────────────────────────
// HTML receipt builder (respects all settings toggles)
// ──────────────────────────────────────────────────────────────

/**
 * Builds an HTML string for a receipt.
 *
 * @param {object} data — receipt / order data shape:
 *   {
 *     id, date, customer: { name, phone },
 *     cashierName?,
 *     items: [{ id, name, sku?, quantity, price }],
 *     subtotal, discount, tax, taxName?, charges?: [{ name, amount }],
 *     total, paymentMethod, amountReceived?, change?, bankAccountName?,
 *     saleCategory?
 *   }
 * @param {object} [settingsOverride] — pass already-loaded settings to skip a fetch
 */
export function buildReceiptHTML(data, settingsOverride, companyOverride) {
    const s = settingsOverride || _settings || {};
    const co = companyOverride || _company || {
        name:     localStorage.getItem('company_name')     || '',
        address:  localStorage.getItem('company_address')  || '',
        phone:    localStorage.getItem('company_phone')    || '',
        email:    localStorage.getItem('company_email')    || '',
        logo_url: localStorage.getItem('company_logo_url') || '',
    };

    // Paper width
    const widthMap = { '58mm': '200px', '80mm': '280px', 'A4': '595px' };
    const width = widthMap[s.receipt_paper_size] || '280px';

    const bool = (key, def = true) => (key in s ? !!s[key] : def);

    const row = (l, r) => `<div class="row"><span>${l}</span><span>${r}</span></div>`;
    const divider = (char = '-') => `<div class="divider" data-char="${char}"></div>`;

    let body = '';

    // Logo
    if (bool('show_logo') && co.logo_url) {
        body += `<div class="center"><img src="${co.logo_url}" alt="logo" style="max-height:48px;max-width:80%;object-fit:contain;margin-bottom:4px" /></div>`;
    }

    // Company name
    if (bool('show_company_name') && co.name) {
        body += `<div class="center bold lg">${escHtml(co.name)}</div>`;
    }

    // Company address
    if (bool('show_company_address') && co.address) {
        body += `<div class="center muted">${escHtml(co.address)}</div>`;
    }

    // Company phone
    if (bool('show_company_phone') && co.phone) {
        body += `<div class="center muted">Tel: ${escHtml(co.phone)}</div>`;
    }

    // Company email
    if (bool('show_company_email', false) && co.email) {
        body += `<div class="center muted">${escHtml(co.email)}</div>`;
    }

    // Header text
    if (s.receipt_header) {
        body += divider();
        body += `<div class="center muted">${escHtml(s.receipt_header)}</div>`;
    }

    body += divider();

    // Receipt ID / type
    if (data.id) body += `<div class="center bold">${escHtml(String(data.id))}</div>`;

    body += divider();

    // Date & time
    if (bool('show_date_time')) {
        const d = data.date || new Date().toLocaleString();
        body += row('Date:', escHtml(d));
    }

    // Customer
    const custName = data.customer?.name || 'Walk-in';
    body += row('Customer:', escHtml(custName));
    if (data.customer?.phone) {
        body += row('Phone:', escHtml(data.customer.phone));
    }

    // Cashier — POS sends 'cashier', some callers send 'cashierName'
    if (bool('show_cashier_name', true) && (data.cashierName || data.cashier)) {
        body += row('Cashier:', escHtml(data.cashierName || data.cashier));
    }

    // Sale category
    if (data.saleCategory) {
        body += row('Category:', escHtml(data.saleCategory));
    }

    body += divider();

    // Items
    (data.items || []).forEach(item => {
        let itemLine = '';
        if (bool('show_item_sku', false) && item.sku) {
            itemLine += `[${escHtml(item.sku)}] `;
        }
        if (bool('show_item_description', true)) {
            itemLine += escHtml(item.name);
        }
        if (itemLine) body += `<div>${itemLine}</div>`;

        if (bool('show_quantity') && bool('show_unit_price')) {
            body += row(`  ${item.quantity} × ${fmt(item.price)}`, fmt(item.price * item.quantity));
        } else if (bool('show_quantity')) {
            body += `<div>  Qty: ${item.quantity}</div>`;
        }
    });

    body += divider();

    // Totals
    if (bool('show_subtotal')) {
        body += row('Subtotal:', fmt(data.subtotal ?? 0));
    }
    if (bool('show_discount') && (data.discount ?? 0) > 0) {
        body += row('Discount:', `−${fmt(data.discount)}`);
    }
    if (bool('show_tax') && (data.tax ?? 0) > 0) {
        body += row(escHtml(data.taxName || 'Tax') + ':', fmt(data.tax));
    }
    (data.charges || []).forEach(c => {
        body += row(escHtml(c.name) + ':', fmt(c.amount));
    });

    body += divider('=');
    body += `<div class="row bold""><span>TOTAL:</span><span>${fmt(data.total ?? 0)}</span></div>`;
    body += divider('=');

    // Payment
    if (bool('show_payment_method')) {
        body += row('Payment:', escHtml((data.paymentMethod || '').toUpperCase()));
    }
    if (bool('show_change_given') && data.paymentMethod === 'cash') {
        if (data.amountReceived != null) body += row('Received:', fmt(data.amountReceived));
        if (data.change != null)         body += row('Change:', fmt(data.change));
    }
    if (data.paymentMethod === 'transfer' && data.bankAccountName) {
        body += row('Bank:', escHtml(data.bankAccountName));
    }

    // Barcode (visual placeholder — real barcode needs a lib, this is text)
    if (bool('show_barcode', false) && data.id) {
        body += divider();
        body += `<div class="center barcode">${escHtml(String(data.id))}</div>`;
    }

    body += divider();
    // Footer
    const footer = s.receipt_footer || 'Thank you for your patronage!';
    body += `<div class="center muted">${escHtml(footer)}</div>`;
    body += '<br/><br/>';

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Receipt – ${escHtml(String(data.id || ''))}</title>
<style>
  @page { size: ${width} auto; margin: 0; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 12px; line-height: 1.4;
         margin: 0; padding: 4mm; width: ${width}; background: #fff; }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .lg { font-size: 14px; }
  .muted { color: #555; }
  .row { display: flex; justify-content: space-between; }
  .barcode { font-size: 10px; letter-spacing: 3px; }
  .divider::before { content: attr(data-char, '-'); display: block;
                     border-top: 1px ${(s.receipt_paper_size === 'A4') ? 'solid' : 'dashed'} #999;
                     margin: 5px 0; }
  @media print { body { width: ${width}; padding: 2mm; } }
</style></head>
<body>${body}</body></html>`;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ──────────────────────────────────────────────────────────────
// Print dispatcher — QZ Tray → browser popup
// ──────────────────────────────────────────────────────────────

/**
 * Load settings, build HTML and send to printer.
 *
 * @param {object} receiptData — same shape as buildReceiptHTML's `data` param
 * @param {object} [opts]
 *   opts.printerName {string}  — OS printer name for QZ Tray (falls back to browser if blank)
 *   opts.forcePopup  {boolean} — skip QZ Tray even if connected
 *   opts.settings    {object}  — already-loaded settings (skips fetch)
 */
export async function printReceipt(receiptData, opts = {}) {
    const [settings, company] = await Promise.all([
        opts.settings ? Promise.resolve(opts.settings) : loadPrintSettings(),
        loadCompanyInfo(),
    ]);
    const html = buildReceiptHTML(receiptData, settings, company);
    const copies = parseInt(settings.copies_receipt) || 1;

    // Try QZ Tray silent printing (lazy-loaded so failures never block receipt printing)
    if (!opts.forcePopup && opts.printerName) {
        try {
            const qz = await getQzTray();
            if (qz && await qz.detect(2000)) {
                await qz.printHTML(opts.printerName, html, { copies });
                return { method: 'qz' };
            }
        } catch (e) {
            console.warn('QZ Tray print failed, falling back:', e);
        }
    }

    // Browser popup fallback
    const width = settings.receipt_paper_size === 'A4' ? 640 : 380;
    const win = window.open('', '_blank', `width=${width},height=700`);
    if (!win) {
        throw new Error('Popup blocked. Allow popups and try again.');
    }
    win.document.write(html);
    win.document.close();
    win.focus();

    // Print once content loads
    if (copies > 1) {
        // Open multiple times for multi-copy
        setTimeout(() => {
            for (let i = 0; i < copies; i++) {
                win.print();
            }
            win.close();
        }, 400);
    } else {
        setTimeout(() => { win.print(); win.close(); }, 400);
    }

    return { method: 'popup' };
}
