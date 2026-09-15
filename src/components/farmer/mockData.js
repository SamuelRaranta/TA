// Mock Data for AgriConnect Farmer Dashboard (Dashboard Petani)
// Khusus Komoditas & Wilayah Sentra Pertanian Minahasa

export const INITIAL_FARMER_PROFILE = {
  name: 'Hengky Mandagi, S.P.',
  groupName: 'Poktan Ranowangko Langowan',
  role: 'Ketua Kelompok Tani',
  email: 'hengky.mandagi@agriconnect.id',
  phone: '0812-4321-8765',
  location: 'Kec. Langowan Timur, Kab. Minahasa, Sulawesi Utara',
  landArea: '52.5 Hektar',
  commodities: ['Cengkeh Zanzibar', 'Kopra Putih', 'Beras Superwin', 'Jagung Pipil'],
  joinedDate: 'Januari 2024',
  kycStatus: 'verified', // 'verified' | 'pending' | 'rejected'
  kycDocument: 'KTP & SK Penetapan Poktan Distanbun Kab. Minahasa No. 520/118/Distanbun-Minahasa/2024',
  bankAccount: {
    bank: 'Bank SulutGo (BSG)',
    number: '0128-01-001928-50-2',
    holder: 'POKTAN RANOWANGKO LANGOWAN'
  },
  rating: 4.95,
  totalDeals: 42,
  totalTonDelivered: 1680 // total ton komoditas terjual & selesai diambil mandiri oleh pembeli
};

export const INITIAL_PRODUCTS = [
  {
    id: 'PRD-001',
    name: 'Cengkeh Zanzibar Kering Sikotok Super',
    category: 'Perkebunan',
    stock: 25,
    unit: 'Ton',
    pricePerKg: 125000,
    minOrderTon: 1,
    qualityGrade: 'Grade A Sikotok (KA < 12%, Bunga Utuh Harum Eugenol Tinggi)',
    harvestType: 'Siap Diambil di Gudang',
    harvestDate: 'Panen Raya Agustus 2026',
    location: 'Gudang Sentral Walantakan, Langowan Timur, Minahasa',
    status: 'Tersedia', // 'Tersedia' | 'Habis' | 'Pre-Order'
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
    description: 'Cengkeh Zanzibar kualitas terbaik Minahasa, dipetik matang pohon, dijemur matahari alami di atas terpal higienis. Aroma eugenol pekat khas tanah vulkanik Minahasa.'
  },
  {
    id: 'PRD-002',
    name: 'Kopra Putih Kering Standar Ekspor (KA 6%)',
    category: 'Perkebunan',
    stock: 45,
    unit: 'Ton',
    pricePerKg: 13800,
    minOrderTon: 5,
    qualityGrade: 'Grade Super Ekspor (Oven Kering, KA 6%, Bebas Jamur)',
    harvestType: 'Siap Diambil di Gudang',
    harvestDate: 'Panen September 2026',
    location: 'Sentra Pengeringan Kelapa Kombi, Minahasa',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    description: 'Kopra putih oven bermutu tinggi dari kebun kelapa pesisir Kombi Minahasa. Sangat cocok untuk pabrik minyak kelapa murni (VCO) dan industri ekspor.'
  },
  {
    id: 'PRD-003',
    name: 'Beras Premium Superwin Danau Tondano',
    category: 'Padi & Beras',
    stock: 35,
    unit: 'Ton',
    pricePerKg: 15200,
    minOrderTon: 3,
    qualityGrade: 'Premium Minahasa (Pecahan < 5%, Sosoh 98% Alami)',
    harvestType: 'Siap Diambil di Gudang',
    harvestDate: 'Panen Agustus 2026',
    location: 'Rice Milling Unit Lembah Kakas, Minahasa',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    description: 'Beras varietas Superwin hasil panen sawah subur lembah Danau Tondano. Sangat pulen, putih alami tanpa pengawet atau pemutih kimia, aroma harum segar.'
  },
  {
    id: 'PRD-004',
    name: 'Jagung Pipil Kering Hibrida Kakas',
    category: 'Biji-Bijian & Palawija',
    stock: 60,
    unit: 'Ton',
    pricePerKg: 5400,
    minOrderTon: 10,
    qualityGrade: 'Standar Industri Pakan (KA 14%, Bebas Aflatoksin)',
    harvestType: 'Siap Diambil di Gudang',
    harvestDate: 'Panen September 2026',
    location: 'Gudang Silo Tompaso Barat, Minahasa',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
    description: 'Jagung kuning pipil hibrida kadar air 14% terstandarisasi untuk kebutuhan pabrik pakan dan peternakan Minahasa. Disimpan dalam silo berventilasi bersih.'
  },
  {
    id: 'PRD-005',
    name: 'Cabai Rawit Merah (Rica Minahasa) Segar',
    category: 'Hortikultura & Sayur',
    stock: 8,
    unit: 'Ton',
    pricePerKg: 48000,
    minOrderTon: 1,
    qualityGrade: 'Grade Super Segar Pedas (Petik Pagi)',
    harvestType: 'Pre-Order (Panen 3 Hari Lagi)',
    harvestDate: 'Estimasi 18 September 2026',
    location: 'Lahan Hortikultura Modoinding, Minahasa',
    status: 'Pre-Order',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
    description: 'Rica cabai rawit merah pedas tinggi khas dataran tinggi Modoinding Minahasa. Petik segar harian untuk pasokan industri bumbu olahan dan pasar grosir.'
  },
  {
    id: 'PRD-006',
    name: 'Kentang Granola Modoinding Super',
    category: 'Hortikultura & Sayur',
    stock: 30,
    unit: 'Ton',
    pricePerKg: 14500,
    minOrderTon: 2,
    qualityGrade: 'Grade AB Pilihan (Umbi Padat Mulus Bersih)',
    harvestType: 'Siap Diambil di Gudang',
    harvestDate: 'Panen September 2026',
    location: 'Sentra Hortikultura Sinisir, Modoinding, Minahasa',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    description: 'Kentang Granola unggulan sentra sayuran Modoinding Minahasa. Umbi padat, daging kuning pulen, sangat diminati industri kuliner dan keripik.'
  }
];

