// Mock Data for AgriConnect Buyer Dashboard (Dashboard Pembeli)
// Khusus Komoditas & Wilayah Sentra Pertanian Minahasa

export const INITIAL_BUYER_PROFILE = {
  name: 'Hendra Pratama, S.T.',
  companyName: 'PT Royal Agro Minahasa',
  brandName: 'Royal Celebes Agro Group',
  role: 'Head of Procurement & Supply Chain',
  email: 'hendra.pratama@royalagrominahasa.co.id',
  phone: '0811-9876-5432',
  location: 'Kawasan Sentra Agro Minahasa, Sulawesi Utara',
  warehouseAddress: 'Gudang Logistik Sentral Agro, Jl. Trans Minahasa, Kawangkoan, Minahasa, Sulawesi Utara',
  businessType: 'Industri Pengolahan Pangan & Eksportir Rempah Minahasa',
  nib: '0220108920194 (Terverifikasi OSS & Kemenkumham)',
  npwp: '01.345.678.9-412.000',
  joinedDate: 'Januari 2024',
  kycStatus: 'verified', // 'verified' | 'pending' | 'rejected'
  kycDocument: 'NIB, SIUP & Sertifikat Mutu Ekspor Rempah & Pangan',
  bankAccount: {
    bank: 'Bank Mandiri Korporat',
    number: '156-00-1928374-1',
    holder: 'PT ROYAL AGRO MINAHASA'
  },
  rating: 4.95,
  totalProcurements: 42,
  totalTonProcured: 2650, // total ton komoditas yang berhasil dibeli & diambil mandiri
  creditLimit: 'Rp 5.000.000.000',
  activeProcurementTon: 185
};

