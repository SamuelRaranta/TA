# PRD (Product Requirements Document)
## AgriConnect — Marketplace Jual Beli Hasil Pertanian Skala Besar dengan Fitur Binding

**Versi:** 1.0
**Tanggal:** 11 September 2026
**Status:** Draft untuk review

---

## 1. Ringkasan Produk

AgriConnect adalah platform website marketplace yang menghubungkan **petani** (penjual hasil pertanian skala besar) dengan **pembeli** (individu, distributor, atau perusahaan) secara langsung, tanpa perantara/tengkulak. Platform berperan sebagai **penghubung (connector)** — bukan penyedia logistik maupun pihak yang menangani pembayaran penuh transaksi.

Fitur utama yang membedakan platform ini adalah **fitur Binding (Penawaran Terikat)**: mekanisme di mana pembeli mengajukan penawaran atas suatu produk, dan setelah disepakati kedua pihak, sistem membuat sebuah **kesepakatan digital (binding agreement)** yang mengikat petani dan pembeli terhadap jumlah, harga, dan jadwal yang telah disetujui — sebagai bentuk komitmen awal sebelum transaksi final dilakukan langsung antar pihak.

---

## 2. Latar Belakang & Masalah yang Diselesaikan

- Petani skala besar kesulitan menjangkau pembeli langsung dan sering bergantung pada tengkulak dengan harga tidak adil.
- Pembeli (distributor/perusahaan) kesulitan mendapatkan pasokan hasil pertanian dalam jumlah besar dengan kepastian harga dan jumlah.
- Tidak ada mekanisme formal yang mengikat kesepakatan awal antara petani dan pembeli sebelum transaksi fisik dilakukan, sehingga sering terjadi pembatalan sepihak.

---

## 3. Tujuan Produk (Goals)

1. Menyediakan wadah jual-beli hasil pertanian skala besar yang transparan antara petani dan pembeli.
2. Menghadirkan fitur **Binding/Penawaran** yang memberi kepastian & komitmen kedua belah pihak sebelum transaksi fisik.
3. Menyediakan sistem verifikasi petani & pembeli agar marketplace terpercaya.
4. Memberikan panel admin yang dapat memoderasi, memverifikasi, dan memantau seluruh aktivitas platform.

### Non-Goals (Di Luar Cakupan MVP)
- Platform **tidak** menyediakan layanan logistik/pengiriman terintegrasi. Pembeli bertanggung jawab mengecek & mengambil barang langsung dari petani.
- Platform **tidak** menyediakan escrow otomatis untuk pembayaran penuh. Pembayaran dilakukan langsung antar pihak (offline), atau melalui platform hanya sebagai **tanda jadi/booking fee** untuk mengunci kesepakatan binding.

---

## 4. Target Pengguna (User Persona)

| Persona | Deskripsi | Kebutuhan Utama |
|---|---|---|
| **Petani** | Petani/kelompok tani skala besar (padi, jagung, sayur, buah, komoditas ekspor, dll) | Menjual hasil panen, mendapat pembeli tetap, kepastian transaksi |
| **Pembeli** | Individu, distributor, atau perusahaan (pabrik, eksportir, retail) yang butuh pasokan dalam jumlah besar | Mencari pasokan terpercaya, harga kompetitif, kepastian jumlah & waktu |
| **Admin** | Pengelola platform | Moderasi, verifikasi user, monitoring transaksi & sengketa |

---

## 5. Ruang Lingkup Fitur (Feature Scope)

| Modul | Petani | Pembeli | Admin |
|---|---|---|---|
| Landing Page | ✅ | ✅ | - |
| Registrasi & Login | ✅ | ✅ | ✅ (khusus admin) |
| Kelola Produk/Listing | ✅ | - | Moderasi |
| Cari & Jelajah Produk | - | ✅ | - |
| Fitur Penawaran (Offer) | ✅ (terima/tolak/nego) | ✅ (ajukan) | Monitoring |
| Binding Agreement | ✅ | ✅ | Monitoring & dispute |
| Chat/Negosiasi | ✅ | ✅ | - |
| Riwayat Transaksi | ✅ | ✅ | Semua data |
| Rating & Ulasan | ✅ (menerima) | ✅ (memberi) | Moderasi |
| Verifikasi Akun (KYC) | ✅ (ajukan) | ✅ (ajukan) | ✅ (approve/reject) |
| Harga Hari Ini (Info Harga Pasar) | ✅ (lihat) | ✅ (lihat) | ✅ (input & kelola) |
| Manajemen Kategori Komoditas | - | - | ✅ |
| Pengaturan Platform | - | - | ✅ |

