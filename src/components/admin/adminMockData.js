// adminMockData.js - Data Mock Operasional Dashboard Admin AgriConnect
// Khusus Komoditas & Wilayah Sentra Pertanian Minahasa

export const INITIAL_ADMIN_PROFILE = {
  name: 'Bima Satria, S.Kom.',
  role: 'Super Admin - Platform Operations',
  badge: 'Root Access',
  email: 'ops-admin@agriconnect.id',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  lastLogin: 'Hari ini, 13:25 WITA',
  securityLevel: 'Tingkat 3 (2FA Aktif)'
};

export const PLATFORM_OVERVIEW_METRICS = {
  totalUsers: 1248,
  totalUsersText: '1.248',
  totalUsersTrend: '+14.2% bln ini',
  totalCommodities: 86,
  totalCommoditiesText: '86',
  totalCommoditiesSub: 'Komoditas Unggulan Minahasa',
  totalOffersSubmitted: 142,
  totalOffersSubmittedText: '142',
  totalOffersSub: '18 Perlu Review',
  totalTransactionsCount: 453,
  totalTransactionsCountText: '453',
  totalTransactionsSub: 'Total Rp 14,85 M',
  totalGmv: 'Rp 14.850.000.000',
  totalGmvTrend: '+18.4% vs bulan lalu',
  escrowHolding: 'Rp 2.450.000.000',
  escrowHoldingSub: '8 transaksi dalam rekening penjamin aman',
  verifiedUsers: 174,
  verifiedUsersSub: '128 Poktan Tani • 46 Industri Pembeli',
  pendingVerifications: 5,
  pendingEscrowRelease: 2,
  activeBindings: 34,
  totalVolumeTon: '1.240 Ton',
  successRate: '99.4%',
  operationalStatus: 'Semua Sistem Normal (99.98% Uptime)'
};

