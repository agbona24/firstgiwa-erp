import { createContext, useContext, useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        variant: 'danger',
        onConfirm: null
    });

    const confirm = ({ title, message, confirmText, cancelText, variant }) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                title: title || 'Confirm Action',
                message: message || 'Are you sure you want to proceed?',
                confirmText: confirmText || 'Confirm',
                cancelText: cancelText || 'Cancel',
                variant: variant || 'danger',
                onConfirm: (result) => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                    resolve(result);
                }
            });
        });
    };

    const handleConfirm = () => {
        if (confirmState.onConfirm) {
            confirmState.onConfirm(true);
        }
    };

    const handleCancel = () => {
        if (confirmState.onConfirm) {
            confirmState.onConfirm(false);
        }
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <Modal
                isOpen={confirmState.isOpen}
                onClose={handleCancel}
                title={confirmState.title}
                size="sm"
            >
                <div className="p-6">
                    <p className="text-slate-700 mb-6">{confirmState.message}</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={handleCancel}>
                            {confirmState.cancelText}
                        </Button>
                        <Button variant={confirmState.variant} onClick={handleConfirm}>
                            {confirmState.confirmText}
                        </Button>
                    </div>
                </div>
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within ConfirmProvider');
    }
    return context;
}
