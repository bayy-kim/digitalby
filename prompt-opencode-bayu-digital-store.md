# PROMPT OPENCODE — Bayu Digital Store

> Paste seluruh isi file ini ke OpenCode CLI sebagai instruksi awal. Ini proyek BARU (bukan lanjutan M2A Co-Biz / Tekakonik), jadi buat repo terpisah.

## 0. Ringkasan Proyek

Bikin web jualan produk digital (template, ebook/PDF, dokumen) yang **otomatis unlock download** begitu pembayaran QRIS terverifikasi — tanpa campur tangan manual. Nanti link-nya ditaruh di TikTok/bio, jadi harus cepat, mobile-first, dan kelihatan profesional (gaya komik modern, BUKAN template SaaS generic).

**Kontak yang harus muncul (ikon saja, TANPA emoji di manapun di seluruh UI):**
- WhatsApp: `085317126862` → link `https://wa.me/6285317126862`
- Email: `muhamadaibayu@gmail.com` → link `mailto:muhamadaibayu@gmail.com`

**Aturan keras:**
- TIDAK ADA data dummy/placeholder produk. Katalog mulai KOSONG, admin isi sendiri lewat admin panel.
- TIDAK ADA link/tombol apapun di halaman publik yang mengarah ke `/admin`. Admin panel harus "tersembunyi" — hanya bisa diakses kalau tahu URL-nya langsung.
- Semua teks UI Bahasa Indonesia, kode/komentar Bahasa Inggris standar.

---

## 1. Tech Stack (WAJIB — konsisten dengan stack proyek Bayu lainnya)

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 — **CSS-first only**, token di `@theme` dalam `globals.css`, JANGAN buat `tailwind.config.ts`
- shadcn/ui + Framer Motion
- Prisma ORM + PostgreSQL (Neon)
- NextAuth v5 — **hanya untuk admin**, tidak ada akun customer/publik
- Vercel Blob — **private** file storage (produk asli TIDAK boleh punya public URL langsung)
- iPaymu Payment API v2 — QRIS dinamis (Payment Direct API)
- lucide-react untuk semua ikon (WhatsApp, Mail, Download, Lock, dll) — no emoji, no icon library lain
- Zod untuk semua validasi input/output API
- otplib untuk 2FA TOTP admin
- Recharts untuk dashboard admin

---

## 2. Arah Desain (Comic Modern, Mobile-First)

- Mobile-first wajib: desain & test dari layar kecil dulu (360–430px), baru scale up ke tablet/desktop.
- Gaya komik yang MODERN dan KHAS, bukan AI-slop generic:
  - Border tebal (3–4px) hitam pada card/panel, sudut sedikit tidak simetris biar terasa hand-crafted
  - Halftone dot texture sebagai aksen background (subtle, jangan berlebihan/mengganggu keterbacaan)
  - Warna dasar: putih + hitam + satu warna aksen kuat (merah, boleh terinspirasi warna QRIS/GPN tapi JANGAN reproduksi logo QRIS/GPN asli — itu milik ASPI/Bank Indonesia, bukan brand Bayu)
  - Tombol CTA gaya "impact/burst" komik (bisa pakai clip-path/SVG bentuk bintang meledak untuk badge "Beli Sekarang", bukan cuma rounded rectangle standar)
  - Speech-bubble shape untuk testimonial/badge kepercayaan (opsional)
- Tipografi: heading pakai font display tebal (Bangers atau Archivo Black — pilihan konsisten proyek Bayu lain), body pakai Plus Jakarta Sans
- HINDARI: gradient ungu-biru generic ala template AI, drop shadow lembek generic, ilustrasi 3D blob generic
- Gunakan skill `frontend-design` dan `ui-ux-pro-max` untuk referensi eksekusi detail sebelum ngoding style.

---

## 3. Struktur Halaman Publik

