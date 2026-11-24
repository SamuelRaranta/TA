/**
 * Global Constants for TaniNiaga
 */

// Default profile avatar (Siluet abu-abu Gambar 2)
export const DEFAULT_AVATAR = '/default-avatar.png';

/**
 * Helper untuk memastikan URL avatar valid, fallback ke DEFAULT_AVATAR jika kosong
 */
export function getAvatarUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return DEFAULT_AVATAR;
  }
  return url;
}
