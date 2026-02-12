# FIRSTGIWA ERP - Implementation Guide

## ✅ Completed Setup

### 1. Laravel 11 Backend
- ✅ Laravel 11 installed in `backend/` directory
- ✅ All dependencies installed via Composer
- ✅ Application key generated
- ✅ Default migrations run (SQLite - will change to PostgreSQL)

### 2. React 18 + Vite Frontend
- ✅ React 18 installed
- ✅ React Router DOM installed
- ✅ Vite configured for React
- ✅ TailwindCSS 4.0 pre-configured
- ✅ Directory structure created (`components/`, `pages/`, `hooks/`, `services/`)
- ✅ Main [App.jsx](backend/resources/js/app.jsx) created

### 3. cPanel Deployment Ready
- ✅ Single Laravel application structure
- ✅ React builds to Laravel's public directory
- ✅ Vite configured for production builds

---

## 📁 Current Project Structure

```
firstgiwa-erp/
├── backend/                    # Laravel 11 application
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   ├── Models/
│   │   └── Services/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── resources/
│   │   ├── js/                 # React application
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Page components
│   │   │   │   └── auth/      # Login, Register
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API services
│   │   │   ├── utils/          # Utility functions
│   │   │   ├── layouts/        # Layout components
│   │   │   ├── app.jsx         # React entry point
│   │   │   └── App.jsx         # Main App component
│   │   └── css/
│   │       └── app.css         # TailwindCSS styles
│   ├── routes/
│   │   ├── web.php
│   │   └── api.php
│   ├── public/                 # Web root (cPanel points here)
│   ├── .env
│   ├── composer.json
│   ├── package.json
│   └── vite.config.js
│
├── Architecture Documentation/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── RBAC.md
│   ├── DATABASE_SCHEMA.md
│   ├── DATABASE_SCHEMA_PART2.md
│   ├── INVENTORY.md
│   ├── PURCHASE_ORDERS.md
│   ├── SALES_ORDERS.md
│   ├── POS_SYSTEM.md
│   ├── PAYMENTS.md
│   ├── AUDIT_TRAIL.md
│   └── UI_DESIGN_SYSTEM.md
│
└── IMPLEMENTATION_GUIDE.md (this file)
```

---

## 🚀 Next Steps

### Phase 1: Database Setup (Week 1)

#### 1.1 Configure PostgreSQL

**Update `.env` file:**
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=firstgiwa_erp
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

**Test connection:**
```bash
cd backend
php artisan migrate:fresh
```

#### 1.2 Create RBAC Migrations

**Generate migrations:**
```bash
php artisan make:migration create_roles_table
php artisan make:migration create_permissions_table
php artisan make:migration create_role_permissions_table
php artisan make:migration create_user_roles_table
php artisan make:migration update_users_table_for_rbac
```

**Reference:** See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for complete table structures.

---

### Phase 2: Authentication Setup (Week 1-2)

#### 2.1 Install Laravel Sanctum

```bash
cd backend
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

#### 2.2 Configure Sanctum

**In `config/sanctum.php`:**
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1')),
```

**In `bootstrap/app.php`:**
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    ]);
})
```

#### 2.3 Create Authentication Controllers

```bash
php artisan make:controller API/AuthController
```

**AuthController methods:**
- `login()` - Login and issue token
- `logout()` - Revoke token
- `me()` - Get current user
- `refresh()` - Refresh token

---

### Phase 3: UI Components & TailwindCSS (Week 2)

#### 3.1 Configure TailwindCSS with Deep Blue & Gold Theme

**Create `resources/css/app.css`:**
```css
@import "tailwindcss";

@theme {
  /* Deep Blue & Gold Colors */
  --color-blue-50: #eff6ff;
  --color-blue-100: #dbeafe;
  --color-blue-600: #2563eb;
  --color-blue-700: #1d4ed8;
  --color-blue-800: #1e40af;
  --color-blue-900: #1e3a8a;

  --color-gold-50: #fffbeb;
  --color-gold-100: #fef3c7;
  --color-gold-500: #f59e0b;
  --color-gold-600: #d97706;
  --color-gold-700: #b45309;

  /* Component Styles */
  --spinner-border: 3px solid var(--color-slate-200);
  --spinner-border-top-color: var(--color-blue-600);
}

.spinner {
  border: var(--spinner-border);
  border-top-color: var(--spinner-border-top-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### 3.2 Create Core UI Components

**Button Component** (`resources/js/components/Button.jsx`):
```jsx
export default function Button({ variant = 'primary', size = 'md', children, ...props }) {
  const baseClasses = 'font-semibold rounded-lg transition-all';

  const variants = {
    primary: 'bg-gradient-to-br from-blue-800 to-blue-600 text-white hover:from-blue-700',
    secondary: 'bg-gradient-to-br from-gold-600 to-gold-500 text-white hover:from-gold-500',
    outline: 'border-2 border-blue-700 text-blue-700 hover:bg-blue-50',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5',
    lg: 'px-7 py-3.5 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### 3.3 Create Login Page

**File:** `resources/js/pages/auth/Login.jsx`

See [UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md) for complete component library.

---

### Phase 4: Create Laravel Routes & API (Week 2-3)

#### 4.1 API Routes (`routes/api.php`)

```php
use App\Http\Controllers\API\AuthController;

Route::prefix('v1')->group(function () {
    // Public routes
    Route::post('/login', [AuthController::class, 'login']);

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // User management
        Route::apiResource('users', UserController::class);
        Route::apiResource('roles', RoleController::class);
        Route::apiResource('permissions', PermissionController::class);

        // Inventory
        Route::apiResource('products', ProductController::class);
        Route::apiResource('warehouses', WarehouseController::class);
        Route::get('/inventory/stock', [InventoryController::class, 'index']);

        // More routes as per architecture...
    });
});
```

#### 4.2 Web Routes for SPA (`routes/web.php`)

```php
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
```

#### 4.3 Create Blade Template (`resources/views/app.blade.php`)

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>FIRSTGIWA ERP</title>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
```