---

## 6. Rincian Halaman, User Story & Task

### 6.1 Landing Page

**Tujuan:** Mengenalkan platform, mendorong pengunjung mendaftar sebagai Petani atau Pembeli.

**User Story:**
- Sebagai pengunjung, saya ingin memahami apa itu AgriConnect dan cara kerjanya agar saya yakin untuk mendaftar.

**Komponen Halaman:**
- Hero section: tagline + CTA "Daftar sebagai Petani" / "Daftar sebagai Pembeli"
- Section "Cara Kerja" (alur: Listing → Penawaran → Binding → Transaksi Langsung)
- Section kategori komoditas unggulan
- Section keunggulan platform (transparansi harga, kepastian kesepakatan, langsung tanpa tengkulak)
- Section testimoni/studi kasus (jika tersedia)
- Footer: tentang kami, syarat & ketentuan, kebijakan privasi, kontak

**Task/Acceptance Criteria:**
- [ ] Desain hero section responsif (desktop & mobile)
- [ ] CTA routing ke halaman registrasi dengan parameter role (petani/pembeli)
- [ ] Komponen showcase kategori komoditas (dinamis dari data admin)
- [ ] Bagian "Cara Kerja" menjelaskan alur binding secara visual (stepper/diagram)
- [ ] Footer dengan tautan legal & kontak

---

### 6.2 Registrasi & Login

**Tujuan:** Memungkinkan petani dan pembeli membuat akun dan masuk ke platform dengan role masing-masing.

**User Story:**
- Sebagai petani, saya ingin mendaftar dengan data lahan & komoditas saya agar dapat mulai berjualan.
- Sebagai pembeli, saya ingin mendaftar dengan data diri/perusahaan saya agar dapat mencari & menawar produk.
- Sebagai pengguna terdaftar, saya ingin login dengan email/no HP & password.

**Komponen Halaman:**
- Pemilihan role saat registrasi (Petani / Pembeli)
- Form registrasi Petani: nama lengkap, email, no HP, password, alamat/lokasi lahan, jenis komoditas utama, luas lahan (opsional), upload KTP untuk verifikasi
- Form registrasi Pembeli: nama/nama perusahaan, tipe pembeli (individu/distributor/perusahaan), email, no HP, password, alamat, upload identitas/NIB (jika perusahaan)
- Verifikasi email atau OTP no HP
- Halaman Login (email/no HP + password)
- Lupa password → reset via email/OTP
- Status akun: "Menunggu Verifikasi" sebelum bisa transaksi penuh

**Task/Acceptance Criteria:**
- [ ] Form multi-step dengan validasi input per role
- [ ] Integrasi OTP (email/SMS) untuk verifikasi akun
- [ ] Auth berbasis token (JWT/session) dengan role-based access control
- [ ] Alur lupa password & reset password
- [ ] Upload dokumen (KTP/NIB) tersimpan aman, status "pending review" oleh admin
- [ ] Notifikasi status verifikasi ke user (diterima/ditolak)

---

### 6.3 Halaman Petani (Dashboard Petani)

**Tujuan:** Petani dapat mengelola produk, menerima penawaran, dan mengelola binding agreement.

**User Story:**
- Sebagai petani, saya ingin menambahkan produk hasil panen saya agar dapat dilihat pembeli.
- Sebagai petani, saya ingin menerima/menolak/menego penawaran dari pembeli.
- Sebagai petani, saya ingin melihat status kesepakatan (binding) yang sedang berjalan.

**Sub-halaman & Fitur:**

1. **Dashboard Ringkasan**
   - Jumlah produk aktif, penawaran masuk (baru), binding aktif, transaksi selesai
   - Widget "Harga Hari Ini" (ringkasan harga komoditas terkait produk milik petani)