export const INITIAL_CATALOG_COMMODITIES = [
  {
    id: 'CAT-001',
    name: 'Cengkeh Zanzibar Kering Sikotok Super',
    category: 'Perkebunan',
    farmerGroup: 'Poktan Ranowangko Langowan',
    farmerLeader: 'Hengky Mandagi, S.P.',
    location: 'Kec. Langowan Timur, Kab. Minahasa',
    distance: '18 km dari Gudang Kawangkoan',
    stockTon: 25,
    minOrderTon: 1,
    pricePerKg: 125000,
    qualityGrade: 'Grade A Sikotok (KA < 12%, Bunga Utuh Harum)',
    harvestType: 'Siap Muat di Gudang',
    harvestDate: 'Panen Agustus 2026',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80',
    description: 'Cengkeh Zanzibar kualitas terbaik Langowan Minahasa, dipetik matang pohon, dijemur alami higienis. Aroma eugenol tinggi standar ekspor.'
  },
  {
    id: 'CAT-002',
    name: 'Kopra Putih Kering Standar Ekspor (KA 6%)',
    category: 'Perkebunan',
    farmerGroup: 'Koperasi Kelapa Pesisir Kombi',
    farmerLeader: 'Welly Walangitan',
    location: 'Kec. Kombi, Kab. Minahasa',
    distance: '35 km dari Gudang Kawangkoan',
    stockTon: 50,
    minOrderTon: 5,
    pricePerKg: 13800,
    qualityGrade: 'Grade Super Ekspor (Oven Kering, KA 6%)',
    harvestType: 'Siap Muat di Gudang',
    harvestDate: 'Panen September 2026',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    description: 'Kopra putih oven berkualitas tinggi dari sentra kelapa Kombi Minahasa. Cocok untuk pabrik minyak kelapa murni dan ekspor.'
  },
  {
    id: 'CAT-003',
    name: 'Beras Premium Superwin Danau Tondano',
    category: 'Padi & Beras',
    farmerGroup: 'Poktan Danau Tondano',
    farmerLeader: 'Frits Rumagit',
    location: 'Kec. Tondano Barat, Kab. Minahasa',
    distance: '22 km dari Gudang Kawangkoan',
    stockTon: 40,
    minOrderTon: 3,
    pricePerKg: 15200,
    qualityGrade: 'Premium Minahasa (Pecahan < 5%, Sosoh 98%)',
    harvestType: 'Siap Muat di Gudang',
    harvestDate: 'Panen Agustus 2026',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80',
    description: 'Beras Superwin langsung dari RMU Tondano Minahasa. Bersih, pulen, warna putih alami tanpa bahan pemutih kimia.'
  },
  {
    id: 'CAT-004',
    name: 'Jagung Pipil Kering Hibrida Kakas (KA 14%)',
    category: 'Biji-Bijian & Palawija',
    farmerGroup: 'Poktan Tou Kakas Mandiri',
    farmerLeader: 'Jemmy Rondonuwu',
    location: 'Kec. Kakas Barat, Kab. Minahasa',
    distance: '15 km dari Gudang Kawangkoan',
    stockTon: 70,
    minOrderTon: 10,
    pricePerKg: 5400,
    qualityGrade: 'Standar Industri Pakan (KA 14%, Bebas Aflatoksin)',
    harvestType: 'Siap Muat di Gudang',
    harvestDate: 'Panen September 2026',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80',
    description: 'Jagung hibrida kering pipil terstandarisasi untuk pakan ternak dan industri pati. Disimpan dalam silo berventilasi modern di Kakas.'
  },
  {
    id: 'CAT-005',
    name: 'Cabai Rawit Merah (Rica Minahasa) Segar',
    category: 'Hortikultura & Sayur',
    farmerGroup: 'Poktan Horti Sinisir Modoinding',
    farmerLeader: 'Maikel Pongoh',
    location: 'Kec. Modoinding, Kab. Minahasa',
    distance: '48 km dari Gudang Kawangkoan',
    stockTon: 10,
    minOrderTon: 1,
    pricePerKg: 48000,
    qualityGrade: 'Grade Super (Segar Petik Pagi, Pedas Maksimal)',
    harvestType: 'Pre-Order (Panen 3 Hari Lagi)',
    harvestDate: 'Estimasi 18 September 2026',
    status: 'Pre-Order',
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80',
    description: 'Rica Minahasa petik pagi segar untuk pasokan industri bumbu olahan dan katering. Kadar capsaicin tinggi khas Modoinding.'
  },
  {
    id: 'CAT-006',
    name: 'Kentang Granola Modoinding Super',
    category: 'Hortikultura & Sayur',
    farmerGroup: 'Gapoktan Modoinding Sejahtera',
    farmerLeader: 'Arnold Lumempow',
    location: 'Kec. Modoinding, Kab. Minahasa',
    distance: '48 km dari Gudang Kawangkoan',
    stockTon: 35,
    minOrderTon: 2,
    pricePerKg: 14500,
    qualityGrade: 'Grade AB Pilihan (Umbi Padat Bersih)',
    harvestType: 'Siap Muat di Gudang',
    harvestDate: 'Panen September 2026',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80',
    description: 'Kentang Granola unggulan sentra hortikultura dataran tinggi Modoinding Minahasa. Umbi padat berdaging kuning cerah.'
  },
  {
    id: 'CAT-007',
    name: 'Biji Pala Kupas ABCD & Fuli Sonder',
    category: 'Perkebunan',
    farmerGroup: 'Poktan Pala Rindang Sonder',
    farmerLeader: 'Steven Manoppo',
    location: 'Kec. Sonder, Kab. Minahasa',
    distance: '12 km dari Gudang Kawangkoan',
    stockTon: 15,
    minOrderTon: 1,
    pricePerKg: 105000,
    qualityGrade: 'Grade ABCD Kupas Bersih Kering',
    harvestType: 'Siap Muat di Gudang',
    harvestDate: 'Panen Agustus 2026',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    description: 'Biji pala kupas dan fuli merah khas kebun pala lereng Sonder Minahasa. Kadar minyak atsiri tinggi untuk industri bumbu dan parfum.'
  },
  {
    id: 'CAT-008',
    name: 'Kacang Kawangkoan Sangrai Pilihan',
    category: 'Biji-Bijian & Palawija',
    farmerGroup: 'Poktan Kanonang Bersatu',
    farmerLeader: 'Dolfie Senduk',
    location: 'Kec. Kawangkoan, Kab. Minahasa',
    distance: '2 km dari Gudang Kawangkoan',
    stockTon: 20,
    minOrderTon: 1,
    pricePerKg: 32000,
    qualityGrade: 'Kacang Pilihan Renyah Gurih Khas Kawangkoan',
    harvestType: 'Siap Muat di Gudang',
    harvestDate: 'Panen Agustus 2026',
    status: 'Tersedia',
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    description: 'Kacang tanah khas sentra Kawangkoan Minahasa. Butiran seragam, gurih renyah alami khas tradisi sangrai pasir Kawangkoan.'
  }
];

