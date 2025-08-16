import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
}

let listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: { type: 'ADD_TOAST'; toast: Toast } | { type: 'REMOVE_TOAST'; id: string }) {
  if (action.type === 'ADD_TOAST') {
    memoryState = {
      toasts: [...memoryState.toasts, action.toast],
    };
  } else if (action.type === 'REMOVE_TOAST') {
    memoryState = {
      toasts: memoryState.toasts.filter((t) => t.id !== action.id),
    };
  }
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  const toast = (props: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...props, id };
    
    dispatch({ type: 'ADD_TOAST', toast: newToast });
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', id });
    }, 5000);
  };

  const dismiss = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', id });
  };

  return {
    toasts: state.toasts,
    toast,
    dismiss,
  };
}