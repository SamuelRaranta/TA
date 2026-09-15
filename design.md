---
version: alpha
name: AgriConnect Design System (Nexora Light SaaS Specification)
description: Sistem desain antarmuka modern Light SaaS untuk AgriConnect berdasarkan referensi visual Nexora yang sangat presisi, berkontras tinggi, dan bersih.
colors:
  bg-canvas: "#ffffff"
  bg-canvas-subtle: "#f8fafc"
  bg-surface-card: "#ffffff"
  border-subtle: "#e2e8f0"
  border-card: "#eef2f6"
  accent-primary: "#2563eb"
  accent-primary-hover: "#1d4ed8"
  accent-primary-light: "#eff6ff"
  accent-primary-border: "#bfdbfe"
  accent-emerald: "#10b981"
  accent-amber: "#f59e0b"
  text-primary: "#0f172a"
  text-secondary: "#475569"
  text-muted: "#94a3b8"
typography:
  sans:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
  display:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontWeight: 800
    letterSpacing: "-0.035em"
  mono:
    fontFamily: "JetBrains Mono, monospace"
rounded:
  base: "0.5rem"
  card: "1rem"
  modal: "1.25rem"
  pill: "9999px"
---

# AgriConnect Design System (Nexora Visual Specification)

> **Visual Reference Alignment:**
> Antarmuka web diselaraskan secara ketat dengan desain visual **Nexora** (Clean Light SaaS):
> - Kanvas putih bersih (`#ffffff` / `#f8fafc`) dengan gradien mesh biru lembut di bagian hero.
> - Aksen utama **Royal Blue** (`#2563eb`) untuk headline highlight dan tombol utama.
> - Tipografi tebal Slate 900 (`#0f172a`) dengan subteks Slate 600 (`#475569`).
> - Komponen kartu rounded 16px dengan border `#e2e8f0` dan bayangan lembut.
> - Tombol pill melingkar dengan ikon panah putih di lingkaran kanan (`btn-circle-icon`).
> - Dashboard tablet melayang 3D berdimensi halus.

---

## 1. Mapping Elemen ke Gambar Referensi

| Elemen Referensi Nexora | Implementasi AgriConnect | Konten yang Dipertahankan |
|---|---|---|
| **Header Navbar** | Navbar putih bersih dengan logo geometric, link navigasi tengah, dan tombol pill `Masuk / Daftar` dengan ikon panah melingkar. | Seluruh menu: Jelajah Komoditas, Alur Binding, Harga Hari Ini, Keunggulan, serta Role Switcher (Petani/Pembeli). |
| **Top Pill Badge** | Pill badge biru lembut `[INFO] Transaksi Langsung Bebas Tengkulak >`. | Nilai pembeda platform tanpa tengkulak. |
| **Hero Headline & Copy** | *"Jual Beli Hasil Pertanian Skala Besar dengan **Penawaran Terikat**"* (kata kunci berwarna Royal Blue). | Teks headline dan penjelasan platform AgriConnect 100% utuh. |
| **Hero Dual Buttons** | Tombol primer pill biru dengan ikon panah putih + tombol teks outline dengan ikon play. | `Mulai Jual Panen (Petani)` dan `Jelajah Pasokan (Pembeli)`. |
| **Trust Checklist** | Barisan 3 checkmark dengan ikon centang biru melingkar. | `14.800+ Ton Terikat`, `Rp 86.4 M Transaksi`, `1.240+ Petani Terverifikasi`. |
| **Floating 3D Tablet Dashboard** | Mockup tablet putih melayang dengan bayangan 3D lembut, orbs biru halus, dan kartu statistik di bagian atas. | Simulator Deal Ticket interaktif (Jagung 50T, Beras 30T, Bawang 15T) + slider tonase riil + penguncian binding. |
| **Trusted Companies Row** | Strip logo institusi abu-abu monokrom di bawah hero. | Lembaga acuan resmi: PIHPS Nasional, Bapanas, Kementan, PI Cipinang, PI Kramat Jati, serta ticker harga pasar harian. |
| **3x2 Feature Grid** | Grid 6 kartu putih rounded dengan badge kategori, judul tebal, deskripsi, metrik harga/stok, dan link `Ajukan Penawaran Terikat ➔`. | 6 Komoditas lengkap: Beras Subang, Jagung Kediri, Bawang Brebes, Cabai Magelang, Kopi Gayo, Kedelai Grobogan. |
| **Bottom Split Section** | Sisi kiri mockup kartu dashboard alur kerja + sisi kanan teks penjelasan dengan list centang biru dan tombol CTA biru. | Alur 4 tahap binding (Listing $\rightarrow$ Penawaran $\rightarrow$ Binding $\rightarrow$ Transaksi Langsung) dan tombol simulasi penawaran. |
| **Bento & Value Prop** | Kartu bento putih bersih dengan border halus `#e2e8f0` dan visualisasi perbandingan margin riil. | Data komparasi margin petani (+18.4% vs tengkulak), protokol KYC lahan, dan inspeksi fisik gudang. |
| **Modals & Footer** | Modal kartu putih bersih dengan bayangan modern + footer slate bergaris batas halus. | Seluruh formulir simulasi penawaran, pendaftaran role petani/pembeli, kontak, dan disclaimer legalitas. |
