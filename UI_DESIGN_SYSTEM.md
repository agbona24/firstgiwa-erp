# UI Design System - Premium Deep Blue & Gold

## Overview
Enterprise-grade design system for FIRSTGIWA ERP with:
- Premium Deep Blue & Gold color palette
- Professional, trustworthy aesthetic
- Accessible (WCAG 2.1 AA compliant)
- Consistent across all modules
- Responsive design (desktop-first, mobile-compatible)
- Modern, clean interface

**Design Philosophy**: Professional, efficient, premium feel that inspires trust and confidence.

---

## Color System

### Primary Colors

```css
/* Deep Blue - Primary Brand Color */
--blue-900: #1e3a8a;    /* Darkest - Headers, important text */
--blue-800: #1e40af;    /* Primary - Main brand color */
--blue-700: #1d4ed8;    /* Buttons, links */
--blue-600: #2563eb;    /* Hover states */
--blue-500: #3b82f6;    /* Active states */
--blue-400: #60a5fa;    /* Lighter accents */
--blue-300: #93c5fd;    /* Very light accents */
--blue-100: #dbeafe;    /* Backgrounds */
--blue-50:  #eff6ff;    /* Lightest backgrounds */

/* Gold/Amber - Accent Color */
--gold-900: #78350f;    /* Dark gold */
--gold-800: #92400e;    /* Deep amber */
--gold-700: #b45309;    /* Accent text */
--gold-600: #d97706;    /* Primary gold */
--gold-500: #f59e0b;    /* Bright gold */
--gold-400: #fbbf24;    /* Light gold */
--gold-300: #fcd34d;    /* Pale gold */
--gold-100: #fef3c7;    /* Background gold */
--gold-50:  #fffbeb;    /* Lightest gold */
```

### Neutral Colors

```css
/* Slate Gray - Neutral Palette */
--slate-900: #0f172a;   /* Darkest text */
--slate-800: #1e293b;   /* Headers, important text */
--slate-700: #334155;   /* Body text */
--slate-600: #475569;   /* Secondary text */
--slate-500: #64748b;   /* Muted text */
--slate-400: #94a3b8;   /* Placeholder text */
--slate-300: #cbd5e1;   /* Borders */
--slate-200: #e2e8f0;   /* Light borders */
--slate-100: #f1f5f9;   /* Background light */
--slate-50:  #f8fafc;   /* Lightest background */

/* Pure */
--white: #ffffff;
--black: #000000;
```

### Semantic Colors

```css
/* Success - Green */
--success-700: #15803d;
--success-600: #16a34a;
--success-500: #22c55e;
--success-100: #dcfce7;

/* Warning - Amber */
--warning-700: #b45309;
--warning-600: #d97706;
--warning-500: #f59e0b;
--warning-100: #fef3c7;

/* Error - Red */
--error-700: #b91c1c;
--error-600: #dc2626;
--error-500: #ef4444;
--error-100: #fee2e2;

/* Info - Blue */
--info-700: #0369a1;
--info-600: #0284c7;
--info-500: #0ea5e9;
--info-100: #e0f2fe;
```

---

## Typography

### Font Stack

```css
/* Primary Font - System Fonts for Performance */
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;

/* Monospace for Code/Numbers */
--font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas,
  'Liberation Mono', 'Courier New', monospace;

/* Optional: Premium Font (if self-hosted) */
--font-premium: 'Inter', var(--font-sans);
```

### Font Sizes

```css
--text-xs:    0.75rem;    /* 12px - Captions */
--text-sm:    0.875rem;   /* 14px - Small text */
--text-base:  1rem;       /* 16px - Body text */
--text-lg:    1.125rem;   /* 18px - Large body */
--text-xl:    1.25rem;    /* 20px - Section headers */
--text-2xl:   1.5rem;     /* 24px - Page headers */
--text-3xl:   1.875rem;   /* 30px - Large headers */
--text-4xl:   2.25rem;    /* 36px - Hero text */
--text-5xl:   3rem;       /* 48px - Display */
```

