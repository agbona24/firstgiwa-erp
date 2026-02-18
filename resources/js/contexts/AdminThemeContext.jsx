import { createContext, useContext, useState } from 'react';

const AdminThemeContext = createContext({});

export function AdminThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('admin_theme') || 'light';
    });

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        localStorage.setItem('admin_theme', next);
    };

    const isDark = theme === 'dark';

    // Reusable theme classes
    const t = {
        // Backgrounds
        pageBg: isDark ? 'bg-slate-800' : 'bg-slate-100',
        cardBg: isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200',
        sidebarBg: isDark ? 'bg-slate-900' : 'bg-white',
        headerBg: isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200',
        inputBg: isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-300',
        modalBg: isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200',
        rowHover: isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50',
        tableDivide: isDark ? 'divide-slate-800' : 'divide-slate-100',
        tableBorder: isDark ? 'border-slate-700' : 'border-slate-200',
        overlay: isDark ? 'bg-black/60' : 'bg-black/30',

        // Text
        textPrimary: isDark ? 'text-white' : 'text-slate-900',
        textSecondary: isDark ? 'text-slate-400' : 'text-slate-600',
        textMuted: isDark ? 'text-slate-500' : 'text-slate-400',
        textLabel: isDark ? 'text-slate-400' : 'text-slate-500',
        textTableHead: isDark ? 'text-slate-400' : 'text-slate-500',

        // Sidebar
        sidebarBorder: isDark ? 'border-slate-700' : 'border-slate-200',
        sidebarText: isDark ? 'text-slate-400' : 'text-slate-600',
        sidebarHover: isDark ? 'hover:text-white hover:bg-slate-700/50' : 'hover:text-slate-900 hover:bg-slate-100',
        sidebarActive: isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20',
        sidebarToggle: isDark ? 'text-slate-500 hover:text-white hover:bg-slate-700/50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100',

        // Buttons
        btnSecondary: isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        btnGhost: isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900',

        // Badges / pills
        pillBg: isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-100 border-slate-200',
        pillText: isDark ? 'text-slate-300' : 'text-slate-700',

        // Progress bar bg
        progressBg: isDark ? 'bg-slate-700' : 'bg-slate-200',

        // Input
        inputText: isDark ? 'text-white' : 'text-slate-900',
        inputPlaceholder: isDark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400',
        inputFocus: 'focus:outline-none focus:border-blue-500',

        // Tabs
        tabActive: isDark ? 'border-blue-500 text-blue-400' : 'border-blue-600 text-blue-600',
        tabInactive: isDark ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-400 hover:text-slate-600',
    };

    return (
        <AdminThemeContext.Provider value={{ theme, isDark, toggleTheme, t }}>
            {children}
        </AdminThemeContext.Provider>
    );
}

export const useAdminTheme = () => useContext(AdminThemeContext);