// Data Verifikasi KYC Pengguna Baru (Poktan & Pembeli Minahasa)
export const INITIAL_KYC_VERIFICATIONS = [
  {
    id: 'KYC-2026-089',
    type: 'petani',
    name: 'Poktan Ranowangko Langowan',
    pic: 'Hengky Mandagi, S.P.',
    phone: '0812-4321-8765',
    email: 'poktan.ranowangko@gmail.com',
    commodityFocus: 'Cengkeh Zanzibar, Jagung & Padi',
    landArea: '145 Hektar',
    membersCount: 84,
    legalDocs: {
      type: 'SK Penetapan Poktan Distanbun Kab. Minahasa & NIK Ketua',
      docNumber: '521.1/SK-POKTAN/MNH/2024',
      issuedBy: 'Dinas Pertanian Kabupaten Minahasa',
      verifiedLahan: true
    },
    bankAccount: {
      bank: 'Bank SulutGo (BSG)',
      accountNumber: '0128-01-001928-50-2',
      holderName: 'POKTAN RANOWANGKO LANGOWAN'
    },
    status: 'Menunggu Verifikasi', // 'Menunggu Verifikasi' | 'Terverifikasi' | 'Ditolak'
    submissionDate: '15 Sep 2026, 09:15 WITA',
    notes: 'Data lahan perkebunan cengkeh Langowan dan SK Distanbun lengkap. Rekening koran 3 bulan terakhir terlampir.'
  },
  {
    id: 'KYC-2026-088',
    type: 'pembeli',
    name: 'PT Royal Coconut Minahasa',
    pic: 'Ir. Raditya Pratama',
    phone: '0811-9876-5432',
    email: 'procurement@royalcoconut.co.id',
    businessType: 'Industri Pengolahan Kelapa & Ekspor Kopra Putih',
    procurementVolume: '500 Ton / Bulan',
    legalDocs: {
      type: 'NIB OSS Berbasis Risiko & NPWP Badan',
      docNumber: '9120003410291 (KBLI 10611)',
      issuedBy: 'Kementerian Investasi / BKPM RI',
      verifiedLahan: false
    },
    bankAccount: {
      bank: 'Bank Mandiri Korporat',
      accountNumber: '122-00-9988776-4',
      holderName: 'PT ROYAL COCONUT MINAHASA'
    },
    status: 'Menunggu Verifikasi',
    submissionDate: '15 Sep 2026, 08:30 WITA',
    notes: 'Legalitas korporat terverifikasi di AHU Kemenkumham. Butuh konfirmasi PIC Pengadaan armada di Minahasa.'
  },
  {
    id: 'KYC-2026-087',
    type: 'petani',
    name: 'Poktan Danau Tondano',
    pic: 'Frits Rumagit',
    phone: '0857-1234-8899',
    email: 'poktan.danautondano@gmail.com',
    commodityFocus: 'Beras Premium Superwin & Serayu',
    landArea: '92 Hektar',
    membersCount: 56,
    legalDocs: {
      type: 'Surat Keterangan Kades & Simluhtan Kementan',
      docNumber: 'SIMLUH/71.02.04/2023',
      issuedBy: 'BPP Tondano Barat, Minahasa',
      verifiedLahan: true
    },
    bankAccount: {
      bank: 'Bank BRI Cabang Tondano',
      accountNumber: '173-00-0192847-1',
      holderName: 'POKTAN DANAU TONDANO'
    },
    status: 'Terverifikasi',
    submissionDate: '14 Sep 2026, 14:20 WITA',
    notes: 'Telah disetujui. Akun aktif bertransaksi pasokan beras Superwin.'
  },
  {
    id: 'KYC-2026-086',
    type: 'pembeli',
    name: 'CV Minahasa Cengkeh Abadi',
    pic: 'Hendra Gunawan',
    phone: '0813-8899-0011',
    email: 'clove.sourcing@minahasacengkeh.co.id',
    businessType: 'Eksportir Cengkeh & Minyak Atsiri Minahasa',
    procurementVolume: '200 Ton / Bulan',
    legalDocs: {
      type: 'NIB & Izin Eksportir Rempah',
      docNumber: '8120001928341',
      issuedBy: 'Kementerian Perdagangan & BKPM',
      verifiedLahan: false
    },
    bankAccount: {
      bank: 'Bank Central Asia (BCA)',
      accountNumber: '001-348-9102',
      holderName: 'CV MINAHASA CENGKEH ABADI'
    },
    status: 'Terverifikasi',
    submissionDate: '13 Sep 2026, 11:00 WITA',
    notes: 'Terverifikasi sebagai eksportir rempah terpercaya Sulut.'
  },
  {
    id: 'KYC-2026-085',
    type: 'petani',
    name: 'Poktan Tani Makmur Kawangkoan',
    pic: 'Dolfie Senduk',
    phone: '0821-4455-6677',
    email: 'dolfie.kawangkoan@yahoo.com',
    commodityFocus: 'Kacang Kawangkoan & Jagung Hibrida',
    landArea: '28 Hektar',
    membersCount: 22,
    legalDocs: {
      type: 'KTP Pribadi & Surat Pengantar Hukum Tua',
      docNumber: 'SKU/2026/08/Desa',
      issuedBy: 'Kantor Hukum Tua Kanonang',
      verifiedLahan: false
    },
    bankAccount: {
      bank: 'Bank SulutGo',
      accountNumber: '6120-01-098234-53-1',
      holderName: 'DOLFIE SENDUK'
    },
    status: 'Ditolak',
    submissionDate: '12 Sep 2026, 16:45 WITA',
    notes: 'Ditolak sementara: Dokumen SK Kelompok Tani resmi dari Dinas Pertanian Minahasa belum dilampirkan.'
  }
];