### Font Weights

```css
--font-light:     300;
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
--font-extrabold: 800;
```

### Line Heights

```css
--leading-tight:  1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

---

## Spacing System

### Spacing Scale

```css
--space-0:    0;
--space-1:    0.25rem;  /* 4px */
--space-2:    0.5rem;   /* 8px */
--space-3:    0.75rem;  /* 12px */
--space-4:    1rem;     /* 16px */
--space-5:    1.25rem;  /* 20px */
--space-6:    1.5rem;   /* 24px */
--space-8:    2rem;     /* 32px */
--space-10:   2.5rem;   /* 40px */
--space-12:   3rem;     /* 48px */
--space-16:   4rem;     /* 64px */
--space-20:   5rem;     /* 80px */
--space-24:   6rem;     /* 96px */
```

---

## Components

### Buttons

```css
/* Primary Button - Deep Blue */
.btn-primary {
  background: linear-gradient(135deg, var(--blue-800) 0%, var(--blue-600) 100%);
  color: var(--white);
  font-weight: var(--font-semibold);
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  border: none;
  box-shadow: 0 2px 4px rgba(30, 64, 175, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--blue-700) 0%, var(--blue-500) 100%);
  box-shadow: 0 4px 8px rgba(30, 64, 175, 0.3);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(30, 64, 175, 0.2);
}

.btn-primary:disabled {
  background: var(--slate-300);
  cursor: not-allowed;
  box-shadow: none;
}

/* Secondary Button - Gold */
.btn-secondary {
  background: linear-gradient(135deg, var(--gold-600) 0%, var(--gold-500) 100%);
  color: var(--white);
  font-weight: var(--font-semibold);
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  border: none;
  box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, var(--gold-500) 0%, var(--gold-400) 100%);
  box-shadow: 0 4px 8px rgba(217, 119, 6, 0.3);
  transform: translateY(-1px);
}

/* Outline Button */
.btn-outline {
  background: transparent;
  color: var(--blue-700);
  border: 2px solid var(--blue-700);
  font-weight: var(--font-semibold);
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background: var(--blue-50);
  border-color: var(--blue-800);
  color: var(--blue-800);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--slate-700);
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}

/* Danger Button */
.btn-danger {
  background: var(--error-600);
  color: var(--white);
  font-weight: var(--font-semibold);
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  border: none;
}

.btn-danger:hover {
  background: var(--error-700);
}

/* Button Sizes */
.btn-sm {
  padding: 0.5rem 1rem;
  font-size: var(--text-sm);
}

.btn-lg {
  padding: 0.875rem 1.75rem;
  font-size: var(--text-lg);
}
```

### Cards

```css
.card {
  background: var(--white);
  border-radius: 0.75rem;
  border: 1px solid var(--slate-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-header {
  border-bottom: 2px solid var(--blue-100);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.card-header-premium {
  background: linear-gradient(135deg, var(--blue-800) 0%, var(--blue-600) 100%);
  color: var(--white);
  padding: 1.25rem;
  margin: -1.5rem -1.5rem 1.5rem;
  border-radius: 0.75rem 0.75rem 0 0;
}

.card-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--slate-900);
  margin: 0;
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--slate-600);
  margin-top: 0.25rem;
}

.card-footer {
  border-top: 1px solid var(--slate-200);
  padding-top: 1rem;
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
```

### Forms

```css
.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--slate-700);
  margin-bottom: 0.5rem;
}

.form-label-required::after {
  content: " *";
  color: var(--error-600);
}

.form-input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: var(--text-base);
  color: var(--slate-900);
  background: var(--white);
  border: 2px solid var(--slate-300);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--blue-600);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background: var(--slate-100);
  color: var(--slate-500);
  cursor: not-allowed;
}

.form-input-error {
  border-color: var(--error-600);
}

.form-input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-help-text {
  font-size: var(--text-sm);
  color: var(--slate-600);
  margin-top: 0.25rem;
}

