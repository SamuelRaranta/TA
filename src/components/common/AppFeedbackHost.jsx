import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle,
  Info,
  WarningCircle,
  XCircle,
  ShieldCheck,
  X
} from '@phosphor-icons/react';
import {
  subscribeAppFeedback,
  resolveAppDialog,
  dismissAppToast
} from '../../lib/appFeedback';

const TONE_STYLES = {
  success: {
    icon: CheckCircle,
    color: '#047857',
    soft: '#ecfdf5',
    border: '#a7f3d0',
    glow: 'rgba(16, 185, 129, 0.28)',
    fallbackTitle: 'Berhasil'
  },
  error: {
    icon: XCircle,
    color: '#b91c1c',
    soft: '#fef2f2',
    border: '#fecaca',
    glow: 'rgba(239, 68, 68, 0.24)',
    fallbackTitle: 'Terjadi Kendala'
  },
  danger: {
    icon: WarningCircle,
    color: '#b91c1c',
    soft: '#fef2f2',
    border: '#fecaca',
    glow: 'rgba(239, 68, 68, 0.24)',
    fallbackTitle: 'Konfirmasi'
  },
  warning: {
    icon: WarningCircle,
    color: '#b45309',
    soft: '#fffbeb',
    border: '#fde68a',
    glow: 'rgba(245, 158, 11, 0.26)',
    fallbackTitle: 'Perhatian'
  },
  info: {
    icon: Info,
    color: '#1d4ed8',
    soft: '#eff6ff',
    border: '#bfdbfe',
    glow: 'rgba(37, 99, 235, 0.22)',
    fallbackTitle: 'Informasi'
  }
};

const getTone = (tone) => TONE_STYLES[tone] || TONE_STYLES.info;

function DialogCard({ dialog }) {
  const tone = getTone(dialog.tone);
  const Icon = dialog.tone === 'success' && dialog.kind === 'confirm' ? ShieldCheck : tone.icon;
  const confirmRef = useRef(null);
  const isDestructive = dialog.tone === 'danger' || dialog.tone === 'error';

  useEffect(() => {
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [dialog.id]);

  return (
    <motion.div
      className="app-dialog-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && dialog.dismissible) {
          resolveAppDialog(dialog.id, false);
        }
      }}
    >
      <motion.div
        className="app-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`app-dialog-title-${dialog.id}`}
        aria-describedby={dialog.message ? `app-dialog-desc-${dialog.id}` : undefined}
        style={{
          '--app-dialog-accent': tone.color,
          '--app-dialog-accent-soft': tone.border
        }}
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {dialog.dismissible && (
          <button
            type="button"
            className="app-dialog-close"
            aria-label="Tutup dialog"
            onClick={() => resolveAppDialog(dialog.id, false)}
          >
            <X size={16} weight="bold" />
          </button>
        )}

        <div
          className="app-dialog-icon"
          style={{
            color: tone.color,
            background: tone.soft,
            borderColor: tone.border,
            boxShadow: `0 0 0 8px ${tone.soft}, 0 10px 24px -12px ${tone.glow}`
          }}
        >
          <Icon size={30} weight="fill" />
        </div>

        <h2 className="app-dialog-title" id={`app-dialog-title-${dialog.id}`}>
          {dialog.title || tone.fallbackTitle}
        </h2>

        {dialog.message && (
          <p className="app-dialog-message" id={`app-dialog-desc-${dialog.id}`}>
            {dialog.message}
          </p>
        )}

        <div className="app-dialog-actions">
          {dialog.kind === 'confirm' && (
            <button
              type="button"
              className="app-dialog-btn app-dialog-btn-ghost"
              onClick={() => resolveAppDialog(dialog.id, false)}
            >
              {dialog.cancelLabel || 'Batal'}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            className={`app-dialog-btn app-dialog-btn-primary${isDestructive ? ' is-destructive' : ''}`}
            onClick={() => resolveAppDialog(dialog.id, true)}
          >
            {dialog.confirmLabel || 'Mengerti'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ToastItem({ toast }) {
  const tone = getTone(toast.tone);
  const Icon = tone.icon;

  return (
    <motion.div
      layout
      className={`app-toast app-toast-${toast.tone}`}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: -14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 28, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <span
        className="app-toast-icon"
        style={{ color: tone.color, background: tone.soft, borderColor: tone.border }}
      >
        <Icon size={18} weight="fill" />
      </span>
      <div className="app-toast-body">
        {toast.title && <strong className="app-toast-title">{toast.title}</strong>}
        <span className="app-toast-message">{toast.message}</span>
      </div>
      <button
        type="button"
        className="app-toast-close"
        aria-label="Tutup notifikasi"
        onClick={() => dismissAppToast(toast.id)}
      >
        <X size={13} weight="bold" />
      </button>
    </motion.div>
  );
}

export default function AppFeedbackHost() {
  const [state, setState] = useState({ dialogs: [], toasts: [] });
  const activeDialog = state.dialogs[0] || null;

  useEffect(() => subscribeAppFeedback(setState), []);

  // Kunci scroll halaman selama dialog terbuka.
  useEffect(() => {
    if (!activeDialog) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [activeDialog]);

  // Escape menutup dialog teratas.
  useEffect(() => {
    if (!activeDialog || !activeDialog.dismissible) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        resolveAppDialog(activeDialog.id, false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeDialog]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <AnimatePresence>
        {state.toasts.length > 0 && (
          <div className="app-toast-stack" aria-live="polite" aria-atomic="false">
            <AnimatePresence initial={false}>
              {state.toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeDialog && (
          <DialogCard key={activeDialog.id} dialog={activeDialog} />
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
