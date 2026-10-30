# Deployment NutriScan: Vercel + Neon

Vercel menjalankan Next.js dan API. Neon menyimpan Postgres dan Object Storage privat. Pakai proyek Neon yang sudah digunakan, bukan database kosong.

## Persiapan

- Node 22.x. Jalankan npm test, npm run typecheck, npm run build. Hentikan dev server sebelum build pada folder yang sama.
- Commit package-lock.json. Jangan commit .env.local, node_modules, .next atau .nutriscan-backups.
- Database saat ini sudah punya katalog personal-v4 (78 makanan). Untuk branch/database baru, isi konfigurasi lokal lalu jalankan npm run db:setup sekali. Jangan memasukkan db:setup ke Build Command Vercel.

## Import repo

1. Vercel > Add New > Project > import repository GitHub NutriScan.
2. Root Directory: folder yang berisi package.json. Pilih nutriscan hanya jika kode ada di subfolder itu.
3. Framework: Next.js; Install Command: npm ci; Build Command: npm run build; Output Directory: default Next.js (.next).
4. Node.js: 22.x. Gunakan Fluid compute. Route scan/simpan/migrasi memiliki batas 90 detik. Jika Neon berada di Singapore, pilih Functions region Singapore (sin1) bila tersedia.

## Environment Variables

Isi di Vercel Settings > Environment Variables, bukan source GitHub. Pilih Production untuk deployment utama. Preview sebaiknya memakai branch/database uji terpisah.

| Key | Nilai |
|---|---|
| DATABASE_URL | Seluruh connection string Neon untuk branch/database yang sudah di-setup, termasuk sslmode=require. Pooled URL dari Connect boleh digunakan. |
| GEMINI_API_KEY | API key Gemini yang digunakan lokal. |
| GEMINI_MODEL | ID model Gemini yang tersedia untuk key itu; boleh kosong untuk default aplikasi. Bukan nama model ChatGPT. |
| PROTOTYPE_ACCESS_CODE | Kode rahasia yang kamu buat sendiri; wajib untuk API dari domain publik. Masukkan kode sama lewat tombol Kode akses di aplikasi. |
| AWS_ENDPOINT_URL_S3 | Endpoint HTTPS Object Storage Neon, bukan endpoint Postgres. |
| AWS_REGION | Signing region dari Connect Storage Neon, bukan perkiraan dari region Vercel. |
| AWS_ACCESS_KEY_ID | Access key Storage Neon. |
| AWS_SECRET_ACCESS_KEY | Secret key Storage Neon. |
| PHOTO_BUCKET | nutriscan-meals, atau nama bucket privat yang benar-benar dibuat. |

Simpan connection string, API key, kode akses dan credential Storage sebagai Secret. Jangan memberi awalan NEXT_PUBLIC_ pada rahasia. AWS_* di atas diizinkan Vercel saat ini, tetapi tetap isi nilainya dari Neon; nilai AWS bawaan runtime bukan credential Neon. Perubahan env baru berlaku setelah deployment berikutnya: lakukan Redeploy.

## Sesudah deploy

1. Buka URL HTTPS dan isi Kode akses. 401: periksa kode. 403 Akses live belum diaktifkan: PROTOTYPE_ACCESS_CODE belum terpasang di deployment tersebut.
2. Buat profil uji, simpan satu makanan manual, refresh dan buka Riwayat. Total harian dan sisa kalori harus sesuai catatan pada tanggal yang dipilih (WIB).
3. Upload, scan, konfirmasi porsi, simpan, lalu buka ulang foto dari Riwayat. Ini menguji Storage, bukan hanya preview lokal. Kamera membutuhkan HTTPS dan izin browser.
4. Uji Keluar/Masuk kembali di browser yang sama, lalu hapus hanya catatan uji. Pastikan ringkasan ikut berubah.
5. Jika gagal, lihat Functions/Runtime Logs Vercel. /api/status hanya menunjukkan konfigurasi terisi, bukan tes koneksi/kuota.

## Troubleshooting

- 503 Katalog belum siap: DATABASE_URL harus menunjuk branch yang sudah menjalankan db:setup dan berisi personal-v4.
- Foto gagal dibuka: cek empat env Storage, signing region dan nama bucket. Bucket tetap Private.
- Scan 429: kuota Gemini atau batas request. Deploy/key baru dalam proyek Google yang sama tidak otomatis menambah kuota.
- Model 404: GEMINI_MODEL harus tersedia untuk API key tersebut.
- 413: API scan membatasi file 3 MiB; migrasi maksimal lima catatan per batch agar di bawah batas payload Vercel 4.5 MB.
- Simpan berhasil tetapi riwayat belum termuat: gunakan Muat dari Neon, jangan membuat ulang makanan yang sama.

## Batas yang masih ada

Sesi masih anonim berbasis cookie, belum akun/email/password. Cookie localhost tidak berlaku di domain Vercel, jadi profil/riwayat di Neon tidak otomatis bisa dipulihkan dari domain/perangkat baru. Data database tidak terhapus; perlu akun atau transfer sesi terverifikasi untuk kesinambungan lintas domain. Keluar juga bukan login privat untuk komputer bersama: browser yang sama bisa memulihkan profil.

UI memuat 200 laporan terbaru. Ringkasan tanggal di luar jangkauan itu belum mewakili seluruh riwayat walaupun datanya tetap di Neon. Untuk jangka panjang perlu pagination/ringkasan server. Rate limit/cache Gemini masih per instance, belum pembatas biaya global lintas instance; publik luas perlu rate limit terpusat dan autentikasi akun. Hasil foto tetap perkiraan. Target di luar cakupan rumus tetap ditahan; jangan mengubah usia asli untuk mengaktifkannya.

## Rujukan resmi, 30 Oktober 2026

- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/environment-variables/reserved-environment-variables
- https://neon.com/docs/guides/vercel-manual