// Data Rekening Bersama (Escrow Vault Management Minahasa)
export const INITIAL_ESCROW_TRANSACTIONS = [
  {
    id: 'ESC-2026-0091',
    contractId: 'AC-AGR/2026/IX/0051',
    buyerName: 'PT Royal Agro Minahasa',
    farmerName: 'Poktan Ranowangko Langowan',
    commodity: 'Cengkeh Zanzibar Kering Sikotok',
    volumeTon: 10,
    totalValue: 1250000000,
    dpBookingFee: 62500000,
    remainingPayment: 1187500000,
    platformFeeRate: 0.01, // 1%
    platformFeeAmount: 12500000,
    netPayableToFarmer: 1237500000,
    holdingAmount: 1250000000, // Total dana aman di escrow
    status: 'Siap Dicairkan', // 'Menunggu Pembayaran DP' | 'Dana Terkunci di Escrow' | 'Siap Dicairkan' | 'Selesai Dicairkan'
    spmStatus: 'Muat & Timbang Selesai di Langowan (10.05 Ton)',
    suratTimbangGudang: 'STG-LGW-2026-09-082 (Gudang Walantakan Langowan)',
    disbursementDue: 'Hari ini (Prioritas Utama)',
    bankTujuan: 'Bank SulutGo 0128-01-001928-50-2 a.n POKTAN RANOWANGKO'
  },
  {
    id: 'ESC-2026-0090',
    contractId: 'AC-AGR/2026/IX/0048',
    buyerName: 'PT Royal Coconut Minahasa',
    farmerName: 'Koperasi Kelapa Pesisir Kombi',
    commodity: 'Kopra Putih Kering Kombi (KA 6%)',
    volumeTon: 25,
    totalValue: 345000000,
    dpBookingFee: 17250000,
    remainingPayment: 327750000,
    platformFeeRate: 0.01,
    platformFeeAmount: 3450000,
    netPayableToFarmer: 341550000,
    holdingAmount: 345000000,
    status: 'Siap Dicairkan',
    spmStatus: 'Timbang Selesai (24.95 Ton, Toleransi Susut 0.2% Lolos)',
    suratTimbangGudang: 'STG-KMB-2026-09-077 (Gudang Kombi)',
    disbursementDue: 'Hari ini (Prioritas)',
    bankTujuan: 'Bank BRI 0109-01-001239-50-1 a.n KOPERASI KELAPA KOMBI'
  },
  {
    id: 'ESC-2026-0089',
    contractId: 'AC-AGR/2026/IX/0055',
    buyerName: 'PT Celebes Feedmill Minahasa',
    farmerName: 'Poktan Tou Kakas Mandiri',
    commodity: 'Jagung Pipil Kering Hibrida Kakas',
    volumeTon: 40,
    totalValue: 216000000,
    dpBookingFee: 10800000,
    remainingPayment: 205200000,
    platformFeeRate: 0.01,
    platformFeeAmount: 2160000,
    netPayableToFarmer: 213840000,
    holdingAmount: 216000000,
    status: 'Dana Terkunci di Escrow',
    spmStatus: 'Armada Menuju Silo Tompaso (ETA Besok 09:00 WITA)',
    suratTimbangGudang: 'Menunggu Timbang Lapangan',
    disbursementDue: '17 Sep 2026',
    bankTujuan: 'Bank SulutGo 0129-01-002341-50-8 a.n POKTAN TOU KAKAS'
  }
];

// Data Moderasi Listing Komoditas Baru Minahasa
export const INITIAL_COMMODITY_MODERATIONS = [
  {
    id: 'MOD-KMD-101',
    farmerName: 'Poktan Ranowangko Langowan',
    commodityName: 'Cengkeh Zanzibar Kering Sikotok',
    category: 'Perkebunan',
    proposedPrice: 125000,
    marketBenchmarkPrice: 125000,
    totalStockTon: 25,
    minimumOrderTon: 1,
    location: 'Langowan Timur, Minahasa',
    moistureContent: '11.5% (Kadar Air Aman Kering Sikotok)',
    harvestPeriod: '20 - 25 September 2026',
    status: 'Menunggu Moderasi', // 'Menunggu Moderasi' | 'Disetujui' | 'Ditolak'
    notes: 'Kadar air memenuhi standar mutu ekspor. Foto sampel panen asli cengkeh Langowan terverifikasi geolokasi.',
    images: ['https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=400&auto=format&fit=crop&q=80']
  },
  {
    id: 'MOD-KMD-102',
    farmerName: 'Poktan Horti Sinisir Modoinding',
    commodityName: 'Cabai Rawit Merah (Rica Minahasa)',
    category: 'Hortikultura & Sayur',
    proposedPrice: 48000,
    marketBenchmarkPrice: 48500,
    totalStockTon: 10,
    minimumOrderTon: 1,
    location: 'Modoinding, Minahasa',
    moistureContent: 'Segar Petik Pagi (Super Pedas)',
    harvestPeriod: '18 - 22 September 2026',
    status: 'Menunggu Moderasi',
    notes: 'Ukuran seragam cabai rawit Minahasa, tingkat kepedasan tinggi, sortir segar petik pagi.',
    images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=400&auto=format&fit=crop&q=80']
  },
  {
    id: 'MOD-KMD-103',
    farmerName: 'Gapoktan Modoinding Sejahtera',
    commodityName: 'Kentang Granola Modoinding Super',
    category: 'Hortikultura & Sayur',
    proposedPrice: 14500,
    marketBenchmarkPrice: 14500,
    totalStockTon: 35,
    minimumOrderTon: 2,
    location: 'Modoinding, Minahasa',
    moistureContent: 'Umbi Padat Mulus Grade AB',
    harvestPeriod: 'Siap Angkut Gudang',
    status: 'Disetujui',
    notes: 'Telah disetujui tampil di katalog utama pembeli.',
    images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80']
  }
];

