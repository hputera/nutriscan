# Metode NutriScan Personal

## Sumber

- Rumus Mifflin–St Jeor: Mifflin dkk. 1990, [PubMed 2305711](https://pubmed.ncbi.nlm.nih.gov/2305711/). Mengestimasi energi istirahat, bukan total kebutuhan atau prediksi pasti perubahan BB. Populasi penelitian usia 19–78 tahun.
- [CDC BMI dewasa](https://www.cdc.gov/bmi/adult-calculator/): kategori mulai usia 20 tahun, batas <18,5; 18,5–<25; 25–<30; >=30. BMI angka dihitung tanpa membulatkan sebelum kategorisasi. Usia 18–19 tidak diberi kategori dewasa.
- [NIDDK Body Weight Planner](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner): alat perencanaan untuk dewasa, bukan anak, ibu hamil atau menyusui. NutriScan tidak menyalin model dinamis alat ini. Faktor aktivitas prototype 1,4/1,6/1,8/2,0 dan penyesuaian ±10% hanya asumsi desain yang ditampilkan.
- [DRI / National Academies](https://www.ncbi.nlm.nih.gov/books/NBK221374/): rentang makro dewasa. Pilihan prototype 50% karbohidrat, 20% protein, 30% lemak merupakan satu titik di rentang umum, bukan target klinis per orang.
- [NIDDK tentang serat](https://www.niddk.nih.gov/health-information/digestive-diseases/diverticulosis-diverticulitis/eating-diet-nutrition): merujuk 14 gram serat per 1.000 kkal dari pedoman diet. Ini acuan perhitungan umum, bukan penanganan penyakit pencernaan.
- [TKPI Kemenkes 2020](https://repository.kemkes.go.id/book/668): nilai per 100 g bagian dapat dimakan. Tujuh baris awal didokumentasikan di `data-sources.md`. Tambahan: melon ER067 halaman cetak 45 (37 kkal; protein 0,6; karbohidrat 7,8; lemak 0,4; serat 1 g), semangka ER105 halaman 46 (28; 0,5; 6,9; 0,2; 0,4), jagung kuning muda rebus AP010 halaman 10 (142; 5; 30,3; 0,7; 0,8). Satuan energi kkal, lainnya gram per 100 g bagian termakan.

## Katalog dan keterbatasan

78 profil, 42 referensi TKPI dan 36 estimasi. Versi personal-v4 menambah 32 baris TKPI; rincian kode/angka ada di catalog-expansion.md. Profil perkiraan tambahan disusun sebagai fixture prototype dan belum dinyatakan sebagai nilai TKPI/USDA. Masakan campuran (soto, gado-gado, nasi goreng, dan lainnya) bergantung resep. Perlu ditinjau ahli gizi sebelum pemakaian untuk keputusan diet. Jangan menganggap memperluas katalog otomatis meningkatkan akurasi model vision. Akurasi pengenalan tetap perlu diuji dengan foto nyata; porsi dan bahan tersembunyi perlu dikonfirmasi.

Nama umum pisang/jeruk memakai profil estimasi terpisah; tidak langsung memakai varietas ambon/manis yang punya referensi. Komponen tanpa padanan tetap terlihat, ditandai parsial, dan tidak diberi angka rekaan dari model.

## Rekomendasi

Aturan deterministik memilih template menu dari tabel Neon. Inputnya profil, target, serta total yang sudah tersimpan pada hari terpilih. Prioritas protein jika catatan <70% target protein; lalu serat jika <70% target serat; selain itu sumber energi. Ambang 70% adalah asumsi prioritas prototype, bukan diagnosis kekurangan. Porsi contoh bukan resep klinis.

Preferensi vegan menghapus semua pilihan hewani; vegetarian menghapus daging/ikan/udang. Alergi menyaring tag kandidat. Tidak ada klaim bebas alergen; bumbu/kontaminasi silang tetap harus diperiksa. Pantangan tambahan teks mematikan ide otomatis sampai pengguna meninjaunya. Jika energi tercatat mencapai target, menu tambahan tidak ditawarkan; pengguna dapat meninjau pilihan sebagai pengganti, dan bukan diperintahkan melewatkan makan. Semua menu yang ditampilkan harus <= sisa kalori; pembagian per porsi contoh rendah <400, sedang 400–<650, tinggi >=650 kkal.

## Privasi dan versi

Profil lengkap dan target sekarang disimpan dalam tabel sesi Neon. Laporan makanan tidak menggandakan profil lengkap; foto disimpan di Object Storage privat, sedangkan laporan menyimpan key foto. Snapshot target energi/makro tetap disimpan agar laporan bisa ditafsirkan sesuai waktu pencatatan. Ini bukan login; riwayat sesi tidak tersedia otomatis di browser lain. `personal-v3` dan `personal-v4` tidak berisi data harga. Modul legacy hanya untuk mempertahankan angka lama.
