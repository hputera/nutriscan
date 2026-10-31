# YellowScan Cloud

Next.js/React untuk analisis nutrisi makanan, BMI, catatan harian dan pilihan menu. Data operasional sekarang memakai Neon: profil, target, katalog versi, template menu, dan riwayat. Foto memakai Neon Object Storage privat. File project berisi kode, migrasi dan seed; runtime tidak memakai katalog hardcoded sebagai fallback.

## Jalankan

Node 22.16+. Untuk instalasi baru `npm ci`. Isi `.env.local` menggunakan `.env.example`, jalankan `npm run db:setup`, lalu `npm run dev`. Alamat lokal `http://127.0.0.1:3100`. Jangan commit `.env.local`.

Untuk pembaruan project lama: pertahankan `.env.local`, pasang dependency baru dengan `npm install --ignore-scripts`, lalu mulai ulang server. Migrasi memakai CREATE/ALTER IF NOT EXISTS dan INSERT ON CONFLICT DO NOTHING agar laporan dan katalog yang sudah ada tidak ditimpa. `db:setup` juga memasukkan 78 profil makanan terkini, tiga snapshot katalog lama, dan 9 template menu.

## Sesi perangkat dan keluar profil

Belum ada akun/email/password. Sesi terikat cookie perangkat HttpOnly dengan token acak yang hash-nya disimpan di Neon. Keluar menghapus cookie akses aktif, tanpa menghapus profil atau riwayat. Tombol Masuk kembali memulihkan profil dari browser yang sama menggunakan cookie perangkat. Ini cocok untuk perangkat pribadi; bukan autentikasi multiuser pada komputer bersama. Menghapus cookie perangkat dapat menghilangkan akses ke sesi anonim; belum ada pemulihan lintas perangkat.

## Migrasi browser lama

Setelah refresh, aplikasi mengikat ID sesi browser lama yang belum diklaim, memindahkan profil serta laporan ke Neon, dan menghapus salinan data lokal hanya setelah konfirmasi penyimpanan berhasil. Perpindahan memakai ID yang sama sehingga tidak menggandakan laporan. Riwayat yang sudah dihapus diblokir oleh tombstone dan batas waktu Hapus semua agar cache lama tidak menghidupkannya kembali. Jika ada foto yang belum berhasil diunggah, hanya salinan foto sementara yang dipertahankan di browser; pesan menandainya. Kegagalan database tidak ditampilkan sebagai penyimpanan cloud berhasil.

## Foto online

Gunakan bucket `nutriscan-meals` dengan akses **Private**. Isi server-only:

- `AWS_ENDPOINT_URL_S3`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `PHOTO_BUCKET=nutriscan-meals`

Nilai berasal dari Neon Object Storage, bukan password Postgres. Jalankan `npm run storage:check` untuk menguji upload, baca, dan hapus file uji. Foto pengguna diperkecil/re-encode di browser dan diunggah saat catatan disimpan. Batas penyimpanan foto aplikasi 384 KB per foto. Foto dibaca melalui endpoint yang memeriksa pemilik sesi, dengan cache private/no-store. Hapus catatan mengantrekan penghapusan file; jika Storage sedang gagal, file tidak lagi bisa diakses dari riwayat dan antrean dicoba ulang saat membuka riwayat. Baca [docs/storage-neon.md](docs/storage-neon.md).

## Rekomendasi menu

Template menu dan katalog dibaca dari Neon. Pilihan disaring berdasarkan alergi/preferensi dan sisa kalori harian dari makanan tersimpan pada tanggal terpilih (WIB). Rendah <400 kkal, sedang 400–<650, tinggi >=650 per porsi contoh. Ini kategori prototype, bukan standar klinis. Setiap pilihan secara individual harus muat dalam sisa perkiraan; pengguna memilih satu alternatif, bukan menambahkan semuanya. Tidak ada pengecualian minimum 150 kkal yang bisa melampaui sisa. Komponen harian tanpa data gizi menahan rekomendasi sampai dikoreksi. Saat target tercapai, menu tambahan tidak ditawarkan dan aplikasi tidak memerintahkan melewatkan makan.

Perhitungan usia tetap mengikuti rentang yang didukung; hanya tulisan 18+ di halaman awal yang dihapus. Detail BMI/energi ada di [docs/personal-nutrition.md](docs/personal-nutrition.md). Data pangan memuat 42 profil TKPI dan 36 profil estimasi; resep aktual, porsi dan bahan tersembunyi tetap perlu diperiksa.

## Hapus riwayat

Bisa satu atau semua, dengan konfirmasi UI. Penghapusan hanya untuk sesi aktif, mempertahankan profil, dan memperbarui total harian. Revisi laporan mencegah koreksi lama menimpa perubahan terbaru. Transaksi dan kunci per sesi melindungi simpan/hapus/migrasi dari balapan request.

## Verifikasi

- `npm test`: tes gizi, BMI/energi, menu, validasi foto dan konfirmasi hapus.
- `npm run typecheck` dan `npm run build`.
- `npm run test:db`: query persis endpoint diuji dalam transaksi rollback dengan data sintetis.
- `node --env-file=.env.local scripts/test-api.mjs`: sesudah build, uji API lengkap dengan sesi dan foto sintetis, lalu cleanup fixture.
- Live Gemini tidak dipanggil saat pengujian fitur cloud; jalur scan yang sudah ada tetap tersedia setelah sesi aktif.

## GitHub/hosting

Commit source dan package-lock.json. Jangan commit node_modules, .next, .env.local, backup atau credential. Host harus menjalankan server Next.js. Atur PROTOTYPE_ACCESS_CODE jika dipublikasikan dengan kredensial live. Ini belum login produksi atau layanan rekomendasi diet klinis.

Panduan deployment manual: [docs/deploy-vercel.md](docs/deploy-vercel.md).
