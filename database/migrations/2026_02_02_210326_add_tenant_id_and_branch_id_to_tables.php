<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add tenant_id to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('set null');
            $table->index('tenant_id');
            $table->index('branch_id');
        });

        // Add tenant_id to roles table
        Schema::table('roles', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id to permissions table  
        Schema::table('permissions', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id and branch_id to products table
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id to categories table
        Schema::table('categories', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id and branch_id to warehouses table
        Schema::table('warehouses', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('set null');
            $table->index('tenant_id');
            $table->index('branch_id');
        });

        // Add tenant_id and branch_id to inventory table
        Schema::table('inventory', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id to suppliers table
        Schema::table('suppliers', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id to customers table
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('set null');
            $table->index('tenant_id');
            $table->index('branch_id');
        });

        // Add tenant_id and branch_id to sales_orders table
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('set null');
            $table->index('tenant_id');
            $table->index('branch_id');
        });

        // Add tenant_id and branch_id to purchase_orders table
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('set null');
            $table->index('tenant_id');
            $table->index('branch_id');
        });

        // Add tenant_id and branch_id to payments table
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('set null');
            $table->index('tenant_id');
            $table->index('branch_id');
        });

        // Add tenant_id to audit_logs table
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id to transactions table if it exists
        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
                $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained()->onDelete('set null');
                $table->index('tenant_id');
                $table->index('branch_id');
            });
        }

        // Add tenant_id to inventory_batches table
        Schema::table('inventory_batches', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id to stock_movements table
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id to inventory_adjustments table
        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Add tenant_id to formulas table
        Schema::table('formulas', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            $table->index('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove tenant_id and branch_id from all tables
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['tenant_id', 'branch_id']);
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('permissions', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['tenant_id', 'branch_id']);
        });

        Schema::table('inventory', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['tenant_id', 'branch_id']);
        });

        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['tenant_id', 'branch_id']);
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['tenant_id', 'branch_id']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['tenant_id', 'branch_id']);
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        if (Schema::hasTable('transactions')) {
            Schema::table('transactions', function (Blueprint $table) {
                $table->dropForeign(['tenant_id']);
                $table->dropForeign(['branch_id']);
                $table->dropColumn(['tenant_id', 'branch_id']);
            });
        }

        Schema::table('inventory_batches', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('formulas', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
