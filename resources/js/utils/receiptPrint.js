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

    const bool = (key, def = true) => (key in s ? !!s[key] : def);

    // ── Header ────────────────────────────────────────────────
    let headerHtml = '';

    if (bool('show_logo') && co.logo_url) {
        headerHtml += `<img src="${co.logo_url}" alt="logo" class="logo" />`;
    }
    if (bool('show_company_name') && co.name) {
        headerHtml += `<div class="company-name">${escHtml(co.name)}</div>`;
    }
    let companyMeta = [];
    if (bool('show_company_address') && co.address) companyMeta.push(escHtml(co.address));
    if (bool('show_company_phone')   && co.phone)   companyMeta.push('Tel: ' + escHtml(co.phone));
    if (bool('show_company_email', false) && co.email) companyMeta.push(escHtml(co.email));
    if (companyMeta.length) {
        headerHtml += `<div class="company-meta">${companyMeta.join(' &nbsp;|&nbsp; ')}</div>`;
    }
    if (s.receipt_header) {
        headerHtml += `<div class="header-note">${escHtml(s.receipt_header)}</div>`;
    }

    // ── Receipt info row ──────────────────────────────────────
    const dateStr   = bool('show_date_time') ? escHtml(data.date || new Date().toLocaleString()) : '';
    const custName  = escHtml(data.customer?.name || 'Walk-in');
    const custPhone = data.customer?.phone ? escHtml(data.customer.phone) : '';
    const cashier   = bool('show_cashier_name', true) ? escHtml(data.cashierName || data.cashier || '') : '';
    const receiptId = data.id ? escHtml(String(data.id)) : '';

    let metaRows = '';
    if (dateStr)   metaRows += `<tr><td class="ml">Date</td><td class="mr">${dateStr}</td></tr>`;
    metaRows       += `<tr><td class="ml">Customer</td><td class="mr">${custName}</td></tr>`;
    if (custPhone) metaRows += `<tr><td class="ml">Phone</td><td class="mr">${custPhone}</td></tr>`;
    if (cashier)   metaRows += `<tr><td class="ml">Cashier</td><td class="mr">${cashier}</td></tr>`;
    if (data.saleCategory) metaRows += `<tr><td class="ml">Category</td><td class="mr">${escHtml(data.saleCategory)}</td></tr>`;

    // ── Items table ───────────────────────────────────────────
    let itemRows = '';
    (data.items || []).forEach((item, idx) => {
        const name  = bool('show_item_description', true) ? escHtml(item.name) : '';
        const sku   = bool('show_item_sku', false) && item.sku ? `<span class="sku">${escHtml(item.sku)}</span>` : '';
        const qty   = bool('show_quantity')  ? `${item.quantity}${item.unit ? ' ' + escHtml(item.unit) : ''}` : '';
        const price = bool('show_unit_price') ? fmt(item.price) : '';
        const total = fmt(item.price * item.quantity);
        itemRows += `<tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
            <td class="item-name">${sku}${name}</td>
            <td class="item-qty">${qty}</td>
            <td class="item-price">${price}</td>
            <td class="item-total">${total}</td>
        </tr>`;
    });

    // ── Totals ────────────────────────────────────────────────
    let totalsRows = '';
    if (bool('show_subtotal')) {
        totalsRows += `<tr><td>Subtotal</td><td>${fmt(data.subtotal ?? 0)}</td></tr>`;
    }
    if (bool('show_discount') && (data.discount ?? 0) > 0) {
        totalsRows += `<tr class="discount"><td>Discount</td><td>−${fmt(data.discount)}</td></tr>`;
    }
    if (bool('show_tax') && (data.tax ?? 0) > 0) {
        totalsRows += `<tr><td>${escHtml(data.taxName || 'Tax')}</td><td>${fmt(data.tax)}</td></tr>`;
    }
    (data.charges || []).forEach(c => {
        totalsRows += `<tr><td>${escHtml(c.name)}</td><td>${fmt(c.amount)}</td></tr>`;
    });
    totalsRows += `<tr class="grand-total"><td>TOTAL</td><td>${fmt(data.total ?? 0)}</td></tr>`;

    // ── Payment details ───────────────────────────────────────
    let payRows = '';
    if (bool('show_payment_method')) {
        payRows += `<tr><td class="ml">Payment</td><td class="mr">${escHtml((data.paymentMethod || '').toUpperCase())}</td></tr>`;
    }
    if (bool('show_change_given') && data.paymentMethod === 'cash') {
        if (data.amountReceived != null) payRows += `<tr><td class="ml">Amount Received</td><td class="mr">${fmt(data.amountReceived)}</td></tr>`;
        if (data.change != null)         payRows += `<tr><td class="ml">Change</td><td class="mr">${fmt(data.change)}</td></tr>`;
    }
    if (data.paymentMethod === 'transfer' && data.bankAccountName) {
        payRows += `<tr><td class="ml">Bank</td><td class="mr">${escHtml(data.bankAccountName)}</td></tr>`;
    }

    // ── Barcode ───────────────────────────────────────────────
    const barcodeHtml = (bool('show_barcode', false) && data.id)
        ? `<div class="barcode">${escHtml(String(data.id))}</div>` : '';

    // ── Footer ────────────────────────────────────────────────
    const footer = escHtml(s.receipt_footer || 'Thank you for your patronage!');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>Receipt – ${escHtml(String(data.id || ''))}</title>
