<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    /**
     * Display a listing of staff members.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Staff::with(['user', 'branch']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('staff_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        // Department filter
        if ($request->filled('department')) {
            $query->where('department', $request->input('department'));
        }

        // Branch filter
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // Employment status filter
        if ($request->filled('employment_status')) {
            $query->where('employment_status', $request->input('employment_status'));
        }

        // Employment type filter
        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->input('employment_type'));
        }

        // Active status filter
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'first_name');
        $sortDir = $request->input('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        // Always return all results - DataTable handles client-side pagination
        $staff = $query->get();
        return response()->json($staff);
    }

    /**
     * Store a newly created staff member.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'nullable|email|unique:staff,email|max:255',
            'phone' => 'required|string|max:50',
            'address' => 'nullable|string|max:500',
            'department' => 'nullable|string|max:100',
            'position' => 'required|string|max:100',
            'employment_type' => 'required|in:full-time,part-time,contract',
            'date_of_birth' => 'nullable|date|before:today',
            'date_hired' => 'required|date',
            'basic_salary' => 'required|numeric|min:0',
            'salary_frequency' => 'required|in:monthly,weekly,daily',
            'housing_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'other_allowances' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'account_name' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:100',
            'national_id' => 'nullable|string|max:100',
            'pension_number' => 'nullable|string|max:100',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'emergency_contact_relationship' => 'nullable|string|max:100',
        ]);

        // Set tenant_id from authenticated user
        $validated['tenant_id'] = $request->user()->tenant_id;
        
        // Generate staff number
        $validated['staff_number'] = $this->generateStaffNumber();
        $validated['employment_status'] = 'active';
        $validated['is_active'] = true;

        $staff = Staff::create($validated);

        return response()->json([
            'message' => 'Staff member created successfully',
            'data' => $staff->load(['user', 'branch']),
        ], 201);
    }

    /**
     * Display the specified staff member.
     */
    public function show(int $id): JsonResponse
    {
        $staff = Staff::with(['user', 'branch', 'payrollItems' => function ($query) {
            $query->latest()->limit(12);
        }])->findOrFail($id);

        return response()->json(['data' => $staff]);
    }

    /**
     * Update the specified staff member.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'branch_id' => 'nullable|exists:branches,id',
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'email' => ['nullable', 'email', 'max:255', Rule::unique('staff')->ignore($staff->id)],
            'phone' => 'sometimes|required|string|max:50',
            'address' => 'nullable|string|max:500',
            'department' => 'nullable|string|max:100',
            'position' => 'sometimes|required|string|max:100',
            'employment_type' => 'sometimes|required|in:full-time,part-time,contract',
            'date_of_birth' => 'nullable|date|before:today',
            'employment_status' => 'sometimes|required|in:active,suspended,terminated,on-leave',
            'basic_salary' => 'sometimes|required|numeric|min:0',
            'salary_frequency' => 'sometimes|required|in:monthly,weekly,daily',
            'housing_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'other_allowances' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:50',
            'account_name' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:100',
            'national_id' => 'nullable|string|max:100',
            'pension_number' => 'nullable|string|max:100',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:50',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $staff->update($validated);

        return response()->json([
            'message' => 'Staff member updated successfully',
            'data' => $staff->fresh(['user', 'branch']),
        ]);
    }

    /**
     * Remove the specified staff member (soft delete).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $staff->update([
            'employment_status' => 'terminated',
            'date_terminated' => now(),
            'is_active' => false,
        ]);
        
        $staff->delete();

        return response()->json([
            'message' => 'Staff member deleted successfully',
        ]);
    }

    /**
     * Terminate a staff member.
     */
    public function terminate(Request $request, int $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $validated = $request->validate([
            'termination_date' => 'required|date',
            'reason' => 'nullable|string|max:500',
        ]);

        $staff->update([
            'employment_status' => 'terminated',
            'date_terminated' => $validated['termination_date'],
            'is_active' => false,
        ]);

        return response()->json([
            'message' => 'Staff member terminated successfully',
            'data' => $staff->fresh(),
        ]);
    }

    /**
     * Suspend a staff member.
     */
    public function suspend(Request $request, int $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        if ($staff->employment_status !== 'active') {
            return response()->json([
                'message' => 'Can only suspend active staff members.',
            ], 422);
        }

        $staff->update([
            'employment_status' => 'suspended',
            'is_active' => false,
        ]);

        return response()->json([
            'message' => 'Staff member suspended successfully',
            'data' => $staff->fresh(),
        ]);
    }

    /**
     * Reinstate a suspended or on-leave staff member.
     */
    public function reinstate(Request $request, int $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        if (!in_array($staff->employment_status, ['suspended', 'on-leave'])) {
            return response()->json([
                'message' => 'Can only reinstate suspended or on-leave staff members.',
            ], 422);
        }

        $staff->update([
            'employment_status' => 'active',
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Staff member reinstated successfully',
            'data' => $staff->fresh(),
        ]);
    }

    /**
     * Update staff salary.
     */
    public function updateSalary(Request $request, int $id): JsonResponse
    {
        $staff = Staff::findOrFail($id);

        $validated = $request->validate([
            'basic_salary' => 'required|numeric|min:0',
            'housing_allowance' => 'nullable|numeric|min:0',
            'transport_allowance' => 'nullable|numeric|min:0',
            'other_allowances' => 'nullable|numeric|min:0',
            'effective_date' => 'nullable|date',
            'reason' => 'nullable|string|max:500',
        ]);

        $staff->update([
            'basic_salary' => $validated['basic_salary'],
            'housing_allowance' => $validated['housing_allowance'] ?? $staff->housing_allowance,
            'transport_allowance' => $validated['transport_allowance'] ?? $staff->transport_allowance,
            'other_allowances' => $validated['other_allowances'] ?? $staff->other_allowances,
        ]);

        return response()->json([
            'message' => 'Salary updated successfully',
            'data' => $staff->fresh(),
        ]);
    }

    /**
     * Get staff by department.
     */
    public function byDepartment(Request $request): JsonResponse
    {
        $departments = Staff::active()
            ->select('department', DB::raw('COUNT(*) as count'))
            ->whereNotNull('department')
            ->groupBy('department')
            ->get();

        return response()->json(['data' => $departments]);
    }

    /**
     * Get staff summary/statistics.
     */
    public function summary(Request $request): JsonResponse
    {
        $summary = [
            'total_staff' => Staff::count(),
            'active_staff' => Staff::active()->count(),
            'by_status' => Staff::select('employment_status', DB::raw('COUNT(*) as count'))
                ->groupBy('employment_status')
                ->pluck('count', 'employment_status'),
            'by_type' => Staff::select('employment_type', DB::raw('COUNT(*) as count'))
                ->groupBy('employment_type')
                ->pluck('count', 'employment_type'),
            'by_department' => Staff::select('department', DB::raw('COUNT(*) as count'))
                ->whereNotNull('department')
                ->groupBy('department')
                ->pluck('count', 'department'),
            'total_payroll' => Staff::active()->sum(DB::raw('basic_salary + housing_allowance + transport_allowance + other_allowances')),
        ];

        return response()->json(['data' => $summary]);
    }

    /**
     * Generate a unique staff number.
     */
    protected function generateStaffNumber(): string
    {
        $prefix = 'EMP';
        $lastStaff = Staff::orderBy('id', 'desc')->first();
        $sequence = $lastStaff ? ($lastStaff->id + 1) : 1;
        
        return $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);
    }
}
