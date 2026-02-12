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
        // Credit transactions - each credit sale creates one
        Schema::create('customer_credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('sales_order_id')->nullable()->constrained()->onDelete('set null');
            $table->string('reference')->unique(); // CTX-2026-0001
            $table->decimal('amount', 15, 2); // Original credit amount
            $table->decimal('paid_amount', 15, 2)->default(0); // Amount paid so far
            $table->decimal('balance', 15, 2); // Remaining balance (amount - paid_amount)
            $table->date('transaction_date');
            $table->date('due_date');
            $table->date('paid_date')->nullable(); // When fully paid
            $table->integer('days_overdue')->default(0); // Calculated: current_date - due_date
            $table->enum('status', ['pending', 'partial', 'paid', 'overdue', 'written_off'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['customer_id', 'status']);
            $table->index(['due_date', 'status']);
        });

        // Credit payments - tracks each payment against credit transactions
        Schema::create('customer_credit_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->foreignId('credit_transaction_id')->constrained('customer_credit_transactions')->onDelete('cascade');
            $table->string('reference')->unique(); // CPY-2026-0001
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');
            $table->enum('payment_method', ['cash', 'transfer', 'pos', 'cheque'])->default('cash');
            $table->string('payment_reference')->nullable(); // Bank reference, cheque no, etc
            $table->boolean('is_on_time')->default(true); // Was payment before due date?
            $table->integer('days_late')->default(0); // If late, how many days
            $table->text('notes')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            $table->index(['customer_id', 'payment_date']);
        });

        // Customer credit score/metrics - calculated periodically
        Schema::create('customer_credit_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable();
            $table->foreignId('customer_id')->constrained()->onDelete('cascade');
            $table->integer('credit_score')->default(100); // 0-100 score
            $table->enum('risk_level', ['low', 'medium', 'high', 'critical'])->default('low');
            
            // Metrics
            $table->integer('total_transactions')->default(0);
            $table->integer('on_time_payments')->default(0);
            $table->integer('late_payments')->default(0);
            $table->decimal('avg_days_to_pay', 8, 2)->default(0);
            $table->decimal('total_credit_used', 15, 2)->default(0);
            $table->decimal('total_credit_paid', 15, 2)->default(0);
            $table->integer('current_overdue_count')->default(0);
            $table->decimal('current_overdue_amount', 15, 2)->default(0);
            $table->integer('longest_overdue_days')->default(0);
            
            // Recommendations
            $table->decimal('recommended_limit', 15, 2)->nullable();
            $table->integer('recommended_terms_days')->nullable();
            $table->text('recommendation_notes')->nullable();
            
            $table->timestamp('last_calculated_at')->nullable();
            $table->timestamps();
            
            $table->unique('customer_id');
        });

        // Add facility_type_id to customers table
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('credit_facility_type_id')->nullable()->after('credit_blocked');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('credit_facility_type_id');
        });
        Schema::dropIfExists('customer_credit_scores');
        Schema::dropIfExists('customer_credit_payments');
        Schema::dropIfExists('customer_credit_transactions');
    }
};
