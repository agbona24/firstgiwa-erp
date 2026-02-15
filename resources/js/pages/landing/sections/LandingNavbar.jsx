import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStickyNavbar } from '../hooks/useStickyNavbar';

export default function LandingNavbar({ links, ctaPrimary, ctaSecondary }) {
    const isScrolled = useStickyNavbar(80);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleAnchorClick = (e, href) => {
        if (href.startsWith('#')) {
            e.preventDefault();
            const el = document.querySelector(href);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            setMobileOpen(false);
        }
    };

    return (
        <nav
            className={`
                fixed top-0 left-0 right-0 z-50 transition-all duration-300
                ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200'
                    : 'bg-transparent'
                }
            `}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className={`text-xl font-bold transition-colors duration-300 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                            Factory<span className="text-gold-500">Pulse</span>
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {links.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                onClick={(e) => handleAnchorClick(e, link.href)}
                                className={`text-sm font-medium transition-colors duration-300 hover:text-blue-500 ${
                                    isScrolled ? 'text-slate-600' : 'text-blue-100 hover:text-white'
                                }`}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            to={ctaSecondary.href}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                                isScrolled
                                    ? 'text-slate-700 hover:text-blue-600 hover:bg-blue-50'
                                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            {ctaSecondary.label}
                        </Link>
                        <Link
                            to={ctaPrimary.href}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                            {ctaPrimary.label}
                        </Link>
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? 'text-slate-700' : 'text-white'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={`
                    md:hidden overflow-hidden transition-all duration-300 bg-white border-t border-slate-100
                    ${mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="px-4 py-4 space-y-1">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={(e) => handleAnchorClick(e, link.href)}
                            className="block px-4 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                        <Link
                            to={ctaSecondary.href}
                            className="block px-4 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 text-center"
                        >
                            {ctaSecondary.label}
                        </Link>
                        <Link
                            to={ctaPrimary.href}
                            className="block px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg text-center shadow-md"
                        >
                            {ctaPrimary.label}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
