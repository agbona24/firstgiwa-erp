/**
 * QZ Tray integration service — direct/silent printing without browser dialogs.
 *
 * Setup:
 *   1. Download QZ Tray from https://qz.io/download/
 *   2. Install and run the QZ Tray application (runs as a system tray icon)
 *   3. QZ Tray opens a local WebSocket on port 8181/8182 — this library connects to it
 *
 * When QZ Tray is NOT installed the service gracefully falls back to browser popup printing.
 */

let _qz = null;

async function getLib() {
    if (_qz) return _qz;
    const mod = await import('qz-tray');
    _qz = mod.default || mod;
    // Suppress the default error handler so uncaught rejections don't log noise
    _qz.api.setPromiseType(Promise);
    return _qz;
}

/**
 * Detect if QZ Tray is running locally.
 * Resolves to true/false — never throws.
 */
export async function detect(timeoutMs = 3500) {
    try {
        const lib = await getLib();
        if (lib.websocket.isActive()) return true;

        await Promise.race([
            lib.websocket.connect({ retries: 1, delay: 0 }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('qz-timeout')), timeoutMs)
            ),
        ]);
        return lib.websocket.isActive();
    } catch {
        return false;
    }
}

/**
 * Returns true if a WebSocket connection to QZ Tray is currently active.
 */
export function isConnected() {
    return !!(_qz && _qz.websocket.isActive());
}

/**
 * Ensure WebSocket is connected before printing. Throws on failure.
 */
async function ensureConnected() {
    const lib = await getLib();
    if (!lib.websocket.isActive()) {
        await lib.websocket.connect({ retries: 2, delay: 500 });
    }
    return lib;
}

/**
 * Print an HTML string to a named printer.
 * @param {string} printerName  — exact printer name as seen by the OS
 * @param {string} htmlContent  — full HTML document string
 * @param {object} opts         — optional: { copies: 1, scaleContent: true }
 */
export async function printHTML(printerName, htmlContent, opts = {}) {
    const lib = await ensureConnected();
    const config = lib.configs.create(printerName, {
        copies: opts.copies || 1,
        scaleContent: opts.scaleContent !== false,
    });
    await lib.print(config, [
        { type: 'pixel', format: 'html', flavor: 'plain', data: htmlContent },
    ]);
}

/**
 * Fetch the list of printers known to QZ Tray / OS.
 * @returns {Promise<string[]>}
 */
export async function listPrinters() {
    const lib = await ensureConnected();
    return lib.printers.find();
}

/**
 * Disconnect from QZ Tray.
 */
export async function disconnectQZ() {
    if (_qz && _qz.websocket.isActive()) {
        await _qz.websocket.disconnect();
    }
}

export default { detect, isConnected, printHTML, listPrinters, disconnectQZ };
