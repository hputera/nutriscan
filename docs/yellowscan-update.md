# YellowScan: makanan manual dan target kalori

Nama tampilan menjadi YellowScan. Nama tabel Neon, cookie, dan penyimpanan browser tetap agar data lama bisa dibuka. Tidak perlu menjalankan db:setup ulang.

Saat pertama masuk, target kalori dihitung otomatis. Di dashboard, klik Ubah target kalori untuk mengisi bilangan bulat 1.500–4.500 kkal. Aktifkan Gunakan target otomatis untuk kembali ke hitungan profil. Target dan pembagian gizi dihitung lagi saat profil disimpan, lalu disimpan sebagai JSON di Neon. Profil dengan kebutuhan khusus tetap memakai aturan peninjauan yang ada. Target pilihan adalah masukan pengguna, bukan rekomendasi medis aplikasi.

Di Makanan & porsi, pilih Makanan sendiri / di luar katalog, isi nama dan berat bagian termakan. Aktifkan Isi data gizi sendiri lalu isi kelima nilai per 100 gram dari label kemasan atau sumber sendiri. Angka 0 harus dimasukkan jika memang nol; kolom kosong tidak dianggap 0. Data tanpa gizi tetap diberi label belum dihitung. Data manual tersimpan dalam laporan makanan di Neon, bukan mengubah katalog bersama. Total dan ekspor memakai data manual itu, termasuk saat dibuka lagi. Nama, porsi, dan nilai gizi bisa dikoreksi sebelum simpan.

Verifikasi: 53 unit/regression tests, TypeScript, production webpack build, API integration untuk penyimpanan/pemuatan target dan gizi manual di Neon serta foto privat. Sesi uji dibersihkan. Tidak memakai kuota scan Gemini.
