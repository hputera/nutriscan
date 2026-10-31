"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { FOODS } from "@/lib/catalog";
import { foodFor } from "@/lib/nutrition";
import { analysisSchema, profileSchema } from "@/lib/validation";
import { ACTIVITIES, ALLERGIES, GOALS } from "@/lib/personal";
import type { FoodItem, Nutrients, UserProfile } from "@/lib/types";
export const METRICS: { key: keyof Nutrients; label: string; unit: string }[] =
  [
    { key: "calories", label: "Kalori", unit: "kkal" },
    { key: "protein", label: "Protein", unit: "g" },
    { key: "carbs", label: "Karbohidrat", unit: "g" },
    { key: "fat", label: "Lemak", unit: "g" },
    { key: "fiber", label: "Serat", unit: "g" },
  ];
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "modal-wide" : "")}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Tutup dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ProfileForm({
  initial,
  onSave,
  onClose,
  saving = false,
}: {
  saving?: boolean;
  initial?: UserProfile;
  onSave: (p: UserProfile) => void;
  onClose?: () => void;
}) {
  const [step, setStep] = useState(initial ? 2 : 1);
  const [draft, setDraft] = useState<Partial<UserProfile>>(
    initial ?? {
      name: "",
      activity: "low",
      goal: "maintain",
      preference: "all",
      allergies: [],
      restrictions: "",
      specialCare: false,
    },
  );
  const [error, setError] = useState("");
  return (
    <form
      className="profile-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 1) {
          if (!draft.name?.trim()) return;
          setStep(2);
          return;
        }
        const r = profileSchema.safeParse(draft);
        if (!r.success) {
          setError(
            "Periksa profil: usia 17–100 tahun, TB 100–230 cm, BB 30–300 kg, jenis kelamin, dan target kalori opsional 1.500–4.500 kkal.",
          );
          return;
        }
        onSave(initial ? r.data : {...r.data,calorieTarget:undefined});
      }}
    >
      <div className="step-bar">
        <span className={step === 1 ? "active" : ""}>01 · Kenalan dulu</span>
        <span className={step === 2 ? "active" : ""}>02 · Profil & tujuan</span>
      </div>
      {step === 1 ? (
        <div className="name-step">
          <span className="eyebrow">SELAMAT DATANG DI YELLOWSCAN</span>
          <h2>
            Nutrisi yang lebih dekat
            <br />
            dengan kebutuhanmu.
          </h2>
          <p>
            Mulai dari makanan sehari-hari, pahami nutrisinya, lalu temukan
            pilihan yang sesuai.
          </p>
          <label>
            Nama panggilan
            <input
              autoFocus
              autoComplete="given-name"
              required
              maxLength={60}
              placeholder="Mau dipanggil siapa?"
              value={draft.name ?? ""}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <button className="button primary" type="submit">
            Lanjutkan
            <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <>
          <div className="form-grid">
            <label>
              Usia (tahun)
              <input
                autoFocus
                required
                type="number"
                min={17}
                max={100}
                step={1}
                value={draft.age ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    age: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </label>
            <label>
              Jenis kelamin
              <select
                required
                value={draft.sex ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    sex: e.target.value as UserProfile["sex"],
                  })
                }
              >
                <option value="" disabled>
                  Pilih
                </option>
                <option value="female">Perempuan</option>
                <option value="male">Laki-laki</option>
              </select>
            </label>
            <label>
              Tinggi badan (cm)
              <input
                required
                type="number"
                min={100}
                max={230}
                step="0.1"
                value={draft.heightCm ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    heightCm: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </label>
            <label>
              Berat badan (kg)
              <input
                required
                type="number"
                min={30}
                max={300}
                step="0.1"
                value={draft.weightKg ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    weightKg: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </label>
            <label>
              Aktivitas sehari-hari
              <select
                value={draft.activity}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    activity: e.target.value as UserProfile["activity"],
                  })
                }
              >
                {Object.entries(ACTIVITIES).map(([key, a]) => (
                  <option key={key} value={key}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tujuanmu
              <select
                disabled={draft.age !== undefined && draft.age < 19}
                value={
                  draft.age !== undefined && draft.age < 19
                    ? "maintain"
                    : draft.goal
                }
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    goal: e.target.value as UserProfile["goal"],
                  })
                }
              >
                {Object.entries(GOALS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Pola makan
              <select
                value={draft.preference}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    preference: e.target.value as UserProfile["preference"],
                  })
                }
              >
                <option value="all">Semua jenis makanan</option>
                <option value="vegetarian">
                  Vegetarian · boleh telur & susu
                </option>
                <option value="vegan">Vegan</option>
              </select>
            </label>
          </div>
          {draft.age !== undefined && draft.age < 19 && (
            <p className="form-note">
              Usia 17–18 memakai perkiraan kebutuhan energi untuk pertumbuhan.
              Penyesuaian turun/naik berat badan otomatis belum diterapkan.
            </p>
          )}
          <fieldset>
            <legend>Alergi yang perlu disaring</legend>
            <div className="check-grid">
              {ALLERGIES.map((a) => (
                <label className="check-label" key={a}>
                  <input
                    type="checkbox"
                    checked={draft.allergies?.includes(a) ?? false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        allergies: e.target.checked
                          ? [...(draft.allergies ?? []), a]
                          : (draft.allergies ?? []).filter((v) => v !== a),
                      })
                    }
                  />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            Pantangan tambahan (opsional)
            <input
              maxLength={300}
              placeholder="Contoh: tidak boleh makan alpukat"
              value={draft.restrictions}
              onChange={(e) =>
                setDraft({ ...draft, restrictions: e.target.value })
              }
            />
          </label>
          <small>
            Pantangan tambahan perlu ditinjau manual; rekomendasi otomatis
            ditahan jika kolom ini diisi.
          </small>
          <label className="check-label care">
            <input
              type="checkbox"
              checked={draft.specialCare}
              onChange={(e) =>
                setDraft({ ...draft, specialCare: e.target.checked })
              }
            />
            Sedang hamil/menyusui atau memerlukan diet khusus karena kondisi
            kesehatan.
          </label>
          <p className="form-note">
            Profil tubuh, target, dan catatan disimpan di Neon untuk sesi
            perangkat ini. Foto disimpan privat di Object Storage setelah
            dikonfigurasi. Perhitungan energi adalah perkiraan, bukan diagnosis
            atau resep diet.
          </p>
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setStep(1);
                setError("");
              }}
            >
              <ArrowLeft size={16} />
              Kembali
            </button>
            {onClose && (
              <button
                className="button secondary"
                type="button"
                onClick={onClose}
              >
                Batal
              </button>
            )}
            <button className="button primary" disabled={saving} type="submit">
              <Check size={16} />
              {saving
                ? "Menyimpan ke Neon…"
                : initial
                  ? "Simpan profil"
                  : "Mulai YellowScan"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
export function EditForm({
  items,
  onSave,
  onClose,
}: {
  items: FoodItem[];
  onSave: (items: FoodItem[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(items.map((i) => ({ ...i })));
  const [error, setError] = useState("");
  return (
    <form className="manual-food-form"
      onSubmit={(e) => {
        e.preventDefault();
        const r = analysisSchema.safeParse({
          items: draft,
          source: "manual",
          title: "Makanan",
          summary: "",
        });
        if (!r.success) {
          setError("Periksa nama, porsi 1–1.500 gram, dan semua nilai gizi per 100 gram. Nilai kosong atau tidak valid belum bisa disimpan.");
          return;
        }
        onSave(r.data.items);
      }}
    >
      <div className="edit-labels">
        <span>Makanan / cara masak</span>
        <span>Porsi (g)</span>
        <span />
      </div>
      <div className="edit-list">
        {draft.map((item, index) => (
          <div className="manual-food-entry" key={index}><div className="edit-row">
            <div>
              <select
                aria-label={"Makanan " + (index + 1)}
                value={item.foodId ?? "unknown"}
                onChange={(e) => {
                  const f = foodFor(e.target.value);
                  setDraft(
                    draft.map((v, i) =>
                      i === index
                        ? {
                            ...v,
                            foodId: f?.id ?? null,
                            label: f?.name ?? v.label,
                            uncertain: false,
                            customNutrients: undefined,
                          }
                        : v,
                    ),
                  );
                }}
              >
                <option value="unknown">Makanan sendiri / di luar katalog</option>
                {FOODS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {f.nutritionReference?.status === "estimate"
                      ? " · estimasi"
                      : ""}
                  </option>
                ))}
              </select>
              {!item.foodId && (
                <input
                  required
                  maxLength={100}
                  aria-label={"Nama makanan " + (index + 1)}
                  value={item.label}
                  onChange={(e) =>
                    setDraft(
                      draft.map((v, i) =>
                        i === index ? { ...v, label: e.target.value } : v,
                      ),
                    )
                  }
                />
              )}
            </div>
            <input
              required
              aria-label={"Porsi makanan " + (index + 1)}
              type="number"
              min={1}
              max={1500}
              step={1}
              value={item.grams || ""}
              onChange={(e) =>
                setDraft(
                  draft.map((v, i) =>
                    i === index ? { ...v, grams: Number(e.target.value) } : v,
                  ),
                )
              }
            />
            <button
              className="icon-button delete"
              type="button"
              aria-label={"Hapus makanan " + (index + 1)}
              onClick={() => setDraft(draft.filter((_, i) => i !== index))}
            >
              <Trash2 size={17} />
            </button>
          </div>
          {!item.foodId && <div className="manual-nutrients">
            <label className="check-label"><input type="checkbox" checked={Boolean(item.customNutrients)} onChange={e=>setDraft(draft.map((v,i)=>i===index?{...v, customNutrients:e.target.checked?{calories:NaN,protein:NaN,carbs:NaN,fat:NaN,fiber:NaN}:undefined}:v))}/>Isi data gizi sendiri</label>
            {item.customNutrients ? <>
              <p className="form-note">Gizi per 100 gram dari label kemasan atau sumbermu. Isi 0 jika memang nol. Porsi di atas akan dihitung otomatis.</p>
              <div className="form-grid">{METRICS.map(m=><label key={m.key}>{m.label} / 100 g ({m.unit})<input required type="number" min={0} max={m.key==="calories"?1000:100} step="any" value={Number.isFinite(item.customNutrients?.[m.key])?item.customNutrients![m.key]:""} onChange={e=>setDraft(draft.map((v,i)=>i===index?{...v,customNutrients:{...v.customNutrients!,[m.key]:e.target.value===""?NaN:Number(e.target.value)}}:v))}/></label>)}</div>
            </> : <p className="form-note">Tanpa data gizi, makanan ini belum dihitung ke total dan sisa kalori.</p>}
          </div>}
          </div>
        ))}
      </div>
      {!draft.length && (
        <p className="empty-small">Tambahkan makanan yang ada di piringmu.</p>
      )}
      <button
        type="button"
        className="text-button"
        disabled={draft.length >= 20}
        onClick={() =>
          setDraft([
            ...draft,
            { foodId: null, label: "", grams: 100 },
          ])
        }
      >
        <Plus size={16} />
        Tambah makanan
      </button>
      <p className="form-note">
        <Info size={16} />
        Berat bagian termakan, tanpa tulang/kulit. Profil estimasi dan hasil
        yang belum cocok tetap ditandai.
      </p>
      {error && <p className="inline-error">{error}</p>}
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onClose}>
          Batal
        </button>
        <button className="button primary" type="submit">
          <Check size={16} />
          Terapkan
        </button>
      </div>
    </form>
  );
}
