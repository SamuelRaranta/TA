import React from 'react';
import PengaturanPengguna from '../common/PengaturanPengguna';

export default function PengaturanPembeli({ profile, onUpdateProfile, onLogout }) {
  return (
    <PengaturanPengguna 
      role="pembeli"
      profile={profile}
      onUpdateProfile={onUpdateProfile}
      onLogout={onLogout}
    />
  );
}