export const INITIAL_BUYER_OFFERS = [
  {
    id: 'OFR-BYR-2026-092',
    commodityId: 'CAT-001',
    commodityName: 'Cengkeh Zanzibar Kering Sikotok Super',
    farmerGroup: 'Poktan Ranowangko Langowan',
    farmerLeader: 'Hengky Mandagi, S.P.',
    location: 'Langowan Timur, Minahasa',
    requestedTon: 10,
    offeredPricePerKg: 124000,
    listingPricePerKg: 125000,
    notes: 'Kebutuhan bahan baku ekspor minyak atsiri. Pengambilan armada truk box mandiri ke Walantakan.',
    submittedDate: '14 Sep 2026, 08:30 WITA',
    status: 'Menunggu Respon', // 'Menunggu Respon' | 'Counter-Offer' | 'Disetujui' | 'Ditolak'
    counterPricePerKg: null,
    counterTon: null,
    counterNotes: null
  },
  {
    id: 'OFR-BYR-2026-089',
    commodityId: 'CAT-002',
    commodityName: 'Kopra Putih Kering Standar Ekspor (KA 6%)',
    farmerGroup: 'Koperasi Kelapa Pesisir Kombi',
    farmerLeader: 'Welly Walangitan',
    location: 'Kombi, Minahasa',
    requestedTon: 25,
    offeredPricePerKg: 13700,
    listingPricePerKg: 13800,
    notes: 'Tawaran untuk pasokan pabrik minyak kelapa murni. Truk mandiri siap muat di gudang Kombi.',
    submittedDate: '13 Sep 2026, 14:15 WITA',
    status: 'Counter-Offer',
    counterPricePerKg: 13750,
    counterTon: 25,
    counterNotes: 'Kelompok Tani bersedia di harga Rp 13.750/kg karena kualitas oven kering KA 6% bebas jamur.'
  },
  {
    id: 'OFR-BYR-2026-084',
    commodityId: 'CAT-004',
    commodityName: 'Jagung Pipil Kering Hibrida Kakas',
    farmerGroup: 'Poktan Tou Kakas Mandiri',
    farmerLeader: 'Jemmy Rondonuwu',
    location: 'Kakas, Minahasa',
    requestedTon: 40,
    offeredPricePerKg: 5400,
    listingPricePerKg: 5400,
    notes: 'Pembelian 40 ton jagung pipil standar KA 14%. Armada truk kami siap ambil langsung di silo Tompaso.',
    submittedDate: '10 Sep 2026, 10:20 WITA',
    status: 'Disetujui',
    counterPricePerKg: null,
    counterTon: null,
    counterNotes: 'Tawaran disetujui Poktan. Silakan selesaikan Binding Agreement dan setor DP Booking Fee 5%.'
  },
  {
    id: 'OFR-BYR-2026-079',
    commodityId: 'CAT-003',
    commodityName: 'Beras Premium Superwin Danau Tondano',
    farmerGroup: 'Poktan Danau Tondano',
    farmerLeader: 'Frits Rumagit',
    location: 'Tondano Barat, Minahasa',
    requestedTon: 20,
    offeredPricePerKg: 15100,
    listingPricePerKg: 15200,
    notes: 'Penawaran untuk pasokan jaringan ritel grosir Sulawesi Utara.',
    submittedDate: '07 Sep 2026, 16:00 WITA',
    status: 'Disetujui',
    counterPricePerKg: null,
    counterTon: null,
    counterNotes: 'Disepakati dan dialihkan ke dokumen kontrak legal.'
  }
];