### `/` — Landing + Katalog
- Hero singkat (headline + sub, tombol scroll ke katalog)
- Grid produk (cover image, judul, harga format Rupiah, badge format file)
- Kalau katalog kosong: empty state tetap in-style komik ("Belum ada produk, balik lagi nanti" — bukan halaman putih kosong)
- Footer: ikon WhatsApp + ikon Email (link langsung, no emoji)

### `/produk/[slug]`
- Cover, deskripsi lengkap, harga, format file (badge: TXT/PDF/DOCX), ukuran file
- Tombol "Beli Sekarang" → generate order → redirect ke `/checkout/[orderId]`

### `/checkout/[orderId]`
- Tampilkan QRIS dinamis (image dari response Tripay, base64 atau URL)
- Nominal harus PERSIS sama dengan yang di-generate sistem (customer tidak bisa ubah nominal — cegah fraud "bayar kurang")
- Countdown waktu kedaluwarsa transaksi
- Auto-poll status tiap beberapa detik (bukan customer klik refresh manual)
- Saat status jadi PAID → auto redirect ke `/order/[orderId]`

### `/order/[orderId]`
- Status PENDING: pesan tunggu + spinner komik
- Status PAID: tombol "Unduh File" → hit endpoint yang generate signed URL sekali-pakai (lihat bagian Keamanan)
- Status EXPIRED/FAILED: pesan jelas + tombol "Buat Order Baru"
- Simpan juga histori order berdasarkan `order_id` di URL (jangan wajib login/akun customer — cukup order_id sebagai kunci akses, tapi order_id HARUS random UUID, bukan angka urut, supaya tidak bisa ditebak/di-enumerasi orang lain — lihat bagian Keamanan poin IDOR)

---

## 4. Admin Panel (`/admin/*`) — HANYA Bayu yang bisa akses

### Proteksi akses tingkat SEO/crawler
- `robots.txt`: `Disallow: /admin`
- Semua halaman `/admin/*`: `<meta name="robots" content="noindex, nofollow">`
- Tidak ada satupun `<Link>` atau tombol di halaman publik yang mengarah ke `/admin`

### `/admin/login`
- NextAuth Credentials provider, **hanya 1 akun admin**
- Akun admin di-seed lewat script CLI (`prisma/seed.ts` atau script terpisah), BUKAN lewat form signup publik — tidak boleh ada endpoint register sama sekali
- Password di-hash dengan **argon2id** (lebih kuat dari bcrypt untuk kasus ini)
- **2FA TOTP wajib** (otplib) — setelah password benar, minta kode 6 digit dari Google Authenticator/Authy sebelum masuk
- Rate limit percobaan login: maksimal 5x per 15 menit per IP (pakai Upstash Redis kalau tersedia, atau tabel `LoginAttempt` di Postgres sebagai fallback)
- Session cookie: `httpOnly`, `secure`, `sameSite: strict`

### `/admin` — Dashboard
- Ringkasan: total penjualan, jumlah order (per status), produk terlaris (Recharts)

### `/admin/produk`
- CRUD produk: judul, slug (auto-generate, editable), deskripsi, harga, kategori, cover image (upload ke Blob, public OK untuk cover), file produk asli (upload ke Blob **private**), status aktif/nonaktif
- Validasi tipe file upload produk: hanya `.txt`, `.pdf`, `.docx` (cek MIME type di server, jangan percaya ekstensi nama file saja)
- Preview list file yang sudah di-upload per produk (bisa lebih dari 1 file per produk — saat checkout selesai, semua file digabung jadi 1 ZIP on-the-fly untuk didownload)

### `/admin/order`
- List semua transaksi + status + detail pembeli (nama, no HP kalau diisi)
- Tombol "Verifikasi Manual" untuk jaga-jaga kalau webhook Tripay gagal masuk (harus tercatat di audit log: siapa override, order mana, kapan, alasan apa)

### `/admin/log` (Audit Log)
- Catat semua aksi sensitif: login (sukses/gagal), ubah produk, override status order, dengan timestamp + IP address

