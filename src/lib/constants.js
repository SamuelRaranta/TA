/**
 * Global Constants for AgriConnect
 */

// Default profile avatar (siluet abu-abu). File tersedia di public/default-avatar.svg
export const DEFAULT_AVATAR = '/default-avatar.svg';

/**
 * Helper untuk memastikan URL avatar valid, fallback ke DEFAULT_AVATAR jika kosong
 */
export function getAvatarUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return DEFAULT_AVATAR;
  }
  return url;
}