export const INITIAL_BUYER_BINDINGS = [
  {
    id: 'BND-BYR-2026-051',
    contractCode: 'AC-AGR/2026/IX/0051',
    offerId: 'OFR-BYR-2026-084',
    productName: 'Jagung Pipil Kering Hibrida Kakas',
    farmerName: 'Poktan Tou Kakas Mandiri (Jemmy Rondonuwu)',
    buyerName: 'PT Royal Agro Minahasa',
    tonnage: 40,
    pricePerKg: 5400,
    totalValue: 216000000,
    bookingFee: 10800000, // 5% komitmen awal
    bookingFeeStatus: 'Terkunci di Penjamin Platform (Escrow)',
    signedDate: '11 September 2026',
    pickupSchedule: '16 September 2026 s/d 18 September 2026',
    pickupLocation: 'Gudang Silo Tompaso Barat, Minahasa, Sulawesi Utara',
    picWarehouse: 'Bpk. Mario (0813-8821-4432)',
    paymentMethod: 'Pelunasan Transfer 95% via Rekening AgriConnect saat Timbang Muat',
    status: 'Terikat', // 'Terikat' | 'Armada Siap Muat' | 'Selesai' | 'Dibatalkan'
    timeline: [
      { label: 'Penawaran Disepakati Pihak Poktan', date: '10 Sep 2026, 11:30 WITA', completed: true },
      { label: 'Binding Agreement Diterbitkan Sistem', date: '11 Sep 2026, 09:00 WITA', completed: true },
      { label: 'Booking Fee 5% Terverifikasi di Platform', date: '11 Sep 2026, 10:15 WITA', completed: true },
      { label: 'Kedatangan Armada Muat Mandiri', date: 'Dijadwalkan 16 Sep 2026', completed: false },
      { label: 'Uji Kadar Air, Timbang & Pelunasan', date: 'Estimasi 18 Sep 2026', completed: false }
    ],
    clauses: [
      'Poktan menjamin seluruh 40 ton jagung pipil memenuhi standar kadar air maksimal 14%.',
      'Pembeli PT Royal Agro Minahasa bertanggung jawab penuh menyediakan armada angkut mandiri.',
      'Sisa pelunasan 95% diselesaikan langsung saat verifikasi timbang di jembatan timbang Tompaso.'
    ]
  },
  {
    id: 'BND-BYR-2026-042',
    contractCode: 'AC-AGR/2026/IX/0042',
    offerId: 'OFR-BYR-2026-079',
    productName: 'Beras Premium Superwin Danau Tondano',
    farmerName: 'Poktan Danau Tondano (Frits Rumagit)',
    buyerName: 'PT Royal Agro Minahasa',
    tonnage: 20,
    pricePerKg: 15100,
    totalValue: 302000000,
    bookingFee: 15100000,
    bookingFeeStatus: 'Terkunci di Penjamin Platform (Escrow)',
    signedDate: '08 September 2026',
    pickupSchedule: '19 September 2026 s/d 21 September 2026',
    pickupLocation: 'RMU Sentra Lembah Kakas, Minahasa, Sulawesi Utara',
    picWarehouse: 'Bpk. Tommy (0812-7766-5544)',
    paymentMethod: 'Transfer Pelunasan Langsung Antar Rekening saat Muat',
    status: 'Terikat',
    timeline: [
      { label: 'Penawaran Disepakati', date: '07 Sep 2026', completed: true },
      { label: 'Binding Agreement Sah Terbit', date: '08 Sep 2026', completed: true },
      { label: 'Booking Fee 5% Diamankan', date: '08 Sep 2026', completed: true },
      { label: 'Armada Tiba & Verifikasi Mutu', date: 'Dijadwalkan 19 Sep 2026', completed: false },
      { label: 'Pelepasan Barang & Transaksi Selesai', date: 'Estimasi 21 Sep 2026', completed: false }
    ],
    clauses: [
      'Derajat sosoh beras minimal 98% dan butir patah maksimal 5%.',
      'Petani menyiapkan tenaga muat ke bak truk armada pembeli.'
    ]
  }
];

