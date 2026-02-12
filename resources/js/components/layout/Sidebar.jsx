import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { companyAPI } from '../../services/settingsAPI';

export default function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) {
    const location = useLocation();
    const [companyLogoUrl, setCompanyLogoUrl] = useState(() => localStorage.getItem('company_logo_url') || '');
    const [companyName, setCompanyName] = useState(() => localStorage.getItem('company_name') || 'FactoryPulse');

    const normalizeLogoUrl = (value) => {
        if (!value) return '';
        if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/storage/')) {
            return value;
        }
        return `/storage/${value.replace(/^\/+/, '')}`;
    };

    useEffect(() => {
        let active = true;

        const loadCompanyLogo = async () => {
            try {
                const res = await companyAPI.get();
                const logoUrl = normalizeLogoUrl(res.data?.data?.logo_url || '');
                const name = res.data?.data?.name || '';
                if (!active) return;
                if (logoUrl) {
                    setCompanyLogoUrl(logoUrl);
                    localStorage.setItem('company_logo_url', logoUrl);
                }
                if (name) {
                    setCompanyName(name);
                    localStorage.setItem('company_name', name);
                }
            } catch (error) {
                // Silent fail; sidebar should still render without a logo.
            }
        };

        const handleLogoUpdate = () => {
            const stored = normalizeLogoUrl(localStorage.getItem('company_logo_url') || '');
            setCompanyLogoUrl(stored);
            const storedName = localStorage.getItem('company_name') || 'FactoryPulse';
            setCompanyName(storedName);
        };

        loadCompanyLogo();
        window.addEventListener('company-logo-updated', handleLogoUpdate);

        return () => {
            active = false;
            window.removeEventListener('company-logo-updated', handleLogoUpdate);
        };
    }, []);

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const menuItems = [
        {
            section: 'Main',
            items: [
                {
                    name: 'Dashboard',
                    path: '/dashboard',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    )
                }
            ]
        },
        {
            section: 'Operations',
            items: [
                {
                    name: 'Inventory',
                    path: '/inventory',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    )
                },
                {
                    name: 'Production',
                    path: '/production',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    )
                },
                {
                    name: 'Formulas',
                    path: '/formulas',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    )
                },
                {
                    name: 'Purchase Orders',
                    path: '/purchase-orders',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    )
                },
                {
                    name: 'Sales Orders',
                    path: '/sales-orders',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )
                },
                {
                    name: 'POS System',
                    path: '/pos',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    )
                },
                {
                    name: 'Shift Reports',
                    path: '/pos/reports',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )
                }
            ]
        },
        {
            section: 'Contacts',
            items: [
                {
                    name: 'Customers',
                    path: '/customers',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                },
                {
                    name: 'Suppliers',
                    path: '/suppliers',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                    )
                }
            ]
        },
        {
            section: 'Finance',
            items: [
                {
                    name: 'Payments',
                    path: '/payments',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )
                },
                {
                    name: 'Expenses',
                    path: '/expenses',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )
                },
                {
                    name: 'Credit Facility',
                    path: '/credit-facility',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    )
                },
                {
                    name: 'Credit Payments',
                    path: '/credit-payments',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                },
                {
                    name: 'Accounting',
                    path: '/accounting',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    )
                },
                {
                    name: 'Profit & Loss',
                    path: '/profit-loss',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    )
                },
                {
                    name: 'VAT Report',
                    path: '/accounting/vat-report',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                        </svg>
                    )
                }
            ]
        },
        {
            section: 'HR & Payroll',
            items: [
                {
                    name: 'Staff',
                    path: '/staff',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                    )
                },
                {
                    name: 'Payroll',
                    path: '/payroll',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                }
            ]
        },
        {
            section: 'Administration',
            items: [
                {
                    name: 'Users',
                    path: '/users',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    )
                },
                {
                    name: 'Settings',
                    path: '/settings',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    )
                },
                {
                    name: 'Audit Trail',
                    path: '/audit',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )
                }
            ]
        }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onMobileClose}
                />
            )}

            {/* Sidebar */}
            <div data-tour="sidebar" className={`
                ${isCollapsed ? 'w-20' : 'w-64'}
                h-screen bg-slate-50 border-r border-slate-200 overflow-y-auto transition-all duration-300
                fixed lg:relative z-50
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Collapse Toggle (Desktop only) */}
                <div className="hidden lg:flex justify-end p-4">
                    <button
                        onClick={onToggle}
                        className="p-2 hover:bg-slate-200 rounded-lg transition"
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isCollapsed ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            )}
                        </svg>
                    </button>
                </div>

                <div className={`px-4 ${isCollapsed ? 'py-2' : 'py-4'} border-b border-slate-200`}>
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                            {companyLogoUrl ? (
                                <img src={companyLogoUrl} alt="Company logo" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-xs font-semibold text-slate-500">APP</span>
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="leading-tight">
                                <div className="text-sm font-semibold text-slate-800">{companyName}</div>
                                <div className="text-xs text-slate-500">Business Suite</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4">
                    {menuItems.map((section, idx) => (
                        <div key={idx} className="mb-6">
                            {!isCollapsed && (
                                <h3 className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                    {section.section}
                                </h3>
                            )}
                            <nav className="space-y-1">
                                {section.items.map((item, itemIdx) => {
                                    const active = isActive(item.path);
                                    return (
                                        <Link
                                            key={itemIdx}
                                            to={item.path}
                                            onClick={onMobileClose}
                                            className={`
                                                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                                ${isCollapsed ? 'justify-center' : ''}
                                                ${active
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md border-l-4 border-gold-600'
                                                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-800'
                                                }
                                            `}
                                            title={isCollapsed ? item.name : ''}
                                        >
                                            {item.icon}
                                            {!isCollapsed && <span>{item.name}</span>}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
