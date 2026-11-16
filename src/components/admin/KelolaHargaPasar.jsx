import React from 'react';
import HargaPasarView from '../common/HargaPasarView';

export default function KelolaHargaPasar() {
  return (
    <HargaPasarView 
      isAdmin={true}
      pageTitle="Kelola Harga Pasar"
      pageSubtitle="Pantau dan kelola perkembangan harga komoditas acuan pasar dari berbagai sumber data."
    />
  );
}
