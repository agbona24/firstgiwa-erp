const CURRENCY_LOCALES = {
    NGN: 'en-NG',
    USD: 'en-US',
    GBP: 'en-GB',
    EUR: 'de-DE',
};

const DEFAULT_CURRENCY = {
    code: 'NGN',
    symbol: '₦',
    locale: 'en-NG',
};

export const getCurrencyConfig = () => {
    const code = localStorage.getItem('currency_code') || DEFAULT_CURRENCY.code;
    const symbol = localStorage.getItem('currency_symbol') || DEFAULT_CURRENCY.symbol;
    const locale = CURRENCY_LOCALES[code] || DEFAULT_CURRENCY.locale;
    return { code, symbol: symbol || DEFAULT_CURRENCY.symbol, locale };
};

export const getCurrencySymbol = () => getCurrencyConfig().symbol;

export const formatCurrency = (value, options = {}) => {
    const { symbol, locale } = getCurrencyConfig();
    const number = Number(value || 0);
    const min = options.minimumFractionDigits ?? 2;
    const max = options.maximumFractionDigits ?? min;
    return `${symbol}${number.toLocaleString(locale, {
        minimumFractionDigits: min,
        maximumFractionDigits: max,
    })}`;
};
