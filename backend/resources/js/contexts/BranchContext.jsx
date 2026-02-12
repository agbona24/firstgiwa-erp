import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const BranchContext = createContext();

const DEFAULT_BRANCH_ID = 1;

export function BranchProvider({ children, isAuthenticated = false }) {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch branches only when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchBranches();
        } else {
            // Set default branch for unauthenticated state
            setSelectedBranch({ id: DEFAULT_BRANCH_ID, name: 'Main Branch', code: 'MAIN' });
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Update API default params when branch changes
    useEffect(() => {
        if (selectedBranch) {
            // Store selected branch in localStorage
            localStorage.setItem('selected_branch_id', selectedBranch.id.toString());
        }
    }, [selectedBranch]);

    const fetchBranches = async () => {
        try {
            const response = await api.get('/branches');
            const branchData = response.data?.data?.branches || response.data?.data || response.data || [];
            setBranches(Array.isArray(branchData) ? branchData : []);
            
            // Get saved branch from localStorage or use default
            const savedBranchId = localStorage.getItem('selected_branch_id');
            const targetBranchId = savedBranchId ? parseInt(savedBranchId, 10) : DEFAULT_BRANCH_ID;
            
            // Find the branch or fall back to first branch or create a default
            let branch = branchData.find(b => b.id === targetBranchId);
            if (!branch && branchData.length > 0) {
                branch = branchData[0];
            }
            if (!branch) {
                // No branches in DB, create a default object
                branch = { id: DEFAULT_BRANCH_ID, name: 'Main Branch', code: 'MAIN' };
            }
            
            setSelectedBranch(branch);
        } catch (error) {
            console.error('Error fetching branches:', error);
            // Set a default branch on error
            setSelectedBranch({ id: DEFAULT_BRANCH_ID, name: 'Main Branch', code: 'MAIN' });
        } finally {
            setLoading(false);
        }
    };

    const changeBranch = (branchId) => {
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
            setSelectedBranch(branch);
        }
    };

    // Get the current branch ID (for API calls)
    const getBranchId = () => {
        return selectedBranch?.id || DEFAULT_BRANCH_ID;
    };

    return (
        <BranchContext.Provider value={{
            branches,
            selectedBranch,
            changeBranch,
            getBranchId,
            loading,
            refetchBranches: fetchBranches
        }}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (!context) {
        throw new Error('useBranch must be used within a BranchProvider');
    }
    return context;
}

export default BranchContext;
