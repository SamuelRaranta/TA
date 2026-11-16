import React, { useRef, useEffect } from 'react';
import { 
  Bell, 
  Check, 
  Receipt, 
  Handshake, 
  FileText, 
  Package, 
  Bug, 
  User, 
  Info,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { formatRelativeTime } from '../../lib/notificationService';

// Helper to choose a minimal contextual icon based on related_type
const getCategoryIcon = (relatedType) => {
  switch (relatedType) {
    case 'order':
    case 'payment':
      return <Receipt size={16} weight="duotone" color="#5452f6" />;
    case 'offer':
      return <Handshake size={16} weight="duotone" color="#0284c7" />;
    case 'proposal':
      return <FileText size={16} weight="duotone" color="#10b981" />;
    case 'commodity':
      return <Package size={16} weight="duotone" color="#f59e0b" />;
    case 'bug_report':
      return <Bug size={16} weight="duotone" color="#ef4444" />;
    case 'user':
      return <User size={16} weight="duotone" color="#8b5cf6" />;
    default:
      return <Info size={16} weight="duotone" color="#64748b" />;
  }
};

export default function NotificationDropdown({
  isOpen,
  onToggle,
  onClose,
  role = 'pembeli',
  notifications = [],
  unreadCount = 0,
  isLoading = false,
  error = null,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  onViewAll
}) {
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Role-specific empty state copy
  const getEmptyStateText = () => {
    const r = String(role).toLowerCase();
    if (r === 'admin') {
      return {
        title: 'Belum Ada Notifikasi',
        desc: 'Notifikasi aktivitas yang membutuhkan perhatian admin akan muncul di sini.'
      };
    }
    if (r === 'petani' || r === 'farmer') {
      return {
        title: 'Belum Ada Notifikasi',
        desc: 'Notifikasi pesanan, penawaran, komoditas, dan proposal akan muncul di sini.'
      };
    }
    return {
      title: 'Belum Ada Notifikasi',
      desc: 'Notifikasi pesanan, pembayaran, penawaran, dan proposal Anda akan muncul di sini.'
    };
  };

  const emptyText = getEmptyStateText();
  const displayItems = notifications.slice(0, 7);

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {/* Accessible Notification Bell Button */}
      <button
        type="button"
        className="clone-icon-btn notif-bell-trigger"
        onClick={onToggle}
        title="Notifikasi"
        aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <Bell size={18} weight={unreadCount > 0 ? "fill" : "regular"} />
        
        {/* Unread badge: only shown when unreadCount > 0 */}
        {unreadCount > 0 && (
          <span 
            className="notif-badge-indicator"
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              borderRadius: '999px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--card-bg, #ffffff)',
              lineHeight: 1
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div 
          className="notif-dropdown-popover"
          role="region"
          aria-label="Panel Notifikasi"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '340px',
            maxWidth: 'calc(100vw - 24px)',
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            zIndex: 100,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)',
            backgroundColor: 'var(--bg-subtle, #fafafa)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary, #0f172a)' }}>
                Notifikasi
              </span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(84, 82, 246, 0.1)',
                  color: '#5452f6',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}>
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAllAsRead();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5452f6',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List Content */}
          <div style={{
            maxHeight: '380px',
            overflowY: 'auto'
          }}>
            {isLoading ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary, #64748b)', fontSize: '0.82rem' }}>
                Memuat notifikasi...
              </div>
            ) : error ? (
              <div style={{ padding: '1.75rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.82rem', color: '#ef4444', marginBottom: '0.65rem' }}>
                  Gagal memuat notifikasi
                </div>
                <button
                  type="button"
                  onClick={onRefresh}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.76rem',
                    border: '1px solid var(--border-subtle, #cbd5e1)',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-primary, #1e293b)'
                  }}
                >
                  <ArrowsClockwise size={13} />
                  <span>Coba Lagi</span>
                </button>
              </div>
            ) : displayItems.length === 0 ? (
              /* Real Empty State - strictly no dummy data */
              <div style={{
                padding: '2.5rem 1.25rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle, #f1f5f9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem auto',
                  color: 'var(--text-secondary, #94a3b8)'
                }}>
                  <Bell size={20} weight="regular" />
                </div>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  color: 'var(--text-primary, #1e293b)',
                  marginBottom: '0.35rem'
                }}>
                  {emptyText.title}
                </div>
                <div style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary, #64748b)',
                  lineHeight: 1.45,
                  maxWidth: '240px',
                  margin: '0 auto'
                }}>
                  {emptyText.desc}
                </div>
              </div>
            ) : (
              displayItems.map((item) => {
                const isUnread = !item.is_read;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isUnread) onMarkAsRead(item.id);
                      onNotificationClick(item);
                      onClose();
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-subtle, #f8fafc)',
                      backgroundColor: isUnread ? 'rgba(84, 82, 246, 0.035)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? 'rgba(84, 82, 246, 0.07)' : 'rgba(0,0,0,0.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? 'rgba(84, 82, 246, 0.035)' : 'transparent';
                    }}
                  >
                    <div style={{
                      marginTop: '2px',
                      flexShrink: 0,
                      width: '26px',
                      height: '26px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-subtle, #f1f5f9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getCategoryIcon(item.related_type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '4px',
                        marginBottom: '2px'
                      }}>
                        <span style={{
                          fontWeight: isUnread ? 700 : 600,
                          fontSize: '0.8rem',
                          color: 'var(--text-primary, #1e293b)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.title}
                        </span>

                        {isUnread && (
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#5452f6',
                            flexShrink: 0
                          }} />
                        )}
                      </div>

                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary, #475569)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.message}
                      </div>

                      <div style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-secondary, #94a3b8)',
                        marginTop: '4px'
                      }}>
                        {formatRelativeTime(item.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '0.65rem 1rem',
            borderTop: '1px solid var(--border-subtle, #f1f5f9)',
            backgroundColor: 'var(--bg-subtle, #fafafa)',
            textAlign: 'center'
          }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewAll();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#5452f6',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                width: '100%',
                padding: '4px'
              }}
            >
              Lihat Semua Notifikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