2. **Harga Hari Ini (Info Harga Pasar)**
   - Menampilkan daftar perkiraan harga komoditas hari ini yang diinput admin
   - Filter berdasarkan kategori komoditas
   - Setiap entri menampilkan: nama komoditas, harga per satuan, satuan, wilayah/pasar acuan (jika ada), sumber/referensi harga, tanggal & waktu update terakhir
   - Berfungsi sebagai referensi bagi petani saat menentukan harga jual di listing produknya
3. **Kelola Produk**
   - Tambah/edit/hapus produk: nama komoditas, kategori, jumlah/stok, satuan (kg/ton/karung), harga per satuan, foto produk, lokasi, estimasi waktu panen (jika pre-order), deskripsi kualitas/grade
   - Status produk: Tersedia / Habis / Nonaktif
4. **Kelola Penawaran (Offer Masuk)**
   - List penawaran dari pembeli (nama pembeli, jumlah diminta, harga tawaran, catatan)
   - Aksi: Terima / Tolak / Beri Counter-offer
5. **Binding Agreement**
   - Setelah offer disepakati → sistem generate detail perjanjian: komoditas, jumlah, harga disepakati, jadwal pengambilan/verifikasi barang, metode pembayaran (langsung/tanda jadi via platform)
   - Status: Menunggu Konfirmasi → Terikat → Selesai / Dibatalkan
   - Update status transaksi manual oleh petani (misal "Barang Siap Diambil", "Transaksi Selesai")
6. **Riwayat Transaksi**
   - Daftar seluruh binding agreement & transaksi selesai/batal
7. **Chat/Negosiasi**
   - Percakapan langsung dengan pembeli terkait penawaran
8. **Profil & Verifikasi**
   - Data diri, lokasi lahan, dokumen verifikasi, status akun
9. **Notifikasi**
   - Penawaran baru, perubahan status binding, pesan chat

**Task/Acceptance Criteria:**
- [ ] Halaman/widget "Harga Hari Ini" menampilkan data harga terbaru dari admin (read-only bagi petani), dengan info sumber/referensi & tanggal update
- [ ] CRUD produk dengan upload multi-foto
- [ ] List & filter penawaran masuk berdasarkan status
- [ ] Alur terima/tolak/counter-offer dengan update real-time ke pembeli
- [ ] Generate dokumen binding agreement otomatis (format terstruktur, dapat diunduh sebagai PDF)
- [ ] Manajemen status binding (state machine: pending → accepted → bound → completed/cancelled)
- [ ] Riwayat transaksi dengan filter tanggal/status
- [ ] Sistem chat sederhana (real-time atau polling)
- [ ] Halaman profil dengan form edit & upload ulang dokumen verifikasi

---

### 6.4 Halaman Pembeli (Dashboard Pembeli)

**Tujuan:** Pembeli dapat mencari produk, mengajukan penawaran, dan mengelola binding agreement.

**User Story:**
- Sebagai pembeli, saya ingin mencari & memfilter produk hasil pertanian berdasarkan kategori, lokasi, dan harga.
- Sebagai pembeli, saya ingin mengajukan penawaran jumlah & harga kepada petani.
- Sebagai pembeli, saya ingin melihat status binding agreement saya dan menjadwalkan pengecekan barang.

**Sub-halaman & Fitur:**

1. **Dashboard Ringkasan**
   - Penawaran aktif, binding berjalan, transaksi selesai
   - Widget "Harga Hari Ini" (ringkasan harga komoditas yang sering dicari)
2. **Harga Hari Ini (Info Harga Pasar)**
   - Menampilkan daftar perkiraan harga komoditas hari ini yang diinput admin
   - Filter berdasarkan kategori komoditas
   - Setiap entri menampilkan: nama komoditas, harga per satuan, satuan, wilayah/pasar acuan (jika ada), sumber/referensi harga, tanggal & waktu update terakhir
   - Berfungsi sebagai acuan pembeli saat menegosiasikan penawaran ke petani
3. **Jelajah/Cari Produk**
   - Filter: kategori komoditas, lokasi, rentang harga, jumlah minimum, status ketersediaan
   - Sort: harga, terbaru, rating petani