---

### Phase 5: Implement RBAC Models (Week 3-4)

Create models following the architecture in [RBAC.md](RBAC.md):

```bash
php artisan make:model Role -m
php artisan make:model Permission -m
php artisan make:model RolePermission -m
php artisan make:model UserRole -m
```

**Add relationships in User model:**
```php
public function roles() {
    return $this->belongsToMany(Role::class, 'user_roles');
}

public function permissions() {
    return $this->hasManyThrough(Permission::class, RolePermission::class, ...);
}

public function hasPermission($permission) {
    return $this->permissions()->where('name', $permission)->exists();
}
```

---

### Phase 6: Implement Audit Trail (Week 4)

#### 6.1 Create Audit Log Model & Migration

```bash
php artisan make:model AuditLog -m
```

Reference [AUDIT_TRAIL.md](AUDIT_TRAIL.md) for complete implementation.

#### 6.2 Create Audit Middleware

```bash
php artisan make:middleware AuditLogger
```

---

## 💻 Development Workflow

### Local Development

```bash
# Terminal 1: Laravel backend
cd backend
php artisan serve

# Terminal 2: Vite dev server
cd backend
npm run dev
```

Visit: `http://localhost:8000`

---

### Production Build for cPanel

```bash
cd backend

# Build React assets
npm run build

# Clear Laravel cache
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🚢 cPanel Deployment Steps

### 1. Prepare Files

```bash
# On local machine
cd backend
npm run build
composer install --optimize-autoloader --no-dev
```

### 2. Upload to cPanel

- Upload entire `backend/` directory to cPanel
- **Document Root**: Point to `public/` directory

### 3. cPanel Configuration

**In cPanel File Manager:**

1. **Set Document Root:**
   - Go to: Domains → Domain Name → Document Root
   - Set to: `/home/username/firstgiwa-erp/backend/public`

2. **Setup .htaccess** (should already exist in `public/`):
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>
```

3. **Environment Variables:**
   - Copy `.env.example` to `.env`
   - Update database credentials
   - Set `APP_ENV=production`
   - Set `APP_DEBUG=false`
   - Generate new `APP_KEY`

4. **Database:**
   - Create PostgreSQL database in cPanel
   - Import schema (if needed)
   - Run migrations: `php artisan migrate --force`

5. **Permissions:**
```bash
chmod -R 755 storage bootstrap/cache
```

### 4. Test Deployment

Visit your domain - React app should load!

---

## 📖 Reference Documentation

All architectural decisions, database schemas, and design patterns are documented:

1. **[README.md](README.md)** - Start here for overview
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
3. **[RBAC.md](RBAC.md)** - Security & permissions (9 roles, 100+ permissions)
4. **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Complete database design
5. **[INVENTORY.md](INVENTORY.md)** - Inventory management
6. **[POS_SYSTEM.md](POS_SYSTEM.md)** - Point of sale
7. **[PAYMENTS.md](PAYMENTS.md)** - Payment processing
8. **[AUDIT_TRAIL.md](AUDIT_TRAIL.md)** - Compliance & audit logging
9. **[UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md)** - UI components & theme

---

## 🎯 Implementation Checklist

Use this to track your progress:

### Week 1-2: Foundation
- [ ] Configure PostgreSQL database
- [ ] Create all RBAC migrations
- [ ] Install & configure Laravel Sanctum
- [ ] Create authentication API endpoints
- [ ] Create login UI
- [ ] Test authentication flow

### Week 3-4: Core Models
- [ ] Create all models (User, Role, Permission, etc.)
- [ ] Implement model relationships
- [ ] Create seeders for initial data
- [ ] Implement audit logging middleware
- [ ] Test RBAC permissions

### Week 5-8: Business Modules
- [ ] Implement Inventory module
- [ ] Implement Purchase Orders
- [ ] Implement Sales Orders
- [ ] Implement POS system
- [ ] Implement Payments

### Week 9-12: UI & Polish
- [ ] Build all UI components
- [ ] Create all page layouts
- [ ] Implement data tables
- [ ] Create forms with validation
- [ ] Add loading states & error handling

### Week 13-16: Reports & Dashboard
- [ ] Implement dashboard analytics
- [ ] Create all reports (inventory, sales, purchases)
- [ ] Build export functionality
- [ ] Optimize performance

### Week 17-20: Testing & Deployment
- [ ] Write unit tests
- [ ] Write feature tests
- [ ] User acceptance testing (UAT)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deploy to cPanel

---

## 🆘 Troubleshooting

### Common Issues

**1. Vite not compiling:**
```bash
npm install
npm run build
```

**2. Laravel routes not working:**
```bash
php artisan route:clear
php artisan config:clear
```

**3. Permission denied errors:**
```bash
chmod -R 775 storage bootstrap/cache
```

**4. Database connection issues:**
- Check `.env` database credentials
- Verify PostgreSQL is running
- Test connection: `php artisan tinker` → `DB::connection()->getPdo();`

---

## 📞 Support

For questions about the architecture, refer to the documentation files.
For Laravel issues: https://laravel.com/docs
For React issues: https://react.dev

---

**Last Updated**: 2026-01-31
**Status**: Foundation Complete - Ready for Development
**Next**: Configure PostgreSQL & Create Migrations