export const INITIAL_OFFERS = [
  {
    id: 'OFR-2026-089',
    productId: 'PRD-001',
    productName: 'Cengkeh Zanzibar Kering Sikotok Super',
    buyerName: 'CV Minahasa Cengkeh Abadi',
    buyerType: 'Eksportir Rempah & Atsiri',
    buyerLocation: 'Kawangkoan / Manado, Sulut',
    buyerKyc: 'Terverifikasi NIB & Eksportir',
    requestedTon: 10,
    offeredPricePerKg: 124000,
    listingPricePerKg: 125000,
    notes: 'Kebutuhan ekspor minyak atsiri dan pasokan rempah. Pengambilan mandiri armada box tertutup ke gudang Walantakan Langowan.',
    submittedDate: '14 September 2026, 08:30 WITA',
    status: 'Menunggu Respon' // 'Menunggu Respon' | 'Diterima' | 'Ditolak' | 'Counter-Offer'
  },
  {
    id: 'OFR-2026-088',
    productId: 'PRD-002',
    productName: 'Kopra Putih Kering Standar Ekspor (KA 6%)',
    buyerName: 'PT Royal Coconut Minahasa',
    buyerType: 'Industri Pengolahan Kelapa Terpadu',
    buyerLocation: 'Amurang / Minahasa, Sulut',
    buyerKyc: 'Terverifikasi Resmi Industri',
    requestedTon: 25,
    offeredPricePerKg: 13700,
    listingPricePerKg: 13800,
    notes: 'Untuk pasokan pabrik minyak kelapa murni. Pengambilan 2 armada truk langsung ke gudang Kombi.',
    submittedDate: '13 September 2026, 14:15 WITA',
    status: 'Menunggu Respon'
  },
  {
    id: 'OFR-2026-085',
    productId: 'PRD-003',
    productName: 'Beras Premium Superwin Danau Tondano',
    buyerName: 'Distributor Beras Danau Sejahtera',
    buyerType: 'Distributor Grosir Pangan',
    buyerLocation: 'Pasar Beriman / Tondano, Minahasa',
    buyerKyc: 'Terverifikasi Resmi',
    requestedTon: 20,
    offeredPricePerKg: 15000,
    listingPricePerKg: 15200,
    notes: 'Tawaran nego borongan 20 ton beras Superwin Kakas. Mohon dipertimbangkan counter harga terbaik.',
    submittedDate: '12 September 2026, 11:20 WITA',
    status: 'Counter-Offer'
  },
  {
    id: 'OFR-2026-081',
    productId: 'PRD-004',
    productName: 'Jagung Pipil Kering Hibrida Kakas',
    buyerName: 'PT Celebes Feedmill Minahasa',
    buyerType: 'Industri Pakan Ternak',
    buyerLocation: 'Kawasan Industri Minahasa, Sulut',
    buyerKyc: 'Terverifikasi Resmi',
    requestedTon: 40,
    offeredPricePerKg: 5400,
    listingPricePerKg: 5400,
    notes: 'Sepakat harga listing penuh Rp 5.400/kg. Penawaran telah disetujui dan dialihkan ke dokumen binding agreement resmi.',
    submittedDate: '10 September 2026, 09:40 WITA',
    status: 'Diterima'
  }
];