<style>
  @page { size: A4; margin: 15mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px;
         color: #1e293b; line-height: 1.5; background: #fff; }

  /* ── Page wrapper ── */
  .page { max-width: 720px; margin: 0 auto; padding: 30px 36px 40px; }

  /* ── Header ── */
  .receipt-header { text-align: center; padding-bottom: 18px;
                    border-bottom: 3px solid #2563eb; margin-bottom: 20px; }
  .logo { max-height: 56px; max-width: 180px; object-fit: contain; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto; }
  .company-name { font-size: 22px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; }
  .company-meta { font-size: 11px; color: #64748b; margin-top: 4px; }
  .header-note  { font-size: 11px; color: #64748b; margin-top: 6px; font-style: italic; }

  /* ── Title band ── */
  .title-band { background: #2563eb; color: #fff; text-align: center;
                padding: 10px 16px; border-radius: 6px; margin-bottom: 20px; }
  .title-band h1 { font-size: 16px; font-weight: 700; letter-spacing: 1px; }
  .title-band .receipt-num { font-size: 12px; opacity: 0.85; margin-top: 2px; font-family: monospace; }

  /* ── Meta info table (date / customer / cashier) ── */
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .meta-table td { padding: 5px 8px; font-size: 12.5px; }
  .meta-table .ml { color: #64748b; width: 38%; }
  .meta-table .mr { font-weight: 600; color: #1e293b; }
  .meta-table tr:not(:last-child) td { border-bottom: 1px solid #f1f5f9; }

  /* ── Items table ── */
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase;
                   letter-spacing: 0.8px; color: #64748b; margin-bottom: 6px; }
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .items-table thead tr { background: #f1f5f9; }
  .items-table thead th { padding: 8px 10px; font-size: 11px; font-weight: 700;
                           text-transform: uppercase; letter-spacing: 0.6px; color: #475569; text-align: left; }
  .items-table thead th.r { text-align: right; }
  .items-table tbody tr.even { background: #fff; }
  .items-table tbody tr.odd  { background: #f8fafc; }
  .items-table tbody td { padding: 9px 10px; font-size: 13px; vertical-align: top; }
  .items-table tbody td.item-qty,
  .items-table tbody td.item-price,
  .items-table tbody td.item-total { text-align: right; white-space: nowrap; }
  .items-table .sku { display: block; font-size: 10px; color: #94a3b8; margin-bottom: 1px; }
  .items-table tfoot td { padding: 0; }

  /* ── Totals ── */
  .totals-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; margin-left: auto; }
  .totals-table td { padding: 6px 10px; font-size: 13px; }
  .totals-table td:first-child { color: #64748b; width: 70%; text-align: right; padding-right: 20px; }
  .totals-table td:last-child  { text-align: right; font-weight: 600; color: #1e293b; width: 30%; }
  .totals-table tr.discount td { color: #ef4444; }
  .totals-table tr:not(.grand-total):not(:first-child) td { border-top: 1px solid #f1f5f9; }
  .totals-table tr.grand-total td { background: #1e3a8a; color: #fff !important;
                                     font-size: 16px; font-weight: 800;
                                     border-radius: 0; padding: 10px; }
  .totals-table tr.grand-total td:first-child { border-radius: 6px 0 0 6px; }
  .totals-table tr.grand-total td:last-child  { border-radius: 0 6px 6px 0; font-size: 16px; }

  /* ── Items Brought by Customer ── */
  .brought-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px;
                 padding: 14px 16px; margin-bottom: 20px; }
  .brought-box .brought-title { font-size: 11px; font-weight: 700; text-transform: uppercase;
                                letter-spacing: 0.8px; color: #92400e; margin-bottom: 8px; }
  .brought-table { width: 100%; border-collapse: collapse; }
  .brought-table td { padding: 4px 6px; font-size: 12.5px; color: #78350f; }
  .brought-table td:last-child { text-align: right; font-weight: 600; }

  /* ── Payment section ── */
  .pay-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
             padding: 14px 16px; margin-bottom: 20px; }
  .pay-table { width: 100%; border-collapse: collapse; }
  .pay-table .ml { color: #166534; font-size: 12px; width: 50%; }
  .pay-table .mr { font-weight: 700; color: #14532d; font-size: 12px; text-align: right; }
  .pay-table tr:not(:last-child) td { padding-bottom: 5px; }

  /* ── Barcode ── */
  .barcode { text-align: center; font-family: monospace; font-size: 13px;
             letter-spacing: 4px; color: #334155; padding: 12px 0; }

  /* ── Footer ── */
  .receipt-footer { border-top: 1px dashed #cbd5e1; padding-top: 16px;
                    text-align: center; margin-top: 4px; }
  .receipt-footer .thank-you { font-size: 14px; font-weight: 700; color: #2563eb; margin-bottom: 4px; }
  .receipt-footer .note { font-size: 10.5px; color: #94a3b8; }

  @media print {
    @page { size: A4; margin: 12mm 15mm; }
    body { font-size: 12px; }
    .page { padding: 0; }
    .items-table tbody tr.even { background: #fff !important; }
    .items-table tbody tr.odd  { background: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .items-table thead tr      { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .totals-table tr.grand-total td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .title-band { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .pay-box    { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head>
<body><div class="page">

  <div class="receipt-header">
    ${headerHtml}
  </div>

  <div class="title-band">
    <h1>SALES RECEIPT</h1>
    ${receiptId ? `<div class="receipt-num">${receiptId}</div>` : ''}
  </div>

  ${metaRows ? `<table class="meta-table">${metaRows}</table>` : ''}

  <div class="section-title">Items Purchased</div>
  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th class="r">Qty</th>
        <th class="r">Unit Price</th>
        <th class="r">Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table class="totals-table">
    ${totalsRows}
  </table>

  ${payRows ? `<div class="pay-box"><table class="pay-table">${payRows}</table></div>` : ''}

  ${(data.customerItems || []).filter(r => r.name).length > 0 ? `
  <div class="brought-box">
    <div class="brought-title">Items Brought by Customer</div>
    <table class="brought-table">
      ${(data.customerItems).filter(r => r.name).map(r =>
        `<tr><td>${escHtml(r.name)}</td><td>${escHtml(String(r.quantity || ''))}</td></tr>`
      ).join('')}
    </table>
  </div>` : ''}

  ${barcodeHtml}

  <div class="receipt-footer">
    <div class="thank-you">${footer}</div>
    <div class="note">This is a computer-generated receipt.</div>
  </div>

</div></body></html>`;
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

    // Browser popup fallback - A4 size
    const width = 850; // A4 width in pixels at 96dpi
    const win = window.open('', '_blank', `width=${width},height=900`);
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
