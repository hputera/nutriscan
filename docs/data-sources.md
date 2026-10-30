# Sumber dan asumsi data NutriScan

Versi katalog baru: `tkpi-2020-v2`. Versi awal tetap dibekukan sebagai `demo-v1` agar riwayat tidak berubah hitungannya.

## Gizi

Sumber: Kementerian Kesehatan RI, **Tabel Komposisi Pangan Indonesia, 2020**, ISBN 978-623-301-036-8. [Entri repositori dan tautan PDF](https://repository.kemkes.go.id/book/668). Nilai ditranskripsikan dari tabel, per **100 gram bagian yang dapat dimakan (BDD)**. Halaman di bawah memakai nomor halaman cetak (halaman PDF empat nomor lebih besar).

| Profil | Kode TKPI | Halaman | Energi (kkal) | Protein (g) | Karbohidrat (g) | Lemak (g) | Serat (g) |
|---|---|---:|---:|---:|---:|---:|---:|
| Nasi | AP001 | 10 | 180 | 3 | 39,8 | 0,3 | 0,2 |
| Tahu goreng | CP062 | 28 | 115 | 9,7 | 2,5 | 8,5 | 0,1 |
| Tempe kedelai murni, goreng | CP076 | 28 | 350 | 24,5 | 10,4 | 26,6 | 4,2 |
| Telur ayam, dadar, masakan | HP001 | 65 | 251 | 16,3 | 1,4 | 19,4 | 0 |
| Pepaya, segar | ER073 | 45 | 46 | 0,5 | 12,2 | 0,1 | 1,6 |
| Pisang ambon, segar | ER074 | 45 | 108 | 1 | 24,3 | 0,8 | 1,9 |
| Jeruk manis, segar | ER039 | 43 | 45 | 0,9 | 11,2 | 0,2 | 1,4 |

Sebelas profil lainnya tetap **estimasi prototype**, dengan status sumber per profil. Angka referensi bukan pengukuran makanan pada foto dan belum ditinjau ahli gizi. Resep, minyak, varietas, serta cara masak dapat berbeda. Profil nasi adalah nasi matang, bukan beras; buah memakai berat tanpa bagian yang tidak dimakan. Jangan mengalikan BDD lagi jika berat porsinya sudah bagian termakan.

Kecocokan hasil Gemini memerlukan nama makanan/cara masak/varietas yang sesuai. Contoh: sayur terong tidak dipetakan ke sayuran campur; tahu tanpa cara masak tidak otomatis dianggap tahu goreng; pisang tanpa varietas tidak otomatis dianggap ambon. Komponen yang tidak cocok tetap terlihat, ditandai perlu dicek dan dikeluarkan dari total sehingga hasil bersifat parsial. Koreksi manual tetap tersedia.

## Harga dan resep biaya

Sesuai pilihan pengguna, harga tetap **contoh**, bukan survei pasar atau harga supplier. Skenario: Jakarta Selatan, 29 Oktober 2026. Daftar terpusat di `lib/ingredient-prices.ts`; seluruh harga dalam **rupiah per kilogram**, termasuk minyak dan susu (bukan per liter). Tanggal itu menamai skenario, bukan tanggal pengambilan data pasar.

Kebutuhan bahan mentah adalah asumsi resep per 100 g makanan matang/termakan. Biaya bahan = gram bahan / 1.000 x harga/kg x gram porsi / 100. Resep biaya dan susut masih ilustratif; tidak dipakai untuk menurunkan nilai gizi TKPI. Angka ayam memakai asumsi pembelian bagian termakan, bukan kutipan harga ayam utuh. Kebutuhan telur atau buah yang menyertakan cangkang/kulit adalah asumsi belanja, bukan berat untuk perhitungan gizi. Contoh beras 40 g pada Rp15.000/kg menghasilkan biaya Rp600 per 100 g nasi, atau Rp900 per porsi 150 g.

Total tidak mencakup upah, energi masak, kemasan, distribusi, maupun margin. Target bawaan dan skor tetap demo, bukan standar resmi BGN.

## Riwayat dan ekspor

Hasil baru membawa `catalogVersion` di browser, payload Neon, dan ekspor. Riwayat tanpa versi dibaca sebagai `demo-v1`; datanya tidak ditulis ulang. Membuka atau mengekspor riwayat memakai katalog yang sama dengan saat disimpan. Jika pengguna mengoreksi makanan/porsi dari riwayat lama, hasil koreksi memakai katalog terbaru dan aplikasi menampilkan pemberitahuan. Pengaturan target/anggaran saja tidak mengganti katalog gizi. Tidak diperlukan perubahan tabel Neon.

Ekspor menyertakan sumber per makanan. Untuk penerapan lapangan, ganti asumsi belanja dengan data supplier serta lakukan peninjauan resep, porsi, target, dan padanan pangan bersama ahli gizi.