export const INITIAL_BUYER_TRANSACTIONS = [
  {
    id: 'TRX-BYR-2026-001',
    date: 'Hari Ini',
    fullDate: '15 September 2026',
    farmerGroup: 'Poktan Ranowangko Langowan',
    productName: 'Cengkeh Zanzibar Kering',
    volume: '10 Ton',
    category: 'Perkebunan',
    status: 'DP Terkunci',
    badgeClass: 'badge-food',
    amount: 1240000000,
    bookingFee: 62000000,
    pickupSchedule: '18 Sep 2026',
    notes: 'Booking fee 5% telah diamankan di penjamin platform. Truk box mandiri dijadwalkan muat di Langowan 18 Sep.'
  },
  {
    id: 'TRX-BYR-2026-002',
    date: 'Hari Ini',
    fullDate: '15 September 2026',
    farmerGroup: 'Poktan Tou Kakas Mandiri',
    productName: 'Jagung Pipil Hibrida Kakas',
    volume: '40 Ton',
    category: 'Biji-Bijian',
    status: 'Terikat',
    badgeClass: 'badge-food',
    amount: 216000000,
    bookingFee: 10800000,
    pickupSchedule: '16 Sep 2026',
    notes: 'Digital Binding Agreement AC-AGR/2026/IX/0051 sah ditandatangani. Verifikasi mutu KA 14% sebelum muat.'
  },
  {
    id: 'TRX-BYR-2026-003',
    date: '28 Agu',
    fullDate: '28 Agustus 2026',
    farmerGroup: 'Koperasi Kelapa Pesisir Kombi',
    productName: 'Kopra Putih Kering Kombi',
    volume: '30 Ton',
    category: 'Perkebunan',
    status: 'Selesai',
    badgeClass: 'badge-salary',
    amount: 414000000,
    bookingFee: 20700000,
    pickupSchedule: '28 Agu 2026',
    notes: 'Pengambilan mandiri 2 armada truk tuntas di Kombi Minahasa. Pelunasan diterima penuh.'
  }
];

export const INITIAL_BUYER_WATCHLIST = [
  {
    id: 'WCH-01',
    commodityName: 'Cengkeh Zanzibar Kering Sikotok',
    farmerGroup: 'Poktan Ranowangko Langowan',
    region: 'Langowan Timur, Minahasa',
    currentPrice: 125000,
    targetPrice: 122000,
    trend: 'up',
    notes: 'Memantau harga panen raya cengkeh Minahasa untuk negosiasi kontrak binding volume besar.'
  },
  {
    id: 'WCH-02',
    commodityName: 'Kopra Putih Kering Kombi',
    farmerGroup: 'Koperasi Kelapa Pesisir Kombi',
    region: 'Kombi, Minahasa',
    currentPrice: 13800,
    targetPrice: 13500,
    trend: 'stable',
    notes: 'Pantau kapasitas produksi oven mingguan untuk bahan baku ekspor.'
  }
];

export const INITIAL_BUYER_PAYMENTS = [
  {
    id: 'PAY-2026-0091',
    invoiceNumber: 'INV/AGR/2026/09/0091',
    title: 'Pelunasan 95% - Cengkeh Zanzibar Langowan',
    commodity: 'Cengkeh Zanzibar Kering (10 Ton)',
    farmerGroup: 'Poktan Ranowangko Langowan',
    paymentType: 'Pelunasan Muat Mandiri (95%)',
    amount: 1178000000,
    dueDate: '25 September 2026',
    paidDate: null,
    status: 'Menunggu Pembayaran',
    method: 'Mandiri Virtual Account',
    vaNumber: '89201-156001928374',
    escrowGuarantor: 'PT Penjamin Transaksi Pangan Indonesia (Escrow Resmi Platform)'
  },
  {
    id: 'PAY-2026-0089',
    invoiceNumber: 'INV/AGR/2026/09/0089',
    title: 'Booking Fee 5% - Jagung Pipil Kakas',
    commodity: 'Jagung Pipil Kering Hibrida (40 Ton)',
    farmerGroup: 'Poktan Tou Kakas Mandiri',
    paymentType: 'DP Booking Fee (5%)',
    amount: 10800000,
    dueDate: '14 September 2026',
    paidDate: '12 September 2026, 14:20 WITA',
    status: 'Terkunci di Escrow',
    method: 'Mandiri Virtual Account',
    vaNumber: '89201-098234110928',
    escrowGuarantor: 'PT Penjamin Transaksi Pangan Indonesia (Escrow Resmi Platform)'
  }
];
