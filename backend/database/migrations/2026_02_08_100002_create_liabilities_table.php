<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Liabilities table for tracking debts, loans, and obligations
     */
    public function up(): void
    {
        Schema::create('liabilities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            
            // Liability identification
            $table->string('name');
            $table->string('reference')->unique()->nullable(); // e.g., LOAN-001
            $table->text('description')->nullable();
            
            // Liability classification
            $table->enum('category', [
                'bank_loan',       // Bank loans
                'equipment_loan',  // Loans for equipment purchase
                'vehicle_loan',    // Car/truck financing
                'mortgage',        // Property loans
                'credit_line',     // Line of credit
                'supplier_credit', // Extended credit from suppliers
                'tax_liability',   // Unpaid taxes
                'other'
            ])->default('bank_loan');
            
            $table->enum('type', [
                'short_term',  // Due within 1 year (current liability)
                'long_term'    // Due after 1 year (non-current liability)
            ])->default('long_term');
            
            // Financial details
            $table->decimal('principal_amount', 15, 2);      // Original amount borrowed
            $table->decimal('current_balance', 15, 2);       // Outstanding balance
            $table->decimal('interest_rate', 5, 2)->default(0); // Annual interest rate %
            $table->decimal('monthly_payment', 15, 2)->nullable();
            
            // Dates
            $table->date('start_date');
            $table->date('due_date')->nullable();            // Final payment date
            $table->date('next_payment_date')->nullable();
            $table->date('last_payment_date')->nullable();
            
            // Status
            $table->enum('status', [
                'active',      // Currently being paid
                'paid_off',    // Fully paid
                'defaulted',   // Payment missed
                'restructured' // Terms changed
            ])->default('active');
            
            // Creditor info
            $table->string('creditor_name');                 // Bank, supplier, etc.
            $table->string('creditor_contact')->nullable();
            $table->string('account_number')->nullable();
            
            // Collateral (if secured)
            $table->boolean('is_secured')->default(false);
            $table->string('collateral')->nullable();        // What's securing the loan
            
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['tenant_id', 'category']);
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'type']);
        });
        
        // Liability payments tracking
        Schema::create('liability_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('liability_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->decimal('principal_paid', 15, 2)->default(0);
            $table->decimal('interest_paid', 15, 2)->default(0);
            $table->date('payment_date');
            $table->string('payment_method')->nullable();
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('liability_payments');
        Schema::dropIfExists('liabilities');
    }
};
