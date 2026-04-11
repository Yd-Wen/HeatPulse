import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-[#1a1a25] border border-[#2a2a3a] rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a3a]">
                  <h3 className="text-lg font-semibold text-[#f0f0f5]">{title}</h3>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-[#6b7280] hover:text-[#f0f0f5] hover:bg-[#2a2a3a] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="px-6 py-4">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2a2a3a] bg-[#0f0f15]">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-[#9ca3af]">{message}</p>
    </Modal>
  );
}