// Data Tiket Sengketa (Dispute & Mediasi Transaksi Minahasa)
export const INITIAL_DISPUTE_TICKETS = [
  {
    id: 'DSP-2026-004',
    contractId: 'AC-AGR/2026/IX/0042',
    reporter: 'PT Celebes Feedmill Minahasa (Pembeli)',
    respondent: 'Poktan Tou Kakas Mandiri (Petani)',
    issueType: 'Selisih Timbangan Silo (> Toleransi 1%)',
    reportedWeightTon: 39.45,
    departureWeightTon: 40.00,
    weightDiffKg: 550, // Susut di atas toleransi
    disputedValue: 2970000,
    status: 'Dalam Mediasi Admin', // 'Menunggu Review' | 'Dalam Mediasi Admin' | 'Terselesaikan'
    filingDate: '14 Sep 2026, 17:30 WITA',
    proposedSolution: 'Kompensasi pemotongan tagihan pelunasan sebesar selisih timbang jembatan Tompaso.',
    adminNote: 'Admin telah memeriksa struk timbang jembatan asal Tompaso dan timbang penerimaan silo. Menunggu konfirmasi kedua pihak.'
  }
];

// Log Audit Keamanan & Operasional Admin
export const SYSTEM_AUDIT_LOGS = [
  {
    id: 1,
    action: 'ESCROW_RELEASE_APPROVED',
    detail: 'Persetujuan pencairan dana escrow kontrak AC-AGR/2026/VIII/0039 senilai Rp 1.000.000.000 ke Poktan Ranowangko Langowan.',
    executor: 'Bima Satria (Super Admin)',
    timestamp: '15 Sep 2026, 11:20 WITA',
    status: 'SUCCESS'
  },
  {
    id: 2,
    action: 'USER_KYC_VERIFIED',
    detail: 'Verifikasi identitas dan NIB CV Minahasa Cengkeh Abadi (Eksportir Rempah Minahasa).',
    executor: 'Bima Satria (Super Admin)',
    timestamp: '14 Sep 2026, 15:10 WITA',
    status: 'SUCCESS'
  },
  {
    id: 3,
    action: 'COMMODITY_LISTING_APPROVED',
    detail: 'Persetujuan katalog panen Kentang Granola Modoinding (35 Ton) oleh Gapoktan Modoinding Sejahtera.',
    executor: 'Siti Rahmawati (Admin Verifikator)',
    timestamp: '14 Sep 2026, 10:45 WITA',
    status: 'SUCCESS'
  },
  {
    id: 4,
    action: 'SYSTEM_PARAMETER_UPDATE',
    detail: 'Pembaruan acuan harga pasar Cengkeh Zanzibar Langowan ke Rp 125.000/kg dari ASPEKINDO Minahasa.',
    executor: 'Automated Bot Integration',
    timestamp: '14 Sep 2026, 06:00 WITA',
    status: 'INFO'
  }
];

// Data Grafik Spline Perputaran Dana Platform (Volume & GMV per Bulan)
export const ADMIN_CHART_SPLINE_DATA = [
  { month: 'Apr', gmv: 8.2, volume: 720, transactions: 18 },
  { month: 'Mei', gmv: 9.8, volume: 840, transactions: 22 },
  { month: 'Jun', gmv: 11.4, volume: 960, transactions: 27 },
  { month: 'Jul', gmv: 12.6, volume: 1050, transactions: 30 },
  { month: 'Agt', gmv: 13.9, volume: 1180, transactions: 33 },
  { month: 'Sep', gmv: 14.85, volume: 1240, transactions: 34 }
];

