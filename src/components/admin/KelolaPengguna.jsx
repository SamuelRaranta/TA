import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MagnifyingGlass, 
  PencilSimple,
  Trash,
  Plus,
  X,
  Buildings,
  Plant,
  ShieldCheck,
  Clock,
  DotsThree,
  SlidersHorizontal,
  CaretUp,
  CaretDown,
  ArrowUp,
  ArrowDown,
  UploadSimple
} from '@phosphor-icons/react';
import { supabase } from '../../lib/supabaseClient';

// Mulai kosong + loading (jangan render cache/mock basi sebelum fetch baru).
// Cache localStorage tidak lagi dipakai sebagai initial agar edit profil tidak terbaca sebagai data lama.
export default function AdminVerificationView() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles'); // 'All Roles' | 'Petani' | 'Pembeli' | 'Admin'
  const [statusFilter, setStatusFilter] = useState('All Statuses'); // 'All Statuses' | 'Active' | 'Menunggu Persetujuan' | 'Inactive'
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveSync, setIsLiveSync] = useState(false);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Active Action Menu Dropdown ID
  const [activeActionId, setActiveActionId] = useState(null);
  const actionMenuRef = useRef(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('Petani');
  const [formStatus, setFormStatus] = useState('Active');
  const [formAvatar, setFormAvatar] = useState('');
  const addFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Fetch users from Supabase profiles table
  const fetchSupabaseUsers = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching profiles from Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mapped = data.map((item, idx) => {
          let roleLabel = 'Petani';
          if (item.role) {
            const r = item.role.toLowerCase();
            if (r === 'admin') roleLabel = 'Admin';
            else if (r === 'pembeli') roleLabel = 'Pembeli';
            else roleLabel = 'Petani';
          } else if (item.email?.toLowerCase().includes('admin') || item.full_name?.toLowerCase().includes('admin')) {
            roleLabel = 'Admin';
          } else if (item.email?.toLowerCase().includes('pembeli') || item.full_name?.toLowerCase().includes('hendra')) {
            roleLabel = 'Pembeli';
          }

          let statusLabel = 'Active';
          if (item.kyc_status === 'pending') statusLabel = 'Menunggu Persetujuan';
          else if (item.kyc_status === 'rejected') statusLabel = 'Inactive';
          else statusLabel = 'Active';

          let userEmail = item.email;
          if (!userEmail) {
            const cleanSlug = (item.full_name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
            userEmail = `${cleanSlug || 'pengguna'}@agriconnect.id`;
          }

          return {
            id: item.id || `USR-${idx + 1}`,
            name: item.full_name || 'Pengguna Tanpa Nama',
            email: userEmail,
            role: roleLabel,
            status: statusLabel,
            joined: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '19 Sep 2026',
            avatar: item.avatar_url || (roleLabel === 'Admin' ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80' : (roleLabel === 'Pembeli' ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80')),
            entityName: roleLabel === 'Admin' ? 'Kantor Operasional Minahasa' : roleLabel === 'Pembeli' ? 'Perusahaan Mitra' : 'Kelompok Tani',
            location: item.location || 'Minahasa, Sulawesi Utara',
            isSupabase: true
          };
        });

        setUsers(mapped);
        setIsLiveSync(true);
      } else {
        // DB kosong -> kosongkan (jangan pertahankan data lama di layar).
        setUsers([]);
        setIsLiveSync(true);
      }
    } catch (err) {
      console.error('Fetch Supabase users error:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupabaseUsers();

    // Subscribe to realtime profile updates in Supabase with unique channel name
    const channelName = `realtime_profiles_mgmt_${Math.random().toString(36).slice(2, 8)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchSupabaseUsers(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Mohon pilih file gambar yang valid (JPG, PNG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file gambar maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormAvatar(event.target?.result || '');
      };
      reader.readAsDataURL(file);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActiveActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered users logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role filter ('Petani', 'Pembeli', 'Admin')
      if (roleFilter !== 'All Roles' && user.role !== roleFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'All Statuses' && user.status !== statusFilter) {
        return false;
      }
      // Search term (name, email, role)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = user.name.toLowerCase().includes(q);
        const matchEmail = user.email.toLowerCase().includes(q);
        const matchRole = user.role.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRole) return false;
      }
      return true;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Counts for the 4 Summary Cards
  const totalUsersCount = users.length;
  const pembeliCount = users.filter(u => u.role === 'Pembeli').length;
  const petaniCount = users.filter(u => u.role === 'Petani').length;
  const pendingCount = users.filter(u => u.status === 'Menunggu Persetujuan').length;

  // Actions connected to Supabase
  const handleApprove = async (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Active' } : u));
    setActiveActionId(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: 'verified' })
        .eq('id', userId);
      
      if (error) {
        console.warn('Supabase approve error:', error.message);
      }
      fetchSupabaseUsers(false);
    } catch (e) {
      console.warn('Supabase update error:', e);
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm('Tolak pendaftaran akun pengguna ini? Status akan diubah menjadi Inactive.')) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Inactive' } : u));
      setActiveActionId(null);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ kyc_status: 'rejected' })
          .eq('id', userId);

        if (error) {
          console.warn('Supabase reject error:', error.message);
        }
        fetchSupabaseUsers(false);
      } catch (e) {
        console.warn('Supabase update error:', e);
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus akun pengguna ini?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setActiveActionId(null);
      try {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (error) {
          console.warn('Supabase delete error:', error.message);
        }
        fetchSupabaseUsers(false);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUserForEdit(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormAvatar(user.avatar || '');
    setEditModalOpen(true);
    setActiveActionId(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    const updatedRole = formRole;
    const updatedStatus = formStatus;
    const updatedName = formName;
    const updatedEmail = formEmail;

    setUsers(prev => prev.map(u => {
      if (u.id === selectedUserForEdit.id) {
        return {
          ...u,
          name: updatedName,
          email: updatedEmail,
          role: updatedRole,
          status: updatedStatus,
          avatar: formAvatar || u.avatar
        };
      }
      return u;
    }));
    setEditModalOpen(false);

    try {
      const { error } = await supabase.from('profiles').update({
        full_name: updatedName,
        role: updatedRole.toLowerCase(),
        kyc_status: updatedStatus === 'Active' ? 'verified' : (updatedStatus === 'Menunggu Persetujuan' ? 'pending' : 'rejected'),
        avatar_url: formAvatar || undefined
      }).eq('id', selectedUserForEdit.id);

      if (error) {
        console.warn('Supabase edit error:', error.message);
      }
      fetchSupabaseUsers(false);
    } catch (err) {
      console.warn('Supabase edit error:', err);
    }
    setSelectedUserForEdit(null);
  };

  const handleOpenAdd = () => {
    setFormName('');
    setFormEmail('');
    setFormRole('Petani');
    setFormStatus('Active');
    setFormAvatar('');
    setAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const generatedUuid = crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-' + Date.now().toString().padStart(12, '0');

    const newUser = {
      id: generatedUuid,
      name: formName || 'User Baru',
      email: formEmail || `user${users.length + 1}@agriconnect.id`,
      role: formRole,
      status: formStatus,
      joined: 'Hari ini',
      avatar: formAvatar || (formRole === 'Petani' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'),
      entityName: formRole === 'Petani' ? 'Kelompok Tani Baru' : (formRole === 'Pembeli' ? 'Perusahaan Baru' : 'Admin'),
      location: 'Minahasa, Sulawesi Utara'
    };
    setUsers(prev => [newUser, ...prev]);
    setAddModalOpen(false);

    try {
      let finalId = generatedUuid;
      try {
        const { data: authData } = await supabase.auth.signUp({
          email: newUser.email,
          password: 'Password123!',
          options: {
            data: {
              full_name: newUser.name,
              role: newUser.role.toLowerCase()
            }
          }
        });
        if (authData?.user?.id) {
          finalId = authData.user.id;
          newUser.id = finalId;
        }
      } catch (authErr) {
        console.warn('Auth signup fallback:', authErr);
      }

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: finalId,
        full_name: newUser.name,
        role: newUser.role.toLowerCase(),
        kyc_status: newUser.status === 'Active' ? 'verified' : (newUser.status === 'Menunggu Persetujuan' ? 'pending' : 'rejected'),
        avatar_url: newUser.avatar,
        location: newUser.location
      });

      if (profileError) {
        console.warn('Supabase insert profile warning:', profileError.message);
      }
      fetchSupabaseUsers(false);
    } catch (err) {
      console.warn('Supabase insert profile error:', err);
    }
  };

  // Select all checkboxes toggle
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="um-container">
      
      {/* ================= 1. HEADER ================= */}
      <div className="um-header">
        <div className="um-header-left">
          <h1>User Management</h1>
          <p>Manage website users, roles and permissions.</p>
        </div>

        <button 
          type="button" 
          className="um-add-btn"
          onClick={handleOpenAdd}
          title="Add New User"
        >
          <Plus size={16} weight="bold" />
          <span>Add New User</span>
        </button>
      </div>

      {/* ================= 2. 4 SUMMARY CARDS ================= */}
      <div className="um-summary-grid">
        
        {/* Card 1: Total User */}
        <div className="um-summary-card">
          <div className="um-card-icon-box blue">
            <Users size={22} weight="bold" />
          </div>
          <div className="um-card-info">
            <span className="um-card-label">Total Users</span>
            <span className="um-card-value">
              {isLoading ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '3rem', height: '1.4rem', borderRadius: '4px' }} />
              ) : (
                totalUsersCount.toLocaleString('en-US')
              )}
            </span>
            <span className="um-card-trend up">
              <ArrowUp size={11} weight="bold" />
              <span>+12% from last month</span>
            </span>
          </div>
        </div>

        {/* Card 2: Pembeli (replaces Active Users) */}
        <div className="um-summary-card">
          <div className="um-card-icon-box green">
            <Buildings size={22} weight="bold" />
          </div>
          <div className="um-card-info">
            <span className="um-card-label">Pembeli</span>
            <span className="um-card-value">
              {isLoading ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '2.5rem', height: '1.4rem', borderRadius: '4px' }} />
              ) : (
                pembeliCount
              )}
            </span>
            <span className="um-card-trend up">
              <ArrowUp size={11} weight="bold" />
              <span>+8% from last month</span>
            </span>
          </div>
        </div>

        {/* Card 3: Petani (replaces Inactive Users) */}
        <div className="um-summary-card">
          <div className="um-card-icon-box amber">
            <Plant size={22} weight="bold" />
          </div>
          <div className="um-card-info">
            <span className="um-card-label">Petani</span>
            <span className="um-card-value">
              {isLoading ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '2.5rem', height: '1.4rem', borderRadius: '4px' }} />
              ) : (
                petaniCount
              )}
            </span>
            <span className="um-card-trend up">
              <ArrowUp size={11} weight="bold" />
              <span>+5% from last month</span>
            </span>
          </div>
        </div>

        {/* Card 4: Menunggu Persetujuan (replaces Administrators) */}
        <div className="um-summary-card">
          <div className="um-card-icon-box purple">
            <ShieldCheck size={22} weight="bold" />
          </div>
          <div className="um-card-info">
            <span className="um-card-label">Menunggu Persetujuan</span>
            <span className="um-card-value">
              {isLoading ? (
                <span className="agri-skeleton-pulse" style={{ display: 'inline-block', width: '2.5rem', height: '1.4rem', borderRadius: '4px' }} />
              ) : (
                pendingCount
              )}
            </span>
            <span className="um-card-trend up">
              <ArrowUp size={11} weight="bold" />
              <span>+2% from last month</span>
            </span>
          </div>
        </div>

      </div>

      {/* ================= 3. SEARCH DAN FILTER BAR ================= */}
      <div className="um-filter-bar">
        
        {/* Search Input */}
        <div className="um-search-wrap">
          <MagnifyingGlass size={16} className="um-search-icon" />
          <input 
            type="text"
            className="um-search-input"
            placeholder="Search users by name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters Right */}
        <div className="um-filters-right">
          
          {/* Dropdown Role (Petani, Pembeli, Admin) */}
          <select 
            className="um-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All Roles">All Roles</option>
            <option value="Petani">Petani</option>
            <option value="Pembeli">Pembeli</option>
            <option value="Admin">Admin</option>
          </select>

          {/* Dropdown Status */}
          <select 
            className="um-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Filters Button */}
          <button 
            type="button" 
            className="um-filter-btn"
            onClick={() => {
              // Toggle reset filters if active
              if (roleFilter !== 'All Roles' || statusFilter !== 'All Statuses' || searchTerm) {
                setRoleFilter('All Roles');
                setStatusFilter('All Statuses');
                setSearchTerm('');
              }
            }}
            title="Reset / Toggle Filters"
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
          </button>

        </div>

      </div>

      {/* ================= 4. TABLE PENGGUNA ================= */}
      <div className="um-table-card">
        <div className="um-table-wrapper">
          <table className="um-table">
            <thead>
              <tr>
                <th style={{ width: '40px', padding: '0.85rem 0.85rem 0.85rem 1.15rem' }}>
                  <input 
                    type="checkbox"
                    className="um-checkbox"
                    checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="um-th sortable">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>User</span>
                    <CaretDown size={12} weight="bold" />
                  </div>
                </th>
                <th className="um-th sortable">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Email</span>
                    <span style={{ fontSize: '0.7rem' }}>⇅</span>
                  </div>
                </th>
                <th className="um-th sortable">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Role</span>
                    <span style={{ fontSize: '0.7rem' }}>⇅</span>
                  </div>
                </th>
                <th className="um-th sortable">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Status</span>
                    <span style={{ fontSize: '0.7rem' }}>⇅</span>
                  </div>
                </th>
                <th className="um-th sortable">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Joined</span>
                    <span style={{ fontSize: '0.7rem' }}>⇅</span>
                  </div>
                </th>
                <th className="um-th" style={{ textAlign: 'center', width: '80px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((idx) => (
                  <tr key={idx} className="um-tr">
                    <td style={{ padding: '0.9rem 0.85rem 0.9rem 1.15rem' }}>
                      <div className="agri-skeleton-pulse" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
                    </td>
                    <td className="um-td">
                      <div className="um-user-cell" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="agri-skeleton-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                        <div className="agri-skeleton-text" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
                      </div>
                    </td>
                    <td className="um-td">
                      <div className="agri-skeleton-text" style={{ width: '150px', height: '14px', borderRadius: '4px' }} />
                    </td>
                    <td className="um-td">
                      <div className="agri-skeleton-pulse" style={{ width: '70px', height: '24px', borderRadius: '12px' }} />
                    </td>
                    <td className="um-td">
                      <div className="agri-skeleton-pulse" style={{ width: '60px', height: '24px', borderRadius: '12px' }} />
                    </td>
                    <td className="um-td">
                      <div className="agri-skeleton-text" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
                    </td>
                    <td className="um-td" style={{ textAlign: 'center' }}>
                      <div className="agri-skeleton-pulse" style={{ width: '28px', height: '28px', borderRadius: '6px', margin: '0 auto' }} />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelected = selectedIds.includes(user.id);
                  const isPending = user.status === 'Menunggu Persetujuan';
                  const isMenuOpen = activeActionId === user.id;

                  return (
                    <tr key={user.id} className="um-tr">
                      
                      {/* Checkbox */}
                      <td style={{ padding: '0.9rem 0.85rem 0.9rem 1.15rem' }}>
                        <input 
                          type="checkbox"
                          className="um-checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(user.id)}
                        />
                      </td>

                      {/* User (Avatar + Name) */}
                      <td className="um-td">
                        <div className="um-user-cell">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.name} 
                              className="um-avatar"
                            />
                          ) : (
                            <div className="um-avatar-fallback">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          <span className="um-user-name">{user.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="um-td">
                        <span className="um-user-email">{user.email}</span>
                      </td>

                      {/* Role (Petani, Pembeli, Admin) */}
                      <td className="um-td">
                        {user.role === 'Petani' ? (
                          <span className="um-role-badge petani">
                            Petani
                          </span>
                        ) : user.role === 'Admin' ? (
                          <span className="um-role-badge admin">
                            Admin
                          </span>
                        ) : (
                          <span className="um-role-badge pembeli">
                            Pembeli
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="um-td">
                        {user.status === 'Active' && (
                          <span className="um-status-badge active">
                            <span className="um-status-dot" />
                            <span>Active</span>
                          </span>
                        )}
                        {user.status === 'Menunggu Persetujuan' && (
                          <span className="um-status-badge pending">
                            <span className="um-status-dot" />
                            <span>Menunggu Persetujuan</span>
                          </span>
                        )}
                        {user.status === 'Inactive' && (
                          <span className="um-status-badge inactive">
                            <span className="um-status-dot" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="um-td">
                        <span style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.84rem' }}>
                          {user.joined}
                        </span>
                      </td>

                      {/* Actions Column (Click .3) */}
                      <td className="um-td" style={{ textAlign: 'center' }}>
                        <div className="um-action-wrap" ref={isMenuOpen ? actionMenuRef : null}>
                          <button 
                            type="button"
                            className={`um-action-btn ${isMenuOpen ? 'active' : ''}`}
                            onClick={() => setActiveActionId(isMenuOpen ? null : user.id)}
                            title="Action options"
                          >
                            <DotsThree size={20} weight="bold" />
                          </button>

                          {/* Action Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="um-action-dropdown">
                              {isPending ? (
                                /* Jika baru mendaftar: muncul TERIMA atau TOLAK */
                                <>
                                  <button 
                                    type="button" 
                                    className="um-action-item approve"
                                    onClick={() => handleApprove(user.id)}
                                    title="Terima pendaftaran akun ini"
                                  >
                                    <CheckCircle size={15} weight="bold" />
                                    <span>Terima</span>
                                  </button>

                                  <button 
                                    type="button" 
                                    className="um-action-item danger"
                                    onClick={() => handleReject(user.id)}
                                    title="Tolak pendaftaran akun ini"
                                  >
                                    <XCircle size={15} weight="bold" />
                                    <span>Tolak</span>
                                  </button>

                                  <div className="um-action-divider" />

                                  <button 
                                    type="button" 
                                    className="um-action-item"
                                    onClick={() => handleOpenEdit(user)}
                                  >
                                    <PencilSimple size={15} />
                                    <span>Edit</span>
                                  </button>

                                  <button 
                                    type="button" 
                                    className="um-action-item danger"
                                    onClick={() => handleDelete(user.id)}
                                  >
                                    <Trash size={15} />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              ) : (
                                /* Jika sudah aktif / biasa: muncul EDIT dan HAPUS */
                                <>
                                  <button 
                                    type="button" 
                                    className="um-action-item"
                                    onClick={() => handleOpenEdit(user)}
                                    title="Edit data pengguna"
                                  >
                                    <PencilSimple size={15} />
                                    <span>Edit</span>
                                  </button>

                                  <button 
                                    type="button" 
                                    className="um-action-item danger"
                                    onClick={() => handleDelete(user.id)}
                                    title="Hapus akun pengguna"
                                  >
                                    <Trash size={15} />
                                    <span>Hapus</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                    <Users size={40} weight="duotone" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                    <div style={{ fontWeight: 600 }}>Tidak ada pengguna ditemukan</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Coba ubah kata kunci pencarian atau reset filter.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="um-table-footer">
          <div>
            Showing 1-{filteredUsers.length} of {totalUsersCount.toLocaleString('en-US')} users
          </div>
          <div className="um-pagination">
            <button type="button" className="um-page-btn" disabled>
              Previous
            </button>
            <button type="button" className="um-page-btn active">
              1
            </button>
            <button type="button" className="um-page-btn">
              2
            </button>
            <button type="button" className="um-page-btn">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL: ADD NEW USER ================= */}
      {addModalOpen && (
        <div className="clone-modal-overlay" onClick={() => setAddModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                  <Plus size={18} weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    Add New User
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.82rem' }}>
                    Tambah akun Petani atau Pembeli baru ke platform
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setAddModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="clone-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Nama Lengkap */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                    Nama Lengkap *
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Sarah Johnson"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="clone-form-input"
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                    Email *
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="sarah.johnson@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="clone-form-input"
                  />
                </div>

                {/* Role (HANYA Petani dan Pembeli) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                      Role *
                    </label>
                    <select 
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="clone-form-input"
                    >
                      <option value="Petani">Petani</option>
                      <option value="Pembeli">Pembeli</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                      Status *
                    </label>
                    <select 
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="clone-form-input"
                    >
                      <option value="Active">Active</option>
                      <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Foto Avatar (Upload File) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                    Foto Avatar <span style={{ fontWeight: 400, color: 'var(--text-muted, #94a3b8)' }}>(Opsional)</span>
                  </label>
                  <input 
                    type="file"
                    ref={addFileInputRef}
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    style={{ display: 'none' }}
                  />

                  {formAvatar ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      background: 'var(--bg-canvas-subtle, #f8fafc)'
                    }}>
                      <img 
                        src={formAvatar} 
                        alt="Avatar Preview"
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #6366f1'
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #334155)' }}>
                          Foto Berhasil Dipilih
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                          Format gambar aktif untuk pengguna ini
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => addFileInputRef.current?.click()}
                          style={{
                            padding: '0.35rem 0.7rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle, #e2e8f0)',
                            background: 'var(--bg-canvas, #ffffff)',
                            color: 'var(--text-primary, #334155)',
                            cursor: 'pointer'
                          }}
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormAvatar('')}
                          style={{
                            padding: '0.35rem 0.55rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Hapus Foto"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => addFileInputRef.current?.click()}
                      style={{
                        border: '1.5px dashed var(--border-subtle, #cbd5e1)',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        textAlign: 'center',
                        background: 'var(--bg-canvas-subtle, #f8fafc)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle, #cbd5e1)'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UploadSimple size={18} weight="bold" />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #334155)' }}>
                        Unggah Foto Avatar
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                        Klik untuk memilih gambar (JPG, PNG, WebP maks. 5MB)
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div className="clone-modal-footer">
                <button type="button" className="clone-btn-secondary" onClick={() => setAddModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="clone-btn-primary" style={{ background: '#6366f1' }}>
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {editModalOpen && selectedUserForEdit && (
        <div className="clone-modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="clone-modal-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="clone-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                  <PencilSimple size={18} weight="bold" />
                </div>
                <div>
                  <h3 className="clone-modal-heading" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    Edit User ({selectedUserForEdit.id})
                  </h3>
                  <p className="clone-modal-subheading" style={{ margin: 0, fontSize: '0.82rem' }}>
                    Perbarui rincian data akun pengguna
                  </p>
                </div>
              </div>
              <button type="button" className="clone-modal-close" onClick={() => setEditModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="clone-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Nama Lengkap */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                    Nama Lengkap *
                  </label>
                  <input 
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="clone-form-input"
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                    Email *
                  </label>
                  <input 
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="clone-form-input"
                  />
                </div>

                {/* Role (HANYA Petani dan Pembeli) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                      Role *
                    </label>
                    <select 
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="clone-form-input"
                    >
                      <option value="Petani">Petani</option>
                      <option value="Pembeli">Pembeli</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                      Status *
                    </label>
                    <select 
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="clone-form-input"
                    >
                      <option value="Active">Active</option>
                      <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Foto Avatar (Upload File) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '0.35rem' }}>
                    Foto Avatar
                  </label>
                  <input 
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    style={{ display: 'none' }}
                  />

                  {formAvatar ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-subtle, #e2e8f0)',
                      background: 'var(--bg-canvas-subtle, #f8fafc)'
                    }}>
                      <img 
                        src={formAvatar} 
                        alt="Avatar Preview"
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #6366f1'
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #334155)' }}>
                          Foto Avatar
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                          Klik ganti untuk memperbarui gambar
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          style={{
                            padding: '0.35rem 0.7rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle, #e2e8f0)',
                            background: 'var(--bg-canvas, #ffffff)',
                            color: 'var(--text-primary, #334155)',
                            cursor: 'pointer'
                          }}
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormAvatar('')}
                          style={{
                            padding: '0.35rem 0.55rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Hapus Foto"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      style={{
                        border: '1.5px dashed var(--border-subtle, #cbd5e1)',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        textAlign: 'center',
                        background: 'var(--bg-canvas-subtle, #f8fafc)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle, #cbd5e1)'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <UploadSimple size={18} weight="bold" />
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary, #334155)' }}>
                        Unggah Foto Avatar
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #94a3b8)' }}>
                        Klik untuk memilih gambar baru (JPG, PNG, WebP maks. 5MB)
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div className="clone-modal-footer">
                <button type="button" className="clone-btn-secondary" onClick={() => setEditModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="clone-btn-primary" style={{ background: '#6366f1' }}>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
