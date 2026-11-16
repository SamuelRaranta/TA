import React from 'react';
import PengaturanPengguna from '../common/PengaturanPengguna';

export default function PengaturanPetani({ profile, initialTab, onUpdateProfile, onLogout }) {
  return (
    <PengaturanPengguna 
      role="petani"
      profile={profile}
      initialTab={initialTab}
      onUpdateProfile={onUpdateProfile}
      onLogout={onLogout}
    />
  );
}