---

## 5. Integrasi Pembayaran — iPaymu Payment API v2 (QRIS Dinamis)

> Catatan: awalnya rencana pakai Tripay, tapi per Agustus 2026 Tripay menutup pendaftaran partner baru sementara (untuk peningkatan sistem). iPaymu jadi pilihan pengganti dengan kriteria sama: gratis, individu (KTP saja, tanpa PT/CV), tanpa biaya aktivasi/bulanan.

**Setup akun (dilakukan Bayu sendiri, bukan oleh OpenCode):**
1. Bangun & deploy dulu situsnya sampai ada **minimal 5 produk asli aktif** di katalog — iPaymu mensyaratkan situs sudah aktif & terisi produk nyata sebelum verifikasi merchant disetujui (jangan pakai data dummy untuk akalin syarat ini, isi produk beneran meski awalnya sedikit)
2. Daftar gratis di https://my.ipaymu.com/members/signup.htm
3. Lengkapi verifikasi Merchant Personal: e-KTP, swafoto bersama KTP, halaman depan buku rekening (nama harus sama dengan KTP), NPWP kalau ada (opsional tapi menaikkan limit)
4. Setelah disetujui, ambil dari dashboard: `va` (nomor Virtual Account akun) dan `apiKey`
5. Mulai dari mode **Sandbox** (`sandbox.ipaymu.com`) dulu untuk testing, baru pindah ke Production (`my.ipaymu.com`) setelah semua flow teruji

**Skema signature iPaymu (WAJIB persis, ini yang paling sering salah):**
```
requestBody  = lowercase(SHA256(JSON.stringify(body)))   // untuk GET tanpa body, pakai SHA256("{}")
stringToSign = UPPERCASE(httpMethod) + ":" + va + ":" + requestBody + ":" + apiKey
signature    = HMAC-SHA256(stringToSign, apiKey)          // hex digest
timestamp    = format YmdHis, contoh: 20260806185219
```
Header wajib di setiap request: `va`, `signature`, `timestamp`, `Content-Type: application/json`. Sebelum implementasi final, cocokkan ulang urutan/nama parameter ini dengan dokumentasi resmi di https://ipaymu.com/en/api-documentation/ dan Postman collection resminya — dokumentasi API bisa berubah, jangan andalkan hafalan mentah-mentah untuk kode yang menyangkut keamanan pembayaran.

**Alur teknis (implementasi OpenCode):**

1. Customer klik "Beli" → server buat record `Order` (status `PENDING`, id = UUID random) → panggil endpoint Payment Direct iPaymu (mode `qris`) dengan body berisi: nama produk, jumlah (`amount` = harga, integer Rupiah), data buyer (nama/email/no HP kalau diisi), `referenceId` = `order.id`, `notifyUrl` (`/api/webhook/ipaymu`), `returnUrl`, `cancelUrl`
2. Simpan `sessionId`/`trx_id` dari response iPaymu ke `Order`, tampilkan QR image dari response ke customer
3. iPaymu kirim POST notifikasi ke `notifyUrl` saat status transaksi berubah. Endpoint webhook WAJIB:
   - Jangan percaya payload begitu saja — setelah nerima notifikasi, **konfirmasi ulang status transaksi** langsung ke API Cek Status Transaksi iPaymu (server-to-server) memakai `trx_id`, baru update database berdasarkan hasil cek balik ini (pola ini lebih aman daripada cuma percaya payload webhook mentah, apalagi kalau signature verification utk notify endpoint iPaymu kurang terdokumentasi jelas — verifikasi ulang ke server iPaymu menutup celah itu)
   - Cocokkan `amount` hasil cek status dengan `amount` yang tersimpan di DB untuk order tsb — kalau beda, tolak & log sebagai anomali
   - Idempotent: kalau order sudah `PAID` sebelumnya, notifikasi yang datang lagi jangan diproses ulang
   - Update status order sesuai hasil cek status (`PAID` / `EXPIRED` / `FAILED`)
   - Simpan raw payload notifikasi + hasil cek status ke tabel log (untuk audit/debug)
