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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('user_email')->nullable(); // Store email in case user is deleted
            $table->enum('action', ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'CANCEL', 'LOGIN', 'LOGOUT']);
            $table->nullableMorphs('auditable'); // The model being audited
            $table->string('auditable_type_display')->nullable(); // Human-readable type
            $table->string('auditable_reference')->nullable(); // e.g., SO-2026-001
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            // Indexes for faster queries (nullableMorphs already creates auditable index)
            $table->index(['user_id', 'created_at']);
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