// Data Aktivitas Live (Real-Time Updates seperti Gambar 2)
export const INITIAL_LIVE_ACTIVITIES = [
  {
    id: 'act-1',
    user: 'Hengky Mandagi (Poktan Langowan)',
    action: 'mengajukan penawaran baru',
    detail: 'Rp 625.000.000',
    detailType: 'amount',
    timeAgo: '2 menit lalu',
    type: 'order',
    iconColor: '#2563eb',
    bgColor: '#eff6ff'
  },
  {
    id: 'act-2',
    user: 'PT Royal Coconut Minahasa',
    action: 'mendaftar sebagai pembeli',
    detail: '',
    detailType: 'status',
    timeAgo: '15 menit lalu',
    type: 'seller',
    iconColor: '#16a34a',
    bgColor: '#f0fdf4'
  },
  {
    id: 'act-3',
    user: 'Poktan Horti Modoinding',
    action: 'menambahkan komoditas baru',
    subAction: 'Kentang Granola',
    detail: '',
    detailType: 'text',
    timeAgo: '32 menit lalu',
    type: 'product',
    iconColor: '#9333ea',
    bgColor: '#faf5ff'
  },
  {
    id: 'act-4',
    user: 'CV Minahasa Cengkeh Abadi',
    action: 'memberikan ulasan bintang 5',
    detail: '',
    detailType: 'review',
    timeAgo: '1 jam lalu',
    type: 'review',
    iconColor: '#d97706',
    bgColor: '#fffbeb'
  }
];

// Data Peningkatan / Kenaikan User dalam 7 Hari (Diagram Batang)
export const USER_GROWTH_7DAYS = [
  { day: 'Sen', date: '9 Sep', users: 18, farmers: 11, buyers: 7 },
  { day: 'Sel', date: '10 Sep', users: 24, farmers: 15, buyers: 9 },
  { day: 'Rab', date: '11 Sep', users: 21, farmers: 13, buyers: 8 },
  { day: 'Kam', date: '12 Sep', users: 32, farmers: 20, buyers: 12 },
  { day: 'Jum', date: '13 Sep', users: 28, farmers: 17, buyers: 11 },
  { day: 'Sab', date: '14 Sep', users: 39, farmers: 24, buyers: 15 },
  { day: 'Min', date: '15 Sep', users: 45, farmers: 28, buyers: 17, isToday: true }
];

// Data Perbandingan User Petani vs Pembeli (Pie Chart)
export const USER_RATIO_PIE = {
  totalUsers: 1248,
  farmers: {
    count: 748,
    percentage: 60.0,
    label: 'Petani (Poktan Minahasa)',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
    subtext: '748 Petani (60%)'
  },
  buyers: {
    count: 500,
    percentage: 40.0,
    label: 'Pembeli (Industri & Eksportir)',
    color: '#5452f6',
    gradient: ['#5452f6', '#3b82f6'],
    subtext: '500 Pembeli (40%)'
  }
};

// 5 Komoditas yang Ingin Didaftarkan Beserta Statusnya (Komoditas Minahasa)
export const PENDING_COMMODITIES_5 = [
  {
    id: 'KMD-01',
    name: 'Cengkeh Zanzibar Kering Sikotok',
    farmer: 'Poktan Ranowangko (Langowan)',
    volumeTon: 25,
    proposedPrice: 125000,
    unit: 'Kg',
    category: 'Perkebunan',
    submittedAt: 'Hari ini, 10:15 WITA',
    status: 'Menunggu Review',
    statusColor: 'amber'
  },
  {
    id: 'KMD-02',
    name: 'Kopra Putih Kering KA 6%',
    farmer: 'Koperasi Kelapa Pesisir (Kombi)',
    volumeTon: 50,
    proposedPrice: 13800,
    unit: 'Kg',
    category: 'Perkebunan',
    submittedAt: 'Hari ini, 09:30 WITA',
    status: 'Pengecekan Mutu',
    statusColor: 'blue'
  },
  {
    id: 'KMD-03',
    name: 'Beras Premium Superwin Tondano',
    farmer: 'Poktan Danau Tondano (Tondano)',
    volumeTon: 40,
    proposedPrice: 15200,
    unit: 'Kg',
    category: 'Padi & Beras',
    submittedAt: 'Kemarin, 16:45 WITA',
    status: 'Disetujui',
    statusColor: 'emerald'
  },
  {
    id: 'KMD-04',
    name: 'Jagung Pipil Kering Hibrida',
    farmer: 'Poktan Tou Kakas (Kakas)',
    volumeTon: 70,
    proposedPrice: 5400,
    unit: 'Kg',
    category: 'Palawija',
    submittedAt: 'Kemarin, 14:20 WITA',
    status: 'Menunggu Review',
    statusColor: 'amber'
  },
  {
    id: 'KMD-05',
    name: 'Cabai Rawit Merah (Rica Minahasa)',
    farmer: 'Poktan Horti Sinisir (Modoinding)',
    volumeTon: 10,
    proposedPrice: 48000,
    unit: 'Kg',
    category: 'Hortikultura',
    submittedAt: '13 Sep 2026',
    status: 'Perlu Revisi',
    statusColor: 'rose'
  }
];