4. **Detail Produk**
   - Foto, deskripsi, harga, stok tersedia, lokasi, profil & rating petani
   - Tombol "Ajukan Penawaran"
5. **Ajukan Penawaran (Offer)**
   - Form: jumlah yang diinginkan, harga tawaran per satuan, catatan/syarat tambahan
   - Lihat status penawaran: Menunggu Respon / Diterima / Ditolak / Counter-offer dari petani
6. **Binding Agreement**
   - Detail kesepakatan setelah offer disetujui
   - Opsi pembayaran tanda jadi (booking fee) via platform **atau** kesepakatan pembayaran langsung (dicatat manual di sistem)
   - Jadwal kunjungan/pengecekan barang ke lokasi petani
   - Update status setelah barang dicek & transaksi selesai
7. **Riwayat Transaksi**
8. **Rating & Ulasan**
   - Memberi rating/ulasan ke petani setelah transaksi selesai
9. **Chat/Negosiasi**
10. **Profil & Verifikasi**
11. **Notifikasi**

**Task/Acceptance Criteria:**
- [ ] Halaman/widget "Harga Hari Ini" menampilkan data harga terbaru dari admin (read-only bagi pembeli), dengan info sumber/referensi & tanggal update
- [ ] Search & filter produk dengan performa baik (indexable/searchable)
- [ ] Halaman detail produk lengkap dengan info petani
- [ ] Form pengajuan penawaran dengan validasi jumlah minimum
- [ ] Tracking status penawaran secara real-time
- [ ] Halaman binding agreement dengan opsi pembayaran tanda jadi (integrasi payment gateway dasar, bukan escrow)
- [ ] Fitur penjadwalan kunjungan/pengecekan barang (tanggal & catatan)
- [ ] Form rating & ulasan pasca transaksi
- [ ] Riwayat & filter transaksi

---

### 6.5 Halaman Admin

**Tujuan:** Mengelola, memoderasi, dan memantau seluruh aktivitas di platform.

**User Story:**
- Sebagai admin, saya ingin memverifikasi akun petani & pembeli agar platform tetap terpercaya.
- Sebagai admin, saya ingin memantau transaksi & binding agreement untuk menangani sengketa.
- Sebagai admin, saya ingin mengelola kategori komoditas dan pengaturan platform.

**Sub-halaman & Fitur:**

1. **Dashboard Analitik**
   - Total user (petani/pembeli), total produk aktif, total transaksi, estimasi GMV, grafik pertumbuhan
2. **Manajemen User**
   - List petani & pembeli, status verifikasi (pending/approved/rejected), detail dokumen KYC
   - Aksi: Approve/Reject verifikasi, Suspend/Banned akun
3. **Manajemen Produk**
   - Moderasi listing (hapus produk yang melanggar aturan/tidak sesuai)
4. **Manajemen Kategori Komoditas**
   - Tambah/edit/hapus kategori & sub-kategori komoditas
5. **Kelola Harga Hari Ini (Info Harga Pasar)**
   - Input/edit/hapus data perkiraan harga komoditas harian
   - Field input per entri:
     - Nama komoditas (terhubung ke Manajemen Kategori Komoditas)
     - Harga per satuan (Rp)
     - Satuan (kg/ton/karung/kuintal, dll)
     - Wilayah/pasar acuan (opsional, misal: "Pasar Induk Kramat Jati" atau "Rata-rata Nasional")
     - Sumber/referensi harga (wajib diisi, misal: nama instansi seperti Kementerian Pertanian/PIHPS/Bapanas, nama pasar, atau tautan/link sumber berita)
     - Catatan tambahan (opsional)
     - Tanggal & waktu berlaku (default: hari ini, dapat diubah untuk update historis)
   - Riwayat perubahan harga per komoditas (log harga dari hari ke hari) untuk keperluan tren/grafik
   - Status publikasi: Draft / Dipublikasikan (agar admin bisa menyiapkan data sebelum tayang ke petani & pembeli)
6. **Manajemen Transaksi & Binding Agreement**
   - Monitoring seluruh binding agreement (status, nilai, pihak terkait)
   - Fitur resolusi sengketa (jika salah satu pihak membatalkan sepihak/komplain)
