# Bayu Digital Store (digitalby)

Web jualan produk digital (template, ebook/PDF, dokumen) yang **otomatis unlock download** begitu pembayaran QRIS terverifikasi — tanpa campur tangan manual.

Didesain khusus dengan tema **Comic Modern Mobile-First**, berkinerja tinggi, dan dibangun dengan standar keamanan tingkat tinggi.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 (CSS-first `@theme` configuration) + Framer Motion
- **UI Components**: Custom Comic Modern Design System + Lucide Icons
- **Database**: PostgreSQL (Neon) + Prisma ORM Client v7
- **Authentication**: NextAuth v5 + Argon2id Password Hashing + 2FA TOTP (`otplib`)
- **Storage**: Vercel Blob (Private Storage)
- **Payment Gateway**: iPaymu Payment Direct API v2 (QRIS Dinamis)
- **Data Visualization**: Recharts (Dashboard Admin)
- **Validation**: Zod & Security Headers

---

## 🔒 Fitur Keamanan

1. **Private File Storage**: File produk asli disimpan secara privat di Vercel Blob dan hanya bisa diakses via streaming endpoint `/api/download/[token]` setelah status transaksi `PAID`.
2. **Double-Check Webhook Verification**: Setiap notifikasi webhook dari iPaymu dikonfirmasi ulang via panggilan server-to-server ke API Cek Status iPaymu sebelum update database.
3. **Pencegahan Fraud Nominal**: Penyesuaian `amount` hasil verifikasi server dengan `amount` di database.
4. **Token Unduhan Kriptografis**: Menggunakan 32-byte `crypto.randomBytes(32)` token dengan batas kedaluwarsa 24 jam dan limit penggunaan `maxUses`.
5. **IDOR & Enumeration Protection**: Seluruh URL publik menggunakan ID UUID acak.
6. **Proteksi Admin**:
   - `robots.txt` Disallow `/admin`
   - Header `X-Robots-Tag: noindex, nofollow`
   - Bebas dari link/tombol publik menuju `/admin`
   - Proteksi Login dengan Hash **Argon2id**, **2FA TOTP (Google Authenticator/Authy)**, dan Rate Limiting percobaan login per IP.
   - Audit Log mencatat semua aktivitas sensitif admin.

---

## 📋 Langkah Persiapan & Setup (Panduan Pengguna)

### 1. Environment Variables (`.env`)
Buat file `.env` di root direktori dan lengkapi variabel berikut:

```env
DATABASE_URL="postgresql://username:password@ep-xyz.neon.tech/bayudigitalstore?sslmode=require"
NEXTAUTH_SECRET="buat-secret-string-acak-yang-panjang"
NEXTAUTH_URL="https://domain-anda.vercel.app" # atau http://localhost:3000 saat dev
ADMIN_SEED_EMAIL="muhamadaibayu@gmail.com"
ADMIN_SEED_PASSWORD="PasswordKuatAdmin2026!"
IPAYMU_VA="Nomor_Virtual_Account_iPaymu"
IPAYMU_API_KEY="API_Key_iPaymu"
IPAYMU_MODE="sandbox" # Ganti ke "production" jika sudah disetujui iPaymu
BLOB_READ_WRITE_TOKEN="token_vercel_blob"
```

### 2. Inisialisasi Database & Seed Admin
Jalankan perintah berikut untuk menerapkan schema database dan membuat akun admin pertama beserta Kunci Rahasia 2FA TOTP:

```bash
# Push schema ke database PostgreSQL
npx prisma db push

# Run seed script untuk membuat akun Admin & Kunci 2FA TOTP
npm run db:seed
```

Simpan **Kunci Secret 2FA TOTP** yang muncul di terminal ke aplikasi **Google Authenticator** atau **Authy**.

### 3. Pendaftaran Akun iPaymu (Merchant QRIS)
1. Isi katalog toko dengan **minimal 5 produk asli** terlebih dahulu.
2. Daftar akun di [https://my.ipaymu.com/members/signup.htm](https://my.ipaymu.com/members/signup.htm) (Gratis & cukup E-KTP).
3. Salin `VA` dan `API Key` dari dashboard iPaymu ke `.env`.
4. Atur `notifyUrl` webhook di dashboard iPaymu ke `https://domain-anda.vercel.app/api/webhook/ipaymu`.

---

## 📞 Kontak Dukungan

- **WhatsApp**: `085317126862` ([https://wa.me/6285317126862](https://wa.me/6285317126862))
- **Email**: `muhamadaibayu@gmail.com` ([mailto:muhamadaibayu@gmail.com](mailto:muhamadaibayu@gmail.com))