4. Setelah status `PAID`, generate **download token**: random string kriptografis (bukan UUID biasa — pakai `crypto.randomBytes(32)`), simpan di tabel `DownloadToken` dengan relasi ke order, expiry (misal 24 jam), dan flag `used` (opsional: sekali pakai atau limit beberapa kali unduh)
5. Endpoint `/api/download/[token]`: validasi token belum expired & belum di-abuse → generate/stream file dari Vercel Blob (kalau lebih dari 1 file, zip on-the-fly pakai library seperti `archiver` atau `jszip` di server) → response sebagai file download, BUKAN redirect ke URL Blob publik langsung

---

## 6. Keamanan (Prioritas Tinggi — Bayu eksplisit minta ini "seaman mungkin")

- **Tidak ada satupun secret di client-side**: `TRIPAY_PRIVATE_KEY`, `NEXTAUTH_SECRET`, `DATABASE_URL`, dll hanya di environment variable server (Vercel), jangan pernah di-expose lewat `NEXT_PUBLIC_*`
- **IDOR prevention**: semua ID yang muncul di URL publik (order id, download token) HARUS random/UUID, tidak boleh auto-increment integer yang bisa ditebak/di-enumerasi
- **File produk asli**: private di Vercel Blob, tidak pernah punya link publik permanen — hanya bisa diakses lewat endpoint download yang tervalidasi
- **Webhook**: signature verification wajib (lihat bagian 5), plus rate-limit endpoint webhook itu sendiri untuk cegah spam/DoS
- **Admin auth**: password argon2id + 2FA TOTP + rate limit login (lihat bagian 4)
- **Input validation**: semua request body/query divalidasi Zod di server, jangan percaya validasi client-side saja
- **Security headers**: set Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Strict-Transport-Security lewat `next.config.js` headers()
- **HTTPS only**: pastikan semua cookie `secure: true`, redirect http→https di Vercel (default sudah begitu, tapi pastikan tidak ada override)
- **Rate limiting umum**: endpoint create-order dan checkout juga dikasih rate limit per IP, cegah orang spam bikin order palsu buat DoS kuota API Tripay
- **Dependency hygiene**: jalankan `npm audit` sebelum deploy production, pastikan tidak ada known-vulnerability critical di package.json
- **Error handling**: jangan pernah expose stack trace atau detail internal error ke response API yang dilihat client — log detail di server saja, response ke client generic

---

## 7. Guardrail Teknis (bug yang PERNAH kejadian di proyek Bayu lain — WAJIB dihindari dari awal)

- Tailwind v4: JANGAN pakai nama token yang collide dengan utility class bawaan (contoh kasus lama: `--spacing-md` override `max-w-md`) — pakai prefix jelas untuk token custom
- Semua pemakaian `useSearchParams()` WAJIB dibungkus `<Suspense>` boundary, atau build akan gagal berulang di Vercel
- NextAuth v5 di Vercel: set `trustHost: true` di config, kalau tidak akan muncul error PKCE cookie
- JANGAN pakai `backdrop-filter` pada elemen yang jadi ancestor dari elemen `position: fixed` — akan merusak fixed positioning. Kalau butuh efek blur + fixed child, gunakan React Portal
- JANGAN pakai CSS shorthand `inset` — selalu tulis eksplisit `top/right/bottom/left` (shorthand `inset` bikin bug rendering cross-browser di mobile)
- Pakai `100dvh` bukan `100vh` untuk elemen full-height di mobile (menghindari masalah address bar browser mobile)

---

## 8. Skema Database (Prisma) — Draf Awal

