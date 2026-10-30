# Neon Object Storage untuk foto

1. Buka project dan branch yang sama dengan DATABASE_URL di Neon Console.
2. Object storage -> Create bucket -> `nutriscan-meals` -> **Private**.
3. Klik Connect di halaman Object storage. Ambil endpoint, region, Access Key ID dan Secret Access Key. Jika harus membuat credential, pilih scope storage:read/storage:write untuk branch ini; jangan gunakan key publik atau password Postgres.
4. Isi AWS_ENDPOINT_URL_S3, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY di `.env.local`, serta PHOTO_BUCKET=nutriscan-meals. Jangan kirim secret lewat chat atau commit ke GitHub.
5. Jalankan `npm run storage:check`. Skrip membuat satu file uji, membaca, lalu menghapus hanya file uji itu.
6. Mulai ulang server. Foto baru diunggah setelah Simpan ke catatan. Foto browser lama dipindahkan saat sesi aktif dimuat kembali.

Dokumentasi resmi: [Quickstart](https://neon.com/docs/storage/get-started), [bucket privat](https://neon.com/docs/storage/buckets), [credential](https://neon.com/docs/storage/authentication), [harga](https://neon.com/pricing). Saat diperiksa 30 Oktober 2026, paket Free mencantumkan 5 GB Object Storage per project. Batas dan harga dapat berubah; lihat akun sendiri sebelum memilih paket berbayar. Integrasi ini tidak mengubah paket atau billing.

Cookie perangkat adalah kunci akses sesi anonim. Keluar memutus akses aktif tetapi menyimpan cookie perangkat untuk Masuk kembali. Foto tidak dibagikan dengan URL publik: endpoint aplikasi memeriksa sesi dan kepemilikan laporan. Secret S3 hanya digunakan server.
