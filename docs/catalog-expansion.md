# Perluasan katalog personal-v4

Sumber utama: [TKPI Kementerian Kesehatan 2020](https://repository.kemkes.go.id/book/668), ISBN 978-623-301-036-8. Nilai per 100 g bagian termakan; halaman cetak = halaman PDF - 4. Angka dibaca dari tabel sumber, bukan dibuat oleh Gemini. Sel kosong tidak dijadikan nol. Sebagian nilai dalam TKPI berasal dari imputasi.

Versi baru memuat 78 profil: 42 referensi TKPI dan 36 estimasi terdahulu. Tambahan 32 profil berikut tidak mengubah nilai 46 profil versi personal-v3. Catatan tersimpan tetap memakai versi asal; koreksi dan simpan ulang untuk menggunakan versi terbaru. Resep restoran/merek tidak disamakan dengan resep umum TKPI. Foto tidak mengukur minyak, bahan tersembunyi, atau berat sebenarnya.

| Makanan | Kode | Hal. | kkal | Protein g | Karbohidrat g | Lemak g | Serat g |
|---|---|---:|---:|---:|---:|---:|---:|
| Ketoprak | AP060 | 13 | 153 | 7.9 | 13 | 7.7 | 2.9 |
| Klepon | AP058 | 12 | 215 | 3.7 | 41.8 | 3.7 | 1 |
| Lupis ketan | AP079 | 13 | 164 | 1.8 | 34.5 | 2.1 | 0.7 |
| Kue putu cangkir | AP074 | 13 | 304 | 5.3 | 54.9 | 7 | 0.9 |
| Mi bakso | AP086 | 14 | 114 | 5.3 | 16.4 | 3 | 0.1 |
| Nasi gurih | AP090 | 14 | 190 | 4.7 | 26 | 7.5 | 0.7 |
| Nasi minyak | AP091 | 14 | 207 | 3.5 | 37.1 | 5 | 0.8 |
| Moon tahu | CP050 | 27 | 128 | 8 | 1.3 | 10 | 0.2 |
| Tahu telur | CP063 | 28 | 328 | 12.6 | 24.6 | 19.9 | 0.4 |
| Tauco | CP065 | 28 | 184 | 11.4 | 22.2 | 5.5 | 1.9 |
| Susu kedelai | CP060 | 27 | 41 | 3.5 | 5 | 2.5 | 0.2 |
| Jambu air segar | ER030 | 43 | 46 | 0.6 | 11.8 | 0.2 | 2.1 |
| Jambu biji segar | ER031 | 43 | 64 | 0.9 | 12.2 | 0.3 | 2.4 |
| Duku segar | ER022 | 43 | 63 | 1 | 16.1 | 0.2 | 4.3 |
| Daging kelapa muda segar | ER046 | 44 | 68 | 1 | 14 | 0.9 | 0 |
| Kedondong segar | ER044 | 44 | 47 | 0.5 | 10.4 | 0.2 | 2.7 |
| Nanas segar | ER070 | 45 | 40 | 0.6 | 9.9 | 0.3 | 0.6 |
| Ayam goreng Kentucky, dada | FP025 | 51 | 298 | 34.2 | 0.1 | 16.8 | 0 |
| Ayam goreng Kentucky, paha | FP026 | 51 | 286 | 32.1 | 1.1 | 16.1 | 0 |
| Ayam goreng Kalasan, paha | FP024 | 51 | 275 | 37.4 | 1.3 | 12.2 | 0 |
| Ayam goreng Sukabumi, dada | FP032 | 51 | 244 | 36.7 | 1 | 9.2 | 0 |
| Beef teriyaki | FP037 | 51 | 151 | 8.6 | 22.3 | 3.1 | 0.3 |
| Beef yakiniku | FP038 | 51 | 132 | 9.8 | 20.7 | 1.1 | 0.3 |
| Chicken teriyaki | FP041 | 51 | 168 | 13 | 7.5 | 9.6 | 0.8 |
| Rendang sapi | FP062 | 53 | 193 | 22.6 | 7.8 | 7.9 | 0 |
| Soto Betawi | FP076 | 53 | 135 | 2.5 | 11.5 | 8.8 | 0.5 |
| Soto Bandung | FP074 | 53 | 42 | 3.9 | 2.8 | 1.7 | 0.4 |
| Kecap | NP005 | 71 | 71 | 5.7 | 9 | 1.3 | 0 |
| Saus tomat | NP009 | 71 | 110 | 2 | 24.5 | 0.4 | 0.9 |
| Belimbing segar | ER006 | 42 | 36 | 0.4 | 8.8 | 0.4 | 3.2 |
| Rambutan segar | ER097 | 46 | 69 | 0.9 | 18.1 | 0.1 | 0.8 |
| Sawo manila segar | ER104 | 46 | 92 | 0.5 | 22.4 | 1.1 | 9.5 |

## Pencocokan dan penyimpanan

Nama Indonesia, variasi mi/mie dan saus/saos, urutan “daging ayam/sapi”, serta sinonim khusus diperiksa secara deterministik. ID yang diusulkan AI tetap diverifikasi terhadap nama/cara masak. Jika ID tidak cocok, hanya nama unik yang sesuai katalog yang boleh mengisinya. Nama ambigu dan resep yang tidak tersedia tetap ditampilkan sebagai “Data gizi belum tersedia”; tidak dihitung sebagai nol. Jangan menjumlahkan satu masakan campuran beserta seluruh komponennya dua kali.

Runtime membaca katalog dari tabel nutrition_catalogs di Neon; berkas seed hanya untuk memasang versi baru. npm run db:setup menambah personal-v4 secara idempoten dengan ON CONFLICT DO NOTHING, tanpa membaca/mengubah profil atau catatan pengguna. Cache katalog server berlaku 60 detik. Refresh browser setelah pembaruan. Katalog yang lebih luas belum merupakan pengujian akurasi vision dengan foto nyata.