.form-error-text {
  font-size: var(--text-sm);
  color: var(--error-600);
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Select Dropdown */
.form-select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: var(--text-base);
  background: var(--white);
  border: 2px solid var(--slate-300);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: var(--blue-600);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Checkbox & Radio */
.form-checkbox,
.form-radio {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--slate-300);
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-checkbox {
  border-radius: 0.25rem;
}

.form-radio {
  border-radius: 50%;
}

.form-checkbox:checked,
.form-radio:checked {
  background: var(--blue-600);
  border-color: var(--blue-600);
}
```

### Tables

```css
.table-container {
  overflow-x: auto;
  border-radius: 0.75rem;
  border: 1px solid var(--slate-200);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table thead {
  background: linear-gradient(135deg, var(--blue-800) 0%, var(--blue-700) 100%);
  color: var(--white);
}

.table th {
  padding: 1rem;
  text-align: left;
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table td {
  padding: 1rem;
  border-bottom: 1px solid var(--slate-200);
  color: var(--slate-700);
}

.table tbody tr {
  transition: background 0.2s ease;
}

.table tbody tr:hover {
  background: var(--blue-50);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* Striped Table */
.table-striped tbody tr:nth-child(even) {
  background: var(--slate-50);
}

.table-striped tbody tr:nth-child(even):hover {
  background: var(--blue-50);
}

/* Compact Table */
.table-compact th,
.table-compact td {
  padding: 0.5rem 0.75rem;
}
```

### Badges & Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-primary {
  background: var(--blue-100);
  color: var(--blue-800);
}

.badge-success {
  background: var(--success-100);
  color: var(--success-700);
}

.badge-warning {
  background: var(--warning-100);
  color: var(--warning-700);
}

.badge-error {
  background: var(--error-100);
  color: var(--error-700);
}

.badge-gold {
  background: var(--gold-100);
  color: var(--gold-800);
}

/* Status Badges */
.badge-pending {
  background: var(--warning-100);
  color: var(--warning-700);
}

.badge-approved {
  background: var(--success-100);
  color: var(--success-700);
}

.badge-rejected {
  background: var(--error-100);
  color: var(--error-700);
}

.badge-completed {
  background: var(--blue-100);
  color: var(--blue-800);
}
```

### Alerts & Notifications

```css
.alert {
  padding: 1rem 1.25rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
  margin-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.alert-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: var(--font-semibold);
  margin-bottom: 0.25rem;
}

.alert-message {
  font-size: var(--text-sm);
}

.alert-info {
  background: var(--info-50);
  border-color: var(--info-600);
  color: var(--info-900);
}

.alert-success {
  background: var(--success-50);
  border-color: var(--success-600);
  color: var(--success-900);
}

.alert-warning {
  background: var(--warning-50);
  border-color: var(--warning-600);
  color: var(--warning-900);
}

.alert-error {
  background: var(--error-50);
  border-color: var(--error-600);
  color: var(--error-900);
}
```

### Modal/Dialog

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: var(--white);
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
              0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.modal-header {
  background: linear-gradient(135deg, var(--blue-800) 0%, var(--blue-600) 100%);
  color: var(--white);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  color: var(--white);
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.25rem;
}

.modal-body {
  padding: 1.5rem;
  max-height: calc(90vh - 200px);
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--slate-200);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Layout

### Navigation Bar

```css
.navbar {
  background: linear-gradient(135deg, var(--blue-900) 0%, var(--blue-800) 100%);
  color: var(--white);
  padding: 0 2rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--white);
  text-decoration: none;
}

.navbar-logo {
  height: 2.5rem;
  width: auto;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.navbar-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: color 0.2s ease;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.navbar-link:hover {
  color: var(--white);
  background: rgba(255, 255, 255, 0.1);
}

.navbar-link-active {
  color: var(--white);
  background: var(--gold-600);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 0.2s ease;
}

.navbar-user:hover {
  background: rgba(255, 255, 255, 0.15);
}

.navbar-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid var(--gold-400);
}
```

### Sidebar

```css
.sidebar {
  width: 16rem;
  height: 100vh;
  background: var(--slate-50);
  border-right: 1px solid var(--slate-200);
  padding: 1.5rem 0;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 2rem;
}

.sidebar-section-title {
  padding: 0 1.5rem;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--slate-500);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-menu-item {
  margin-bottom: 0.25rem;
}

.sidebar-menu-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: var(--slate-700);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: all 0.2s ease;
}

.sidebar-menu-link:hover {
  background: var(--blue-50);
  color: var(--blue-800);
}

.sidebar-menu-link-active {
  background: linear-gradient(90deg, var(--blue-600) 0%, var(--blue-500) 100%);
  color: var(--white);
  border-left: 4px solid var(--gold-600);
}

.sidebar-menu-icon {
  width: 1.25rem;
  height: 1.25rem;
}
```

### Dashboard Layout

```css
.dashboard {
  display: grid;
  grid-template-columns: 16rem 1fr;
  min-height: 100vh;
}

.dashboard-main {
  padding: 2rem;
  background: var(--slate-50);
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--slate-900);
  margin-bottom: 0.5rem;
}

.dashboard-subtitle {
  font-size: var(--text-base);
  color: var(--slate-600);
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--white);
  border-radius: 0.75rem;
  padding: 1.5rem;
  border-left: 4px solid var(--blue-600);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.stat-card-gold {
  border-left-color: var(--gold-600);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--slate-600);
  font-weight: var(--font-medium);
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--slate-900);
  font-family: var(--font-mono);
}

.stat-change {
  font-size: var(--text-sm);
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-change-positive {
  color: var(--success-600);
}

.stat-change-negative {
  color: var(--error-600);
}
```

---

## Responsive Design

```css
/* Tablet (768px and below) */
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    left: -16rem;
    z-index: 100;
    transition: left 0.3s ease;
  }

  .sidebar-open {
    left: 0;
  }

  .dashboard-stats {
    grid-template-columns: 1fr;
  }

  .table-container {
    font-size: var(--text-xs);
  }
}

/* Mobile (480px and below) */
@media (max-width: 480px) {
  .navbar {
    padding: 0 1rem;
  }

  .dashboard-main {
    padding: 1rem;
  }

  .modal {
    width: 95%;
    max-height: 95vh;
  }
}
```

---

## Dark Mode Support (Future)

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: var(--slate-900);
    --bg-secondary: var(--slate-800);
    --text-primary: var(--slate-50);
    --text-secondary: var(--slate-300);
    --border-color: var(--slate-700);
  }

  /* Component overrides for dark mode */
}
```

---

## Accessibility

### Focus Indicators

```css
*:focus {
  outline: 3px solid var(--blue-500);
  outline-offset: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Animation & Transitions

```css
/* Smooth transitions */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* Loading spinner */
.spinner {
  border: 3px solid var(--slate-200);
  border-top-color: var(--blue-600);
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Pulse animation */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

## Implementation Guide

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#eff6ff',
          // ... rest of blue palette
          900: '#1e3a8a',
        },
        gold: {
          50: '#fffbeb',
          // ... rest of gold palette
          900: '#78350f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### React Component Example

```tsx
// Example: PremiumButton component
import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all'

  const variantClasses = {
    primary: 'bg-gradient-to-br from-blue-800 to-blue-600 text-white hover:from-blue-700 hover:to-blue-500',
    secondary: 'bg-gradient-to-br from-gold-600 to-gold-500 text-white hover:from-gold-500 hover:to-gold-400',
    outline: 'bg-transparent border-2 border-blue-700 text-blue-700 hover:bg-blue-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100'
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg'
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
```

---

**Document Version**: 1.0
**Design System**: Premium Deep Blue & Gold
**Framework**: React + TailwindCSS + Vite
**Last Updated**: 2026-01-31