7. **Manajemen Laporan/Komplain**
   - Inbox laporan dari user, status penanganan
8. **Pengaturan Platform**
   - Biaya komisi (jika ada), banner promosi landing page, syarat & ketentuan, kebijakan privasi
9. **Log Aktivitas**
   - Riwayat aksi admin & sistem untuk audit

**Task/Acceptance Criteria:**
- [ ] Dashboard dengan visualisasi data (chart jumlah user/transaksi per waktu)
- [ ] Tabel manajemen user dengan filter status & aksi approve/reject/suspend
- [ ] Tabel moderasi produk dengan aksi hapus/nonaktifkan
- [ ] CRUD kategori komoditas
- [ ] Form input/edit "Harga Hari Ini" dengan field wajib: komoditas, harga, satuan, dan sumber/referensi harga
- [ ] Validasi: sumber/referensi harga tidak boleh kosong sebelum data dipublikasikan
- [ ] Riwayat log perubahan harga per komoditas (untuk keperluan tren historis)
- [ ] Status draft/publikasi agar data tidak langsung tampil ke petani/pembeli sebelum siap
- [ ] Panel monitoring binding agreement dengan detail & aksi penyelesaian sengketa
- [ ] Sistem tiket/komplain sederhana
- [ ] Halaman pengaturan platform (form pengaturan global)
- [ ] Log audit trail untuk seluruh aksi admin

---

## 7. Alur Utama Fitur Binding (Core Flow)

```
1. Pembeli menemukan produk di halaman Jelajah
2. Pembeli mengajukan Penawaran (jumlah, harga, catatan)
3. Petani menerima notifikasi penawaran
4. Petani: Terima / Tolak / Beri Counter-offer
5. Jika disepakati kedua pihak →
   Sistem generate Binding Agreement (dokumen digital):
   - Komoditas, jumlah, harga disepakati
   - Jadwal pengecekan/pengambilan barang
   - Metode pembayaran (langsung atau tanda jadi via platform)
6. (Opsional) Pembeli membayar tanda jadi via platform → status "Terikat"
7. Pembeli menjadwalkan kunjungan untuk mengecek barang langsung ke petani
8. Setelah barang dicek & disepakati → transaksi final dilakukan langsung antar pihak
9. Kedua pihak menandai transaksi "Selesai" di sistem
10. Pembeli memberi rating & ulasan ke petani
```

**Catatan Penting:**
- Platform **tidak menjamin** kondisi fisik barang — pengecekan barang sepenuhnya tanggung jawab pembeli sebelum transaksi final.
- Binding agreement berfungsi sebagai **komitmen tertulis**, bukan kontrak hukum yang mengikat secara otomatis (perlu disebutkan dalam Syarat & Ketentuan).
- Jika salah satu pihak membatalkan sepihak setelah binding, admin dapat menjadi mediator melalui fitur resolusi sengketa.

---

## 8. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Keamanan** | Enkripsi password, validasi upload dokumen, proteksi data pribadi (UU PDP) |
| **Performa** | Halaman jelajah produk & pencarian harus responsif meski data besar (gunakan indexing/pagination) |
| **Skalabilitas** | Arsitektur mendukung penambahan jumlah user & produk seiring pertumbuhan |
| **Kompatibilitas** | Responsif di desktop & mobile browser |
| **UI/UX & Animasi** | Antarmuka dinamis dan modern dengan animasi halus (60 FPS) berbasis Motion (Framer Motion) untuk feedback interaksi, transisi modal, dan navigasi yang responsif tanpa lag |
| **Ketersediaan** | Uptime tinggi, khususnya untuk fitur penawaran & binding |
| **Audit Trail** | Seluruh perubahan status binding & transaksi tercatat dengan timestamp |

---

## 9. Metrik Keberhasilan (Success Metrics)

- Jumlah petani & pembeli terverifikasi
- Jumlah produk aktif per bulan
- Jumlah penawaran yang berhasil menjadi binding agreement (conversion rate)
- Jumlah transaksi selesai vs dibatalkan
- Rata-rata waktu dari penawaran → binding agreement
- Rating rata-rata petani

---

## 10. Fase Pengembangan (Rekomendasi)

