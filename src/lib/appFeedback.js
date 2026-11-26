/**
 * appFeedback
 * ------------------------------------------------------------------
 * Pengganti native window.alert() / window.confirm() / window.prompt()
 * dengan dialog & toast yang konsisten dengan design system AgriConnect.
 *
 * Cara pakai (imperatif, bisa dipanggil dari mana saja):
 *
 *   import { appToast, appAlert, appConfirm } from '../../lib/appFeedback';
 *
 *   appToast('Perubahan berhasil disimpan.', 'success');
 *   await appAlert({ title: 'Gagal', message: '...', tone: 'error' });
 *   const ok = await appConfirm({
 *     title: 'Hapus data?',
 *     message: 'Tindakan ini tidak dapat dibatalkan.',
 *     confirmLabel: 'Ya, Hapus',
 *     tone: 'danger'
 *   });
 *   if (ok) { ... }
 *
 * <AppFeedbackHost /> dipasang sekali di App.jsx.
 */

let dialogSeq = 0;
let toastSeq = 0;
let dismissTimer = null;

const listeners = new Set();
let dialogs = [];
let toasts = [];

const snapshot = () => ({ dialogs: [...dialogs], toasts: [...toasts] });

const emit = () => {
  const state = snapshot();
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (e) {
      // Jangan biarkan error UI merusak alur pemanggil.
      console.error('[appFeedback] listener error:', e);
    }
  });
};

export const subscribeAppFeedback = (listener) => {
  listeners.add(listener);
  listener(snapshot());
  return () => listeners.delete(listener);
};

const scheduleDismissToast = (id, duration) => {
  if (typeof window === 'undefined') return;
  window.setTimeout(() => {
    dismissAppToast(id);
  }, duration);
};

/**
 * Tampilkan toast (notifikasi ringkas, auto-hilang).
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} tone
 * @param {{ title?: string, duration?: number }} [options]
 */
export const appToast = (message, tone = 'info', options = {}) => {
  if (!message) return null;
  const id = ++toastSeq;
  const safeTone = ['success', 'error', 'warning', 'info'].includes(tone) ? tone : 'info';
  const duration = Number(options.duration) > 0 ? Number(options.duration) : (safeTone === 'error' ? 5200 : 3800);

  toasts = [...toasts, { id, message: String(message), tone: safeTone, title: options.title || '' }].slice(-4);
  emit();
  scheduleDismissToast(id, duration);
  return id;
};

export const dismissAppToast = (id) => {
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};

const enqueueDialog = (dialog) =>
  new Promise((resolve) => {
    dialogSeq += 1;
    dialogs = [...dialogs, { ...dialog, id: dialogSeq, resolve }];
    emit();
  });

/**
 * Dialog informasi (pengganti window.alert).
 * @returns {Promise<void>} resolve saat pengguna menutup dialog.
 */
export const appAlert = ({
  title = 'Informasi',
  message = '',
  tone = 'info',
  confirmLabel = 'Mengerti',
  dismissible = true
} = {}) =>
  enqueueDialog({
    kind: 'alert',
    title,
    message,
    tone,
    confirmLabel,
    cancelLabel: null,
    dismissible
  });

/**
 * Dialog konfirmasi (pengganti window.confirm).
 * @returns {Promise<boolean>} true jika pengguna menyetujui.
 */
export const appConfirm = ({
  title = 'Konfirmasi Tindakan',
  message = '',
  tone = 'warning',
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  dismissible = true
} = {}) =>
  enqueueDialog({
    kind: 'confirm',
    title,
    message,
    tone,
    confirmLabel,
    cancelLabel,
    dismissible
  });

/** Tutup dialog teratas. */
export const resolveAppDialog = (id, confirmed) => {
  const index = dialogs.findIndex((d) => d.id === id);
  if (index === -1) return;
  const [dialog] = dialogs.splice(index, 1);
  emit();
  if (dialog?.resolve) dialog.resolve(confirmed);
};

/** Tutup semua dialog yang tersisa (mis. saat logout / pindah halaman). */
export const clearAppDialogs = () => {
  if (!dialogs.length) return;
  const pending = dialogs;
  dialogs = [];
  emit();
  pending.forEach((dialog) => dialog?.resolve?.(false));
};

/** Bersihkan timer internal (dipakai saat hot reload / unmount host). */
export const disposeAppFeedback = () => {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
  listeners.clear();
};