```prisma
model AdminUser {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  totpSecret    String
  createdAt     DateTime @default(now())
}

model Product {
  id          String    @id @default(uuid())
  slug        String    @unique
  title       String
  description String
  price       Int       // dalam Rupiah, integer, bukan float
  coverUrl    String
  category    String?
  isActive    Boolean   @default(true)
  files       ProductFile[]
  orders      Order[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model ProductFile {
  id         String   @id @default(uuid())
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  fileName   String
  blobUrl    String   // private blob path
  mimeType   String
  sizeBytes  Int
}

model Order {
  id             String    @id @default(uuid()) // dipakai sbg merchant_ref Tripay
  productId      String
  product        Product   @relation(fields: [productId], references: [id])
  amount         Int
  status         OrderStatus @default(PENDING)
  ipaymuTrxId    String?
  qrisUrl        String?
  customerName   String?
  customerEmail  String?
  customerPhone  String?
  expiredAt      DateTime
  createdAt      DateTime  @default(now())
  downloadTokens DownloadToken[]
}

enum OrderStatus {
  PENDING
  PAID
  EXPIRED
  FAILED
}

model DownloadToken {
  id         String   @id @default(uuid())
  token      String   @unique // crypto.randomBytes(32).toString('hex')
  orderId    String
  order      Order    @relation(fields: [orderId], references: [id])
  expiresAt  DateTime
  usedCount  Int      @default(0)
  maxUses    Int      @default(3)
  createdAt  DateTime @default(now())
}

model WebhookLog {
  id         String   @id @default(uuid())
  provider   String   @default("ipaymu")
  rawPayload Json
  isValid    Boolean
  receivedAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  actor     String   // admin email
  action    String
  detail    String?
  ipAddress String?
  createdAt DateTime @default(now())
}

model LoginAttempt {
  id        String   @id @default(uuid())
  ipAddress String
  success   Boolean
  createdAt DateTime @default(now())
}
```

---

## 9. Environment Variables

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=        # hanya dipakai saat run seed script sekali, lalu hapus dari env
IPAYMU_VA=
IPAYMU_API_KEY=
IPAYMU_MODE=sandbox         # ganti ke "production" setelah siap live (sandbox.ipaymu.com vs my.ipaymu.com)
BLOB_READ_WRITE_TOKEN=
```

---

## 10. Skill yang Harus Dipakai Selama Development

- `systematic-debugging` — setiap kali ada bug, ikuti 4-phase root cause, jangan tempel fix asal jalan
- `next-dev-loop` — untuk siklus dev/build Next.js
- `frontend-design` dan `ui-ux-pro-max` — untuk keputusan visual biar hasil tidak generic
- `test-driven-development` — khusus untuk logic sensitif (signature verification, download token, rate limiter) tulis test dulu sebelum implementasi, karena ini bagian yang paling gawat kalau ada bug keamanan

---

## 11. Definition of Done (Checklist)

- [ ] Katalog publik kosong dari data dummy, admin bisa tambah produk dari nol
- [ ] Checkout QRIS dinamis iPaymu berfungsi end-to-end di sandbox
- [ ] Notifikasi webhook selalu dikonfirmasi ulang ke API Cek Status iPaymu sebelum update DB (bukan percaya payload mentah), teruji termasuk skenario amount tidak cocok → ditolak
- [ ] Download hanya bisa diakses setelah status PAID, via token, bukan URL Blob langsung
- [ ] Admin panel tidak ke-index Google, tidak ada link publik ke sana
- [ ] Login admin pakai 2FA, rate limited
- [ ] Semua secret ada di env var, tidak ada yang ke-commit ke git
- [ ] Mobile-first: dicek tampilannya di lebar 360–430px dulu
- [ ] Tidak ada emoji di UI manapun, semua ikon pakai lucide-react
- [ ] Ikon WhatsApp & Email di footer berfungsi (wa.me & mailto)
- [ ] `npm audit` bersih dari kerentanan critical/high sebelum deploy production