**Fase 1 — MVP:**
- Landing page, Registrasi/Login, Kelola Produk (petani), Jelajah Produk (pembeli), Fitur Penawaran, Binding Agreement dasar (tanpa payment gateway), Admin dasar (verifikasi user & moderasi produk)
- Setup arsitektur frontend dengan **React + Vite** serta integrasi animasi awal dengan **Motion**

**Fase 2:**
- Integrasi payment gateway untuk tanda jadi/booking fee, Chat real-time, Rating & ulasan, Dashboard analitik admin lebih lengkap

**Fase 3:**
- Fitur resolusi sengketa lebih matang, laporan/ekspor data, notifikasi push/email otomatis, peningkatan skalabilitas

---

## 11. Arsitektur & Teknologi Frontend (Tech Stack)

| Komponen | Teknologi Terpilih | Alasan & Peran dalam Platform |
|---|---|---|
| **Framework UI** | **React** | Komponen modular, ekosistem kaya, dan state management andal untuk menangani alur interaktif kompleks (penawaran & binding agreement). |
| **Build Tool & Bundler** | **Vite** | Waktu inisiasi server dev instan (HMR kilat), konfigurasi modern, serta bundling produksi yang sangat cepat dan teroptimasi. |
| **Animation Library** | **Motion (Framer Motion)** | Menghadirkan animasi deklaratif berbasis spring physics, micro-interactions, transisi modal/pop-up (`AnimatePresence`), dan animasi scroll (`whileInView`). |

### 11.1 Penerapan Animasi (Motion Design Scope)

1. **Landing Page & Edukasi Platform**:
   - **Hero Section**: Animasi *staggered fade-in & slide-up* untuk headline, sub-headline, dan tombol CTA pendaftaran.
   - **Alur Binding Agreement**: Visualisasi alur 4 langkah (Listing → Penawaran → Binding → Transaksi Langsung) yang muncul secara berurutan (*reveal on scroll*) saat pengguna menggulir halaman.
   - **Kategori & Komoditas Unggulan**: Kartu kategori dengan efek *hover lift* dan transisi skala halus.

2. **Katalog & Kartu Produk (Listing Komoditas)**:
   - Animasi transisi mulus saat pengguna memfilter atau mengurutkan produk pertanian.
   - Micro-interaction pada kartu produk (`whileHover={{ y: -4 }}`) dan tombol aksi penawaran (`whileTap={{ scale: 0.98 }}`).

3. **Alur Penawaran & Binding Agreement (Core Feature)**:
   - **Modal Penawaran (Offer Modal)**: Efek modal muncul dan keluar yang mulus menggunakan `<AnimatePresence>` untuk pengalaman pengguna yang intuitif.
   - **Perubahan Status Kesepakatan**: Feedback visual beranimasi saat status binding berubah (misal: dari *Menunggu Respon* menjadi *Terikat*).

4. **Standar & Optimalisasi Performa Animasi**:
   - Memprioritaskan properti yang diproses oleh GPU (*composite properties* seperti `transform` dan `opacity`) untuk mencegah *layout thrashing*.
   - Animasi scroll menggunakan opsi `viewport={{ once: true }}` agar tidak memicu animasi berulang yang membebani kinerja perangkat.

---

## 12. Asumsi & Pertanyaan Terbuka

- Belum ditentukan: apakah platform mengambil komisi dari setiap binding agreement/transaksi yang berhasil.
- Belum ditentukan: payment gateway apa yang akan digunakan untuk tanda jadi (Midtrans, Xendit, dll).
- Belum ditentukan: apakah dibutuhkan versi mobile app di fase selanjutnya.
- Perlu ketentuan hukum terkait status binding agreement (apakah mengikat secara hukum atau hanya komitmen moral) — disarankan konsultasi dengan pihak legal.
- Data "Harga Hari Ini" diinput manual oleh admin (bukan integrasi otomatis dengan API pihak ketiga seperti PIHPS/Bapanas) pada fase MVP. Integrasi otomatis dapat dipertimbangkan di fase berikutnya jika dibutuhkan.
- Perlu disepakati apakah harga yang ditampilkan berlaku secara nasional/rata-rata, atau per wilayah/pasar tertentu.

---


