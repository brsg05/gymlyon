export type ToastVariant = "default" | "success" | "error";
export interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
let seq = 0;

function emit() {
  for (const l of listeners) l(toasts);
}

export function subscribe(l: Listener) {
  listeners.add(l);
  l(toasts);
  return () => {
    listeners.delete(l);
  };
}

export function toast(message: string, variant: ToastVariant = "default") {
  const id = ++seq;
  toasts = [...toasts, { id, message, variant }];
  emit();
  setTimeout(() => dismiss(id), 3500);
}

export function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}