export const INITIAL_BINDING_AGREEMENTS = [
  {
    id: 'BND-2026-042',
    contractCode: 'AC-AGR/2026/IX/0042',
    offerId: 'OFR-2026-081',
    productName: 'Jagung Pipil Kering Hibrida Kakas',
    buyerName: 'PT Celebes Feedmill Minahasa',
    farmerName: 'Poktan Ranowangko Langowan',
    tonnage: 40,
    pricePerKg: 5400,
    totalValue: 216000000,
    bookingFee: 10800000, // 5% komitmen awal
    bookingFeeStatus: 'Terkunci di Platform (Escrow/Booking)',
    signedDate: '11 September 2026',
    pickupSchedule: '16 September 2026 s/d 18 September 2026',
    pickupLocation: 'Gudang Silo Tompaso Barat, Minahasa, Sulawesi Utara',
    paymentMethod: 'Pelunasan Transfer Langsung Antar Pihak Saat Muat Barang',
    status: 'Terikat', // 'Menunggu Konfirmasi' | 'Terikat' | 'Barang Siap Diambil' | 'Selesai' | 'Dibatalkan'
    timeline: [
      { label: 'Penawaran Disepakati', date: '10 Sep 2026, 11:00 WITA', completed: true },
      { label: 'Binding Agreement Diterbitkan', date: '11 Sep 2026, 09:15 WITA', completed: true },
      { label: 'Booking Fee Terverifikasi', date: '11 Sep 2026, 10:30 WITA', completed: true },
      { label: 'Verifikasi Barang & Armada Muat', date: 'Dijadwalkan 16 Sep 2026', completed: false },
      { label: 'Serah Terima & Selesai', date: 'Estimasi 18 Sep 2026', completed: false }
    ],
    clauses: [
      'Petani menjamin kualitas jagung pipil sesuai standar kadar air maksimal 14%.',
      'Pembeli wajib mengirimkan armada angkutan sesuai rentang jadwal yang disepakati ke Tompaso.',
      'Pembatalan sepihak tanpa alasan kahar berakibat pada penahanan tanda jadi atau sanksi reputasi akun.'
    ]
  },
  {
    id: 'BND-2026-039',
    contractCode: 'AC-AGR/2026/VIII/0039',
    offerId: 'OFR-2026-074',
    productName: 'Cengkeh Zanzibar Kering Sikotok Super',
    buyerName: 'CV Minahasa Cengkeh Abadi',
    farmerName: 'Poktan Ranowangko Langowan',
    tonnage: 8,
    pricePerKg: 125000,
    totalValue: 1000000000,
    bookingFee: 50000000,
    bookingFeeStatus: 'Lunas Diserahkan',
    signedDate: '26 Agustus 2026',
    pickupSchedule: '30 Agustus 2026',
    pickupLocation: 'Gudang Sentral Walantakan, Langowan Timur, Minahasa',
    paymentMethod: 'Pelunasan Transfer Bank SulutGo / BRI',
    status: 'Selesai',
    timeline: [
      { label: 'Penawaran Disepakati', date: '25 Agu 2026', completed: true },
      { label: 'Binding Agreement Diterbitkan', date: '26 Agu 2026', completed: true },
      { label: 'Booking Fee Terverifikasi', date: '26 Agu 2026', completed: true },
      { label: 'Armada Muat & Verifikasi Timbang', date: '30 Agu 2026', completed: true },
      { label: 'Transaksi Tuntas', date: '30 Agu 2026', completed: true }
    ],
    clauses: [
      'Barang cengkeh telah diterima utuh sebanyak 8.000 kg dan pembayaran lunas diselesaikan antar pihak.'
    ]
  }
];

