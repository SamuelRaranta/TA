import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  CheckCircle, 
  Receipt, 
  Handshake, 
  FileText, 
  Package, 
  Bug, 
  User, 
  Info,
  ArrowsClockwise,
  Check
} from '@phosphor-icons/react';
import { formatRelativeTime } from '../../lib/notificationService';

// Filter tabs definition
const FILTER_TABS = [
  { id: 'Semua', label: 'Semua' },
  { id: 'Belum Dibaca', label: 'Belum Dibaca' },
  { id: 'Transaksi', label: 'Transaksi' },
  { id: 'Penawaran', label: 'Penawaran' },
  { id: 'Proposal', label: 'Proposal' },
  { id: 'Sistem', label: 'Sistem' }
];

export default function NotificationPage({
  role = 'pembeli',
  notifications = [],
  isLoading = false,
  error = null,
  unreadCount = 0,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick
}) {
  const [activeFilter, setActiveFilter] = useState('Semua');

  // Filter items in memory
  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      if (activeFilter === 'Semua') return true;
      if (activeFilter === 'Belum Dibaca') return !item.is_read;
      if (activeFilter === 'Transaksi') return item.related_type === 'order' || item.related_type === 'payment';
      if (activeFilter === 'Penawaran') return item.related_type === 'offer';
      if (activeFilter === 'Proposal') return item.related_type === 'proposal';
      if (activeFilter === 'Sistem') return ['commodity', 'bug_report', 'user', 'system'].includes(item.related_type);
      return true;
    });
  }, [notifications, activeFilter]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDateStr = yesterday.toISOString().split('T')[0];

    const groups = {
      'Hari Ini': [],
      'Kemarin': [],
      'Lebih Lama': []
    };

    filteredNotifications.forEach(item => {
      if (!item.created_at) {
        groups['Hari Ini'].push(item);
        return;
      }
      const itemDateStr = item.created_at.split('T')[0];
      if (itemDateStr === todayDateStr) {
        groups['Hari Ini'].push(item);
      } else if (itemDateStr === yesterdayDateStr) {
        groups['Kemarin'].push(item);
      } else {
        groups['Lebih Lama'].push(item);
      }
    });

    return groups;
  }, [filteredNotifications]);

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

  // Helper icon for related_type
  const getCategoryIcon = (relatedType) => {
    switch (relatedType) {
      case 'order':
      case 'payment':
        return <Receipt size={17} weight="duotone" color="#5452f6" />;
      case 'offer':
        return <Handshake size={17} weight="duotone" color="#0284c7" />;
      case 'proposal':
        return <FileText size={17} weight="duotone" color="#10b981" />;
      case 'commodity':
        return <Package size={17} weight="duotone" color="#f59e0b" />;
      case 'bug_report':
        return <Bug size={17} weight="duotone" color="#ef4444" />;
      case 'user':
        return <User size={17} weight="duotone" color="#8b5cf6" />;
      default:
        return <Info size={17} weight="duotone" color="#64748b" />;
    }
  };

  return (
    <div className="clone-page-container" style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: 'var(--text-primary, #0f172a)',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Notifikasi
          </h1>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary, #64748b)',
            margin: '0.35rem 0 0 0'
          }}>
            Informasi terbaru mengenai aktivitas akun dan transaksi Anda.
          </p>
        </div>

        {/* Action: Tandai semua dibaca */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: 'var(--text-primary, #1e293b)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Check size={14} weight="bold" color="#5452f6" />
            <span>Tandai semua dibaca</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        marginBottom: '1.25rem',
        borderBottom: '1px solid var(--border-subtle, #e2e8f0)'
      }}>
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                background: isActive ? '#5452f6' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary, #64748b)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem 0.9rem',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
              {tab.id === 'Belum Dibaca' && unreadCount > 0 && (
                <span style={{
                  marginLeft: '6px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(84, 82, 246, 0.12)',
                  color: isActive ? '#ffffff' : '#5452f6'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{
          padding: '4rem 1rem',
          textAlign: 'center',
          color: 'var(--text-secondary, #64748b)',
          fontSize: '0.88rem'
        }}>
          Memuat riwayat notifikasi...
        </div>
      ) : error ? (
        <div style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--card-bg, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle, #e2e8f0)'
        }}>
          <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.5rem' }}>
            Gagal memuat notifikasi
          </div>
          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle, #cbd5e1)',
              background: '#5452f6',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowsClockwise size={15} />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* Real Empty State */
        <div style={{
          padding: '4.5rem 1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle, #e2e8f0)'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-subtle, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            color: 'var(--text-secondary, #94a3b8)'
          }}>
            <Bell size={28} weight="regular" />
          </div>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary, #1e293b)',
            marginBottom: '0.4rem'
          }}>
            {activeFilter !== 'Semua' ? 'Tidak Ada Notifikasi pada Kategori Ini' : emptyText.title}
          </h3>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary, #64748b)',
            lineHeight: 1.5,
            maxWidth: '320px',
            margin: '0 auto'
          }}>
            {activeFilter !== 'Semua' ? 'Cobalah memilih filter "Semua" untuk melihat notifikasi lainnya.' : emptyText.desc}
          </p>
        </div>
      ) : (
        /* Grouped List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Object.entries(groupedNotifications).map(([groupTitle, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupTitle}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-secondary, #94a3b8)',
                  marginBottom: '0.65rem',
                  paddingLeft: '0.25rem'
                }}>
                  {groupTitle}
                </div>

                <div style={{
                  backgroundColor: 'var(--card-bg, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  overflow: 'hidden'
                }}>
                  {items.map((item, idx) => {
                    const isUnread = !item.is_read;
                    const isLast = idx === items.length - 1;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (isUnread) onMarkAsRead(item.id);
                          onNotificationClick(item);
                        }}
                        style={{
                          padding: '1rem 1.15rem',
                          borderBottom: isLast ? 'none' : '1px solid var(--border-subtle, #f1f5f9)',
                          backgroundColor: isUnread ? 'rgba(84, 82, 246, 0.035)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.85rem',
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
                          marginTop: '3px',
                          flexShrink: 0,
                          width: '32px',
                          height: '32px',
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
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <span style={{
                              fontWeight: isUnread ? 700 : 600,
                              fontSize: '0.88rem',
                              color: 'var(--text-primary, #0f172a)'
                            }}>
                              {item.title}
                            </span>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span style={{
                                fontSize: '0.72rem',
                                color: 'var(--text-secondary, #94a3b8)'
                              }}>
                                {formatRelativeTime(item.created_at)}
                              </span>
                              {isUnread && (
                                <span style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius: '50%',
                                  backgroundColor: '#5452f6'
                                }} />
                              )}
                            </div>
                          </div>

                          <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary, #475569)',
                            lineHeight: 1.45
                          }}>
                            {item.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
