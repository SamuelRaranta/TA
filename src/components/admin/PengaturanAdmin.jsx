import React from 'react';
import PengaturanPengguna from '../common/PengaturanPengguna';

export default function PengaturanAdmin({ profile, onUpdateProfile, onLogout }) {
  return (
    <PengaturanPengguna 
      role="admin"
      profile={profile}
      onUpdateProfile={onUpdateProfile}
      onLogout={onLogout}
    />
  );
}

