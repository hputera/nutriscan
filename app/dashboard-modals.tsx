"use client";
import { useState } from "react";
import {
  ArrowRight,
  Camera,
  Download,
  History,
  LoaderCircle,
  RotateCcw,
  Upload,
  Trash2,
} from "lucide-react";
import {
  CATALOG_METADATA,
  CURRENT_CATALOG_VERSION,
  matchFoodId,
} from "@/lib/catalog";
import { foodFor, number, summarize, versionForRecord } from "@/lib/nutrition";
import { MEALS, planFor } from "@/lib/personal";
import { EditForm, Modal, ProfileForm, METRICS } from "./components";
import { displayDate, useDashboard } from "./use-dashboard";
function AccessForm({
  code,
  onSave,
}: {
  code: string;
  onSave: (code: string) => void;
}) {
  const [value, setValue] = useState(code);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value);
      }}
    >
      <label>
        Kode akses pemilik
        <input
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
      <div className="modal-actions">
        <button className="button primary" type="submit">
          Simpan kode
        </button>
      </div>
    </form>
  );
}
function CalorieForm({d}:{d:ReturnType<typeof useDashboard>}) {
  const [automatic,setAutomatic]=useState(d.profile?.calorieTarget===undefined);
  const suggested=d.profile?planFor({...d.profile,calorieTarget:undefined}).targets?.calories:undefined;
  const [value,setValue]=useState(String(d.profile?.calorieTarget??suggested??""));
  const [error,setError]=useState("");
  return <form onSubmit={e=>{
    e.preventDefault();if(!d.profile||d.profileSaving)return;
    const target=Number(value);
    if(!automatic&&(!Number.isInteger(target)||target<1500||target>4500)){setError("Isi target 1.500–4.500 kkal.");return;}
    void d.saveProfile({...d.profile,calorieTarget:automatic?undefined:target});
  }}>
    <label>Target kalori harian (kkal)<input autoFocus required={!automatic} type="number" min={1500} max={4500} step={1} disabled={d.profileSaving} value={value} onChange={e=>{setValue(e.target.value);setAutomatic(false);setError("");}}/></label>
    <p className="form-note">Ketik angka untuk memakai target sendiri, lalu klik Simpan target.</p>
    <label className="check-label"><input type="checkbox" disabled={d.profileSaving} checked={automatic} onChange={e=>{setAutomatic(e.target.checked);if(e.target.checked)setValue(String(suggested??""));setError("");}}/>Gunakan target otomatis</label>
    <p className="form-note">{suggested?`Hitungan otomatis dari profilmu: ${number(suggested)} kkal/hari.`:"Hitungan otomatis belum tersedia untuk profil ini."}</p>

    <p className="form-note">Perubahan memperbarui target harian, sisa kalori, dan pilihan menu. Catatan makanan lama tetap tersimpan.</p>
    {(error||d.error)&&<p className="inline-error" role="alert">{error||d.error}</p>}
    <div className="modal-actions"><button type="button" className="button secondary" disabled={d.profileSaving} onClick={()=>d.setModal(null)}>Batal</button><button type="submit" className="button primary" disabled={d.profileSaving}>{d.profileSaving?"Menyimpan…":"Simpan target"}</button></div>
  </form>;
}
export default function DashboardModals({
  d,
}: {
  d: ReturnType<typeof useDashboard>;
}) {
  const close = () => d.setModal(null);
  if (d.deleteTarget)
    return (
      <Modal
        title={
          d.deleteTarget === "all"
            ? "Hapus semua riwayat?"
            : "Hapus catatan ini?"
        }
        subtitle="Catatan di Neon dan foto terkait akan dihapus. Profilmu tetap tersimpan."
        onClose={() => {
          if (!d.deleting) d.setDeleteTarget(null);
        }}
      >
        <p className="form-note">
          Tindakan ini tidak bisa dibatalkan dari aplikasi. Ringkasan harian dan
          sisa kalori diperbarui setelah penghapusan berhasil.
        </p>
        {d.error && <p className="inline-error">{d.error}</p>}
        <div className="modal-actions">
          <button
            className="button secondary"
            disabled={d.deleting}
            onClick={() => d.setDeleteTarget(null)}
          >
            Batal
          </button>
          <button
            className="button danger"
            disabled={d.deleting}
            onClick={d.deleteHistory}
          >
            <Trash2 size={16} />
            {d.deleting ? "Menghapus…" : "Ya, hapus"}
          </button>
        </div>
      </Modal>
    );

  if (d.modal === "calories" && d.profile)
    return <Modal title="Target kalori harian" subtitle="Atur targetmu dari dashboard." onClose={()=>{if(!d.profileSaving)close();}}><CalorieForm d={d}/></Modal>;
  if (d.modal === "profile")
    return (
      <Modal title="Profil & tujuan" onClose={close} wide>
        <ProfileForm
          initial={d.profile ?? undefined}
          saving={d.profileSaving}
          onSave={d.saveProfile}
          onClose={close}
        />
      </Modal>
    );
  if (d.modal === "access")
    return (
      <Modal
        title="Pengaturan akses"
        subtitle="Isi jika pemilik mengaktifkan kode akses untuk scan dan penyimpanan."
        onClose={close}
      >
        <AccessForm code={d.code} onSave={d.saveCode} />
      </Modal>
    );
  if (d.modal === "edit")
    return (
      <Modal
        title="Makanan & porsi"
        subtitle="Pilih jenis dan cara masak yang sesuai dengan makananmu."
        onClose={close}
        wide
      >
        <EditForm
          items={
            d.activeCatalogVersion !== CURRENT_CATALOG_VERSION
              ? d.analysis.items.map((i) => ({
                  ...i,
                  foodId: matchFoodId(i.foodId, i.label),
                }))
              : d.analysis.items
          }
          onClose={close}
          onSave={(items) => {
            d.setAnalysis({
              ...d.analysis,
              items,
              source: "manual",
              summary: "Komponen dan porsi telah diperiksa pengguna.",
            });
            d.setActiveCatalogVersion(CURRENT_CATALOG_VERSION);
            d.markChanged();
            close();
          }}
        />
      </Modal>
    );
  if (d.modal === "history")
    return (
      <Modal
        title="Riwayat makanan"
        subtitle="Catatan tersimpan di Neon untuk sesi perangkat ini, maksimal 200 hasil terbaru."
        onClose={close}
        wide
      >
        <div className="history-toolbar">
          <span>{d.records.length} catatan</span>
          <button
            className="text-button delete"
            disabled={!d.records.length || d.deleting || d.saving}
            onClick={() => d.setDeleteTarget("all")}
          >
            <Trash2 size={14} />
            Hapus semua
          </button>
          <button
            className="text-button"
            disabled={!d.status.database || d.cloudLoading}
            onClick={d.syncHistory}
          >
            {d.cloudLoading ? (
              <LoaderCircle size={15} className="spin" />
            ) : (
              <RotateCcw size={15} />
            )}
            Muat dari Neon
          </button>
        </div>
        {!d.records.length ? (
          <div className="history-empty">
            <History size={36} />
            <h3>Belum ada catatan</h3>
            <p>Simpan makanan pertama untuk mulai melihat riwayat.</p>
          </div>
        ) : (
          <div className="history-list">
            {d.records.map((r) => {
              const t = summarize(r.analysis.items, versionForRecord(r));
              return (
                <article className="history-record" key={r.id}>
                  {r.image && (
                    <img src={r.image} alt="Foto makanan tersimpan" />
                  )}
                  <div>
                    <strong>
                      {r.meal ? MEALS[r.meal.mealType] : "Catatan lama"}
                    </strong>
                    <span>{displayDate(r.meal?.eatenAt ?? r.createdAt)}</span>
                    <small>
                      {number(t.nutrients.calories)} kkal ·{" "}
                      {number(t.nutrients.protein)} g protein
                      {t.unmatched > 0 ? " · parsial" : ""}
                    </small>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="Ekspor catatan"
                    onClick={() => d.exportRecord(r)}
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="icon-button delete"
                    disabled={d.deleting || d.saving}
                    aria-label="Hapus catatan makanan"
                    onClick={() => d.setDeleteTarget(r.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    className="button secondary small"
                    disabled={d.saving || d.preparingPhoto}
                    onClick={() => d.openRecord(r)}
                  >
                    Buka
                    <ArrowRight size={13} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
        <p className="form-note">
          Catatan lama tanpa waktu makan belum dihitung ke ringkasan harian.
          Profil dan catatan disimpan di Neon. Foto online memakai Object
          Storage privat; foto yang belum dipindahkan masih memiliki salinan
          sementara di browser.
        </p>
      </Modal>
    );
  if (d.modal === "method")
    return (
      <Modal
        title="Cara YellowScan menghitung"
        subtitle="Angka transparan, keputusan tetap di tanganmu."
        onClose={close}
        wide
      >
        <div className="method-content">
          <h3>Foto & katalog</h3>
          <p>
            Gemini mengusulkan jenis dan perkiraan berat makanan.{" "}
            {CATALOG_METADATA.totalFoods} profil tersedia,{" "}
            {CATALOG_METADATA.referenceCount} di antaranya merujuk TKPI 2020.
            Profil lain diberi label estimasi. Foto tidak mengukur berat,
            minyak, atau bahan tersembunyi.
          </p>
          <div className="recipe-list">
            {d.analysis.items.map((i, index) => {
              const f = foodFor(i.foodId, d.activeCatalogVersion);
              return (
                <details key={index}>
                  <summary>
                    {i.label} · {number(i.grams)} g
                  </summary>
                  <p>
                    {i.customNutrients ? "Gizi isian manual pengguna" : f?.nutritionReference?.title ?? "Belum ada profil gizi"}
                    {f?.nutritionReference?.code
                      ? ` · ${f.nutritionReference.code} · halaman ${f.nutritionReference.page}`
                      : ""}
                    .{" "}
                    {f?.nutritionReference?.note
                      .replaceAll("padanan referensi", "data referensi")
                      .replaceAll("padanan resep", "referensi resep")}
                  </p>
                  {(f || i.customNutrients) && (
                    <div className="source-metrics">
                      {METRICS.map((m) => (
                        <span key={m.key}>
                          {m.label}: {number((f?.per100g ?? i.customNutrients!)[m.key])} {m.unit}/100 g
                        </span>
                      ))}
                    </div>
                  )}
                  {f?.nutritionReference?.url && (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={f.nutritionReference.url}
                    >
                      Lihat sumber data gizi
                    </a>
                  )}
                </details>
              );
            })}
          </div>
          <h3>BMI</h3>
          <p>
            BB (kg) ÷ tinggi (meter)². Kategori mengikuti batas dewasa CDC mulai
            usia 20 tahun; usia 17–19 hanya ditampilkan angkanya. BMI adalah
            alat skrining, bukan ukuran tunggal kesehatan atau dasar otomatis
            tujuan berat badan.
          </p>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.cdc.gov/bmi/adult-calculator/"
          >
            Sumber kategori BMI
          </a>
          <h3>Perkiraan energi & target</h3>
          <p>
            Usia 17–18 memakai EER DRI 2023 untuk remaja, berdasarkan usia,
            jenis kelamin, tinggi (cm), berat (kg), kategori aktivitas, dan
            tambahan pertumbuhan 20 kkal/hari. Target tidak dikurangi atau
            ditambah otomatis untuk tujuan berat badan.
          </p>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html"
          >
            Rumus energi remaja DRI 2023
          </a>
          <p>
            Usia 19–78 memakai Mifflin–St Jeor: 10 × BB + 6,25 × TB − 5 × usia,
            ditambah 5 untuk laki-laki atau dikurangi 161 untuk perempuan. Rumus
            diteliti pada usia 19–78 tahun. Faktor aktivitas prototype: 1,4 /
            1,6 / 1,8 / 2,0. Faktor dan penyesuaian tujuan ±10% adalah asumsi
            awal, bukan bagian validasi rumus dan bukan janji perubahan BB.
          </p>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://pubmed.ncbi.nlm.nih.gov/2305711/"
          >
            Studi Mifflin–St Jeor
          </a>
          <p>
            Alokasi contoh: karbohidrat 50%, protein 20%, lemak 30% energi
            (4/4/9 kkal per gram), serat 14 g per 1.000 kkal. Ini satu pembagian
            contoh untuk prototype, bukan target klinis. Target energi di luar
            1.500–4.500 kkal, diet khusus, dan kehamilan/menyusui perlu
            peninjauan terpisah.
          </p>
          <a
            target="_blank"
            rel="noreferrer"
            href="https://www.ncbi.nlm.nih.gov/books/NBK221374/"
          >
            Rentang distribusi makronutrien
          </a>
          <h3>Catatan & rekomendasi</h3>
          <p>
            Ringkasan hanya menjumlahkan catatan yang sudah disimpan pada
            tanggal terpilih (WIB). Makanan yang belum cocok tidak dihitung. Ide
            menu memakai sisa perkiraan energi, protein/serat yang tercatat,
            tujuan, dan filter preferensi/alergi; bukan diagnosis kekurangan.
            Tetap periksa bahan, bumbu, serta kontaminasi silang bersama
            penyedia makanan.
          </p>
          <p>
            Riwayat lama tetap memakai versi katalog awal. Profil tubuh, target,
            katalog, dan riwayat disimpan di Neon. Foto disimpan privat di
            Object Storage; data sesi tetap terikat perangkat tanpa akun lintas
            perangkat. Catatan tersimpan dibatasi 200 untuk prototype.
          </p>
        </div>
      </Modal>
    );
  if (d.modal === "camera")
    return (
      <Modal
        title="Ambil foto makanan"
        subtitle="Pastikan semua komponen terlihat jelas."
        onClose={close}
        wide
      >
        <div className="camera-preview">
          <video
            ref={d.videoRef}
            autoPlay
            playsInline
            muted
            onLoadedData={() => d.setCameraReady(true)}
          />
          {!d.cameraReady && !d.cameraError && (
            <div className="camera-wait">
              <LoaderCircle size={26} className="spin" />
              Menyiapkan kamera…
            </div>
          )}
        </div>
        {d.cameraError && <p className="inline-error">{d.cameraError}</p>}
        <div className="modal-actions">
          <button
            className="button secondary"
            onClick={() => {
              close();
              d.captureRef.current?.click();
            }}
          >
            <Upload size={16} />
            Pilih foto
          </button>
          <button
            className="button primary"
            disabled={!d.cameraReady}
            onClick={d.capturePhoto}
          >
            <Camera size={16} />
            Ambil foto
          </button>
        </div>
      </Modal>
    );
  return null;
}
