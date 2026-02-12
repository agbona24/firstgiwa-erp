<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Staff;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    /**
     * Display a listing of departments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Department::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Active filter
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Update staff counts
        $departments = $query->orderBy('name')->get();
        
        foreach ($departments as $dept) {
            $dept->staff_count = Staff::where('department', $dept->name)
                ->where('employment_status', 'active')
                ->count();
        }

        return response()->json([
            'data' => $departments,
            'message' => 'Departments retrieved successfully'
        ]);
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('departments')->where(function ($query) use ($request) {
                    return $query->where('tenant_id', $request->user()->tenant_id);
                }),
            ],
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('departments')->where(function ($query) use ($request) {
                    return $query->where('tenant_id', $request->user()->tenant_id);
                }),
            ],
            'description' => 'nullable|string|max:500',
            'head_of_department' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        $validated['tenant_id'] = $request->user()->tenant_id;
        $validated['staff_count'] = 0;

        $department = Department::create($validated);

        return response()->json([
            'data' => $department,
            'message' => 'Department created successfully'
        ], 201);
    }

    /**
     * Display the specified department.
     */
    public function show(Department $department): JsonResponse
    {
        // Get staff in this department
        $staff = Staff::where('department', $department->name)
            ->select('id', 'staff_number', 'first_name', 'last_name', 'position', 'employment_status')
            ->get();

        $department->staff_count = $staff->where('employment_status', 'active')->count();
        $department->staff_list = $staff;

        return response()->json([
            'data' => $department,
            'message' => 'Department retrieved successfully'
        ]);
    }

    /**
     * Update the specified department.
     */
    public function update(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('departments')->where(function ($query) use ($request) {
                    return $query->where('tenant_id', $request->user()->tenant_id);
                })->ignore($department->id),
            ],
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('departments')->where(function ($query) use ($request) {
                    return $query->where('tenant_id', $request->user()->tenant_id);
                })->ignore($department->id),
            ],
            'description' => 'nullable|string|max:500',
            'head_of_department' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        // If name changed, update all staff with old department name
        if (isset($validated['name']) && $validated['name'] !== $department->name) {
            Staff::where('department', $department->name)
                ->update(['department' => $validated['name']]);
        }

        $department->update($validated);

        return response()->json([
            'data' => $department,
            'message' => 'Department updated successfully'
        ]);
    }

    /**
     * Remove the specified department.
     */
    public function destroy(Department $department): JsonResponse
    {
        // Check if department has active staff
        $activeStaff = Staff::where('department', $department->name)
            ->where('employment_status', 'active')
            ->count();

        if ($activeStaff > 0) {
            return response()->json([
                'message' => "Cannot delete department with {$activeStaff} active staff members. Reassign them first."
            ], 422);
        }

        $department->delete();

        return response()->json([
            'message' => 'Department deleted successfully'
        ]);
    }

    /**
     * Get department statistics.
     */
    public function stats(): JsonResponse
    {
        $departments = Department::all();
        
        $stats = [];
        foreach ($departments as $dept) {
            $staffCount = Staff::where('department', $dept->name)->count();
            $activeCount = Staff::where('department', $dept->name)
                ->where('employment_status', 'active')
                ->count();
            $totalSalary = Staff::where('department', $dept->name)
                ->where('employment_status', 'active')
                ->sum('basic_salary');

            $stats[] = [
                'id' => $dept->id,
                'name' => $dept->name,
                'code' => $dept->code,
                'total_staff' => $staffCount,
                'active_staff' => $activeCount,
                'total_salary' => $totalSalary,
            ];
        }

        return response()->json([
            'data' => $stats,
            'message' => 'Department statistics retrieved successfully'
        ]);
    }
}
