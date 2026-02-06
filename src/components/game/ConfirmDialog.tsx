import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'BEVESTIG',
  cancelText = 'ANNULEER',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 z-[10000] backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-4 right-4 top-1/3 z-[10001] max-w-sm mx-auto"
          >
            <div className={`game-card p-5 shadow-2xl border-t-[3px] ${
              variant === 'danger' ? 'border-t-blood' : variant === 'warning' ? 'border-t-gold' : 'border-t-border'
            }`}>
              <div className="flex items-center gap-2.5 mb-3">
                {variant !== 'default' && (
                  <AlertTriangle size={18} className={variant === 'danger' ? 'text-blood' : 'text-gold'} />
                )}
                <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{message}</p>
              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded text-xs font-bold bg-muted border border-border text-muted-foreground"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 py-2.5 rounded text-xs font-bold ${
                    variant === 'danger'
                      ? 'bg-blood text-primary-foreground'
                      : 'bg-gold text-secondary-foreground'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