export const INITIAL_MARKET_PRICES = [
  {
    id: 'MKT-01',
    commodity: 'Cengkeh Zanzibar Kering Langowan',
    category: 'Perkebunan',
    marketPrice: 125000,
    unit: 'Kg',
    prevPrice: 122000,
    trend: 'up', // 'up' | 'stable' | 'down'
    changePercent: '+2.4%',
    region: 'Minahasa (Langowan, Sonder, Kawangkoan)',
    source: 'ASPEKINDO Minahasa & Asosiasi Petani Cengkeh',
    updatedAt: 'Hari ini, 06:00 WITA'
  },
  {
    id: 'MKT-02',
    commodity: 'Kopra Putih Kering Kombi (KA 6%)',
    category: 'Perkebunan',
    marketPrice: 13800,
    unit: 'Kg',
    prevPrice: 13500,
    trend: 'up',
    changePercent: '+1.8%',
    region: 'Minahasa (Kombi, Lembean Timur)',
    source: 'Dinas Pertanian Minahasa (Distanbun)',
    updatedAt: 'Hari ini, 06:00 WITA'
  },
  {
    id: 'MKT-03',
    commodity: 'Beras Premium Superwin Tondano',
    category: 'Padi & Beras',
    marketPrice: 15200,
    unit: 'Kg',
    prevPrice: 15100,
    trend: 'up',
    changePercent: '+0.7%',
    region: 'Minahasa (Tondano & Kakas)',
    source: 'Pasar Tradisional Kawangkoan & Lembah Danau',
    updatedAt: 'Hari ini, 06:00 WITA'
  },
  {
    id: 'MKT-04',
    commodity: 'Jagung Kuning Pipil Kakas (KA 14%)',
    category: 'Biji-Bijian & Palawija',
    marketPrice: 5400,
    unit: 'Kg',
    prevPrice: 5450,
    trend: 'down',
    changePercent: '-0.5%',
    region: 'Minahasa (Kakas, Tompaso, Eris)',
    source: 'Bapanas Sulut & Pengumpul Pakan Minahasa',
    updatedAt: 'Hari ini, 06:00 WITA'
  },
  {
    id: 'MKT-05',
    commodity: 'Cabai Rawit Merah (Rica Minahasa)',
    category: 'Hortikultura & Sayur',
    marketPrice: 48500,
    unit: 'Kg',
    prevPrice: 46500,
    trend: 'up',
    changePercent: '+4.2%',
    region: 'Minahasa (Modoinding & Langowan)',
    source: 'Sentra Hortikultura Modoinding',
    updatedAt: 'Hari ini, 06:00 WITA'
  },
  {
    id: 'MKT-06',
    commodity: 'Kentang Granola Modoinding Super',
    category: 'Hortikultura & Sayur',
    marketPrice: 14500,
    unit: 'Kg',
    prevPrice: 14500,
    trend: 'stable',
    changePercent: '0.0%',
    region: 'Minahasa (Modoinding)',
    source: 'Pasar Tradisional Langowan & Modoinding',
    updatedAt: 'Hari ini, 06:00 WITA'
  },
  {
    id: 'MKT-07',
    commodity: 'Biji Pala Kupas ABCD & Fuli',
    category: 'Perkebunan',
    marketPrice: 105000,
    unit: 'Kg',
    prevPrice: 103500,
    trend: 'up',
    changePercent: '+1.2%',
    region: 'Minahasa (Sonder & Tombulu)',
    source: 'Sentra Rempah Sonder Minahasa',
    updatedAt: 'Hari ini, 06:00 WITA'
  },
  {
    id: 'MKT-08',
    commodity: 'Kacang Kawangkoan Sangrai',
    category: 'Biji-Bijian & Palawija',
    marketPrice: 32000,
    unit: 'Kg',
    prevPrice: 32000,
    trend: 'stable',
    changePercent: '0.0%',
    region: 'Minahasa (Kawangkoan)',
    source: 'Sentra Kacang Kawangkoan Minahasa',
    updatedAt: 'Hari ini, 06:00 WITA'
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    id: 'TRX-2026-001',
    date: 'Hari Ini',
    fullDate: '15 September 2026',
    buyerName: 'CV Minahasa Cengkeh Abadi',
    productName: 'Cengkeh Zanzibar Kering',
    volume: '10 Ton',
    category: 'Perkebunan',
    status: 'DP Terkunci',
    badgeClass: 'badge-salary',
    amount: 1250000000,
    bookingFee: 62500000,
    pickupSchedule: '18 Sep 2026',
    notes: 'Booking fee 5% diamankan di penjamin platform. Menunggu verifikasi timbang armada pembeli di Langowan.'
  },
  {
    id: 'TRX-2026-002',
    date: 'Hari Ini',
    fullDate: '15 September 2026',
    buyerName: 'PT Celebes Feedmill Minahasa',
    productName: 'Jagung Pipil Hibrida Kakas',
    volume: '40 Ton',
    category: 'Palawija',
    status: 'Terikat',
    badgeClass: 'badge-food',
    amount: 216000000,
    bookingFee: 10800000,
    pickupSchedule: '16 Sep 2026 s/d 18 Sep 2026',
    notes: 'Dokumen Digital Binding Agreement AC-AGR/2026/IX/0042 telah sah ditandatangani kedua pihak.'
  },
  {
    id: 'TRX-2026-003',
    date: '12 Sep',
    fullDate: '12 September 2026',
    buyerName: 'PT Royal Coconut Minahasa',
    productName: 'Kopra Putih Kering Kombi',
    volume: '25 Ton',
    category: 'Perkebunan',
    status: 'Terikat',
    badgeClass: 'badge-food',
    amount: 345000000,
    bookingFee: 17250000,
    pickupSchedule: '20 Sep 2026',
    notes: 'Kadar air standar KA 6% disepakati. Truk pengangkut disiapkan mandiri oleh pembeli ke Kombi.'
  },
  {
    id: 'TRX-2026-004',
    date: '08 Sep',
    fullDate: '08 September 2026',
    buyerName: 'Distributor Pangan Beriman',
    productName: 'Beras Superwin Tondano',
    volume: '20 Ton',
    category: 'Padi & Beras',
    status: 'Selesai',
    badgeClass: 'badge-salary',
    amount: 304000000,
    bookingFee: 15200000,
    pickupSchedule: '09 Sep 2026',
    notes: 'Pengambilan mandiri di RMU Lembah Kakas tuntas. Pelunasan diterima penuh.'
  },
  {
    id: 'TRX-2026-005',
    date: '30 Agu',
    fullDate: '30 Agustus 2026',
    buyerName: 'CV Minahasa Cengkeh Abadi',
    productName: 'Cengkeh Zanzibar Kering Sikotok',
    volume: '8 Ton',
    category: 'Perkebunan',
    status: 'Selesai',
    badgeClass: 'badge-salary',
    amount: 1000000000,
    bookingFee: 50000000,
    pickupSchedule: '30 Agu 2026',
    notes: 'Transaksi tuntas di gudang sentral Walantakan Langowan Minahasa.'
  }
];
