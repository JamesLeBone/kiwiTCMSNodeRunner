import { useEffect, useRef } from 'react';
import { ActionBar, ActionButton } from '@/components/Actions'

interface ModalAction {
    label: string;
    onClick: () => void;
}

interface ModalProps {
    state: [boolean, (open: boolean) => void];
    children: React.ReactNode;
    actions?: ModalAction[];
}

export function Modal({ state, children, actions = [] }: ModalProps) {
    const ref = useRef<HTMLDialogElement>(null)
    useEffect(() => {
        if (state[0]) {
            ref.current?.showModal();
        } else {
            // Make sure the dialog is actually closed
            if (ref.current?.open) {
                ref.current?.close();
            }
        }
    }, [state])
    
    const close = () => {
        // Close the dialog immediately at DOM level
        if (ref.current?.open) {
            ref.current?.close();
        }
        // Update the React state
        state[1](false);
    }

    return <dialog ref={ref} onCancel={close}>
        <div>
            {children}
        </div>
        <ActionBar>
            <button onClick={close}>Close</button>
            {actions.map((action, index) => (
                <ActionButton 
                    key={index} 
                    onClick={action.onClick}
                    id={`modal-action-${index}`}
                >
                    {action.label}
                </ActionButton>
            ))}
        </ActionBar>
    </dialog>
}
