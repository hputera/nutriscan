"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CURRENT_CATALOG_VERSION, installCatalogs } from "@/lib/catalog";
import { summarize, versionForRecord, metadataFor } from "@/lib/nutrition";
import { analysisSchema, profileSchema, mealSchema } from "@/lib/validation";
import {
  dayTotals,
  jakartaDay,
  localMealTime,
  planFor,
  recommendations,
} from "@/lib/personal";
import { saveWithConfirmation } from "@/lib/save-confirmation";
import { responseData } from "@/lib/client-response";
import { MIGRATION_BATCH_SIZE } from "@/lib/upload-limits";
import type {
  Analysis,
  CatalogVersion,
  Submission,
  UserProfile,
  MealType,
  Nutrients,
  MenuTemplate,
} from "@/lib/types";
const EMPTY: Analysis = {
  items: [],
  source: "manual",
  title: "Makanan baru",
  summary: "Unggah foto makanan atau isi komponen dan porsi secara manual.",
};
const ZERO: Nutrients = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
export function displayDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
function validRecord(r: Submission) {
  return (
    r &&
    typeof r.id === "string" &&
    Number.isFinite(Date.parse(r.createdAt)) &&
    analysisSchema.safeParse(r.analysis).success &&
    (!r.meal || mealSchema.safeParse(r.meal).success)
  );
}
export function useDashboard() {
  const [dataReady, setDataReady] = useState(false);
  const [menus, setMenus] = useState<MenuTemplate[]>([]);
  const [canResume, setCanResume] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<Analysis>({ ...EMPTY, items: [] });
  const [image, setImage] = useState<string | null>(null);
  const [activeCatalogVersion, setActiveCatalogVersion] =
    useState<CatalogVersion>(CURRENT_CATALOG_VERSION);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [records, setRecords] = useState<Submission[]>([]);
  const [status, setStatus] = useState({
    gemini: false,
    database: false,
    photos: false,
    accessCodeRequired: false,
  });
  const [code, setCode] = useState("");
  const [day, setDay] = useState("");
  const [eatenAt, setEatenAt] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [modal, setModal] = useState<
    "profile" | "edit" | "history" | "method" | "camera" | "access" | null
  >(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<File | null>(null);
  const sessionRef = useRef("");
  const scanAbort = useRef<AbortController | null>(null);
  const selectionRef = useRef(0);
  const draftIdentity = useRef<{
    id: string;
    createdAt: string;
    revision: number;
  } | null>(null);
  const totals = useMemo(
    () => summarize(analysis.items, activeCatalogVersion),
    [analysis.items, activeCatalogVersion],
  );
  const plan = useMemo(() => (profile ? planFor(profile) : null), [profile]);
  const daily = useMemo(() => dayTotals(records, day), [records, day]);
  const ideas = useMemo(
    () =>
      profile
        ? recommendations(
            profile,
            daily.nutrients,
            plan?.targets ?? null,
            menus,
            daily.unmatched > 0 || !dataReady,
          )
        : {
            message: "Isi profil terlebih dahulu.",
            remaining: null,
            groups: [],
            items: [],
          },
    [profile, daily.nutrients, plan, menus, daily.unmatched, dataReady],
  );
  const hasResults = analysis.items.length > 0;
  useEffect(() => {
    setDay(jakartaDay());
    setEatenAt(localMealTime(new Date().toISOString()));
    void boot();
    return () => scanAbort.current?.abort();
  }, []);
  async function jsonRequest(
    url: string,
    options: RequestInit = {},
    access?: string,
  ) {
    const response = await fetch(url, {
      ...options,
      headers: { "x-prototype-code": access ?? code, ...options.headers },
      signal: options.signal ?? AbortSignal.timeout(25000),
    });
    return (await responseData(response)) as any;
  }
  function pendingPhotos(): Record<string, string> {
    try {
      return JSON.parse(
        localStorage.getItem("nutriscan-photo-pending") ?? "{}",
      );
    } catch {
      return {};
    }
  }
  function storePending(value: Record<string, string>) {
    try {
      if (Object.keys(value).length)
        localStorage.setItem("nutriscan-photo-pending", JSON.stringify(value));
      else localStorage.removeItem("nutriscan-photo-pending");
    } catch {
      setError(
        "Salinan foto sementara tidak bisa disimpan. Aktifkan Object Storage sebelum menutup halaman.",
      );
    }
  }
  async function thumbnail(source: string) {
    const img = new Image();
    img.src = source;
    await img.decode();
    const cv = document.createElement("canvas");
    const ratio = Math.min(1, 640 / Math.max(img.width, img.height));
    cv.width = Math.max(1, Math.round(img.width * ratio));
    cv.height = Math.max(1, Math.round(img.height * ratio));
    cv.getContext("2d")?.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/jpeg", 0.72);
  }
  async function cloudRecords(access: string) {
    const data = await jsonRequest("/api/submissions", {}, access);
    const pending = pendingPhotos();
    const rows: Submission[] = data.submissions
      .filter(validRecord)
      .map((r: Submission) => ({
        ...r,
        image: r.image ?? pending[r.id] ?? null,
        photoPending: !r.photoStored && Boolean(pending[r.id]),
      }));
    setRecords(rows);
    setDataReady(true);
    return rows;
  }
  async function migrateBrowser(
    access: string,
    photos: boolean,
    cloudProfile: UserProfile | null,
  ) {
    let old: Submission[] = [];
    try {
      const raw = JSON.parse(localStorage.getItem("nutriscan-history") ?? "[]");
      if (Array.isArray(raw)) old = raw;
    } catch {}
    const pending = pendingPhotos();
    for (const r of old) if (r?.id && r.image) pending[r.id] = r.image;
    storePending(pending);
    if (!cloudProfile) {
      try {
        const parsed = profileSchema.safeParse(
          JSON.parse(localStorage.getItem("nutriscan-profile") ?? "null"),
        );
        if (parsed.success) {
          const data = await jsonRequest(
            "/api/profile",
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(parsed.data),
            },
            access,
          );
          cloudProfile = data.profile;
          localStorage.removeItem("nutriscan-profile");
        }
      } catch {
        setNotice(
          "Profil lama belum berhasil dipindahkan. Salinan browser tetap tersedia.",
        );
      }
    }
    const completed = new Set<string>();
    for (let index = 0; index < old.length; index += MIGRATION_BATCH_SIZE) {
      const batch = old.slice(index, index + MIGRATION_BATCH_SIZE);
      const payload = await Promise.all(
        batch.map(async (r) => ({
          ...r,
          photoData:
            photos && r.image
              ? await thumbnail(r.image).catch(() => undefined)
              : undefined,
        })),
      );
      const data = await jsonRequest(
        "/api/migrate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: payload }),
          signal: AbortSignal.timeout(90000),
        },
        access,
      );
      for (const id of [...data.accepted, ...data.deleted]) completed.add(id);
      for (const id of [...data.photosStored, ...data.deleted])
        delete pending[id];
      storePending(pending);
      try {
        const remaining = old.filter((r) => !completed.has(r.id));
        if (remaining.length)
          localStorage.setItem("nutriscan-history", JSON.stringify(remaining));
        else localStorage.removeItem("nutriscan-history");
      } catch {}
    }
    if (photos) {
      const rows = await cloudRecords(access);
      for (const r of rows) {
        if (!pending[r.id]) continue;
        const data = await jsonRequest(
          "/api/migrate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              records: [
                {
                  ...r,
                  photoData: await thumbnail(pending[r.id]).catch(
                    () => undefined,
                  ),
                },
              ],
            }),
          },
          access,
        );
        if (data.photosStored.includes(r.id) || data.deleted.includes(r.id))
          delete pending[r.id];
      }
      storePending(pending);
    }
    if (Object.keys(pending).length)
      setNotice(
        "Data tersimpan di Neon. Ada foto yang masih menunggu Object Storage; salinan foto sementara tetap di browser.",
      );
    return cloudProfile;
  }
  async function loadCloud(access: string, photos: boolean) {
    setDataReady(false);
    const data = await jsonRequest("/api/profile", {}, access);
    setProfile(data.profile);
    await cloudRecords(access);
    try {
      const current = await migrateBrowser(access, photos, data.profile);
      setProfile(current);
      setCanResume(Boolean(current));
      await cloudRecords(access);
    } catch {
      setNotice(
        "Sebagian data browser belum berhasil dipindahkan. Salinan lama tetap tersedia; catatan Neon sudah dimuat.",
      );
    }
  }
  async function boot() {
    setReady(false);
    setError("");
    let access = code;
    try {
      access = sessionStorage.getItem("nutriscan-code") ?? code;
    } catch {}
    setCode(access);
    try {
      const [service, catalog, session] = await Promise.all([
        jsonRequest("/api/status", {}, access),
        jsonRequest("/api/catalog", {}, access),
        jsonRequest("/api/session", {}, access),
      ]);
      setStatus(service);
      installCatalogs(catalog.catalogs);
      setMenus(catalog.menus);
      if (session.canResume && !session.active) {
        setCanResume(true);
        setProfile(null);
        setRecords([]);
        return;
      }
      if (!session.active) {
        let legacySessionId = "";
        try {
          legacySessionId = localStorage.getItem("nutriscan-session") ?? "";
        } catch {}
        await jsonRequest(
          "/api/session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ legacySessionId }),
          },
          access,
        );
      }
      setCanResume(true);
      await loadCloud(access, service.photos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Neon belum bisa diakses.");
    } finally {
      setReady(true);
    }
  }
  async function resumeProfile() {
    setCloudLoading(true);
    setError("");
    try {
      await jsonRequest("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      await loadCloud(code, status.photos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profil belum bisa dibuka.");
    } finally {
      setCloudLoading(false);
    }
  }
  async function logout() {
    if (busy || saving || deleting) return;
    try {
      await jsonRequest("/api/session", { method: "DELETE" });
      scanAbort.current?.abort();
      resetMeal();
      setProfile(null);
      setRecords([]);
      setDataReady(false);
      setImage(null);
      setModal(null);
      setCanResume(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Belum berhasil keluar.");
    }
  }
  useEffect(() => {
    if (modal !== "camera") return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    setCameraError("");
    setCameraReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Kamera tidak tersedia. Pilih foto dari perangkat.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        if (!cancelled)
          setCameraError(
            "Izinkan kamera di browser atau pilih foto perangkat.",
          );
      });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [modal]);
  function headers() {
    return { "x-prototype-code": code };
  }
  function markChanged() {
    setSaved(false);
    setError("");
    setNotice("");
  }
  function resetMeal() {
    draftIdentity.current = null;
    setPreparingPhoto(false);
    setEditingId(null);
    scanAbort.current?.abort();
    selectionRef.current++;
    setBusy(false);
    setAnalysis({ ...EMPTY, items: [] });
    setImage(null);
    fileRef.current = null;
    setActiveCatalogVersion(CURRENT_CATALOG_VERSION);
    setEatenAt(localMealTime(new Date().toISOString()));
    markChanged();
  }
  async function loadPhoto(file: File) {
    if (saving) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Gunakan foto JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Pilih foto di bawah 15 MB.");
      return;
    }
    scanAbort.current?.abort();
    const selection = ++selectionRef.current;
    setBusy(false);
    setPreparingPhoto(true);
    markChanged();
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error();
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const preview = canvas.toDataURL("image/jpeg", 0.8);
      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/jpeg", 0.8),
      );
      if (!blob) throw new Error();
      if (selection !== selectionRef.current) return;
      draftIdentity.current = null;
      setEditingId(null);
      fileRef.current = new File([blob], "meal.jpg", { type: "image/jpeg" });
      setImage(preview);
      setAnalysis({ ...EMPTY, items: [] });
      setActiveCatalogVersion(CURRENT_CATALOG_VERSION);
      setEatenAt(localMealTime(new Date().toISOString()));
      if (!status.gemini)
        setNotice(
          "Foto siap. Gunakan Isi makanan manual sampai layanan scan terhubung.",
        );
    } catch {
      if (selection === selectionRef.current)
        setError("Foto tidak bisa dibuka. Coba foto lain.");
    } finally {
      if (selection === selectionRef.current) setPreparingPhoto(false);
    }
  }
  async function analyzePhoto() {
    if (saving || preparingPhoto || busy) return;
    const controller = new AbortController();
    scanAbort.current?.abort();
    scanAbort.current = controller;
    setBusy(true);
    markChanged();
    const progress = setTimeout(() => {
      if (!controller.signal.aborted)
        setNotice(
          "Analisis masih berjalan. Foto tetap tersedia; tunggu sekitar satu menit.",
        );
    }, 12000);
    try {
      let file = fileRef.current;
      if (
        !file &&
        (image?.startsWith("/demo/") || image?.startsWith("/api/photos/"))
      ) {
        const blob = await fetch(image, { signal: controller.signal }).then(
          (r) => r.blob(),
        );
        file = new File([blob], "meal.jpg", { type: "image/jpeg" });
      }
      if (!file) throw new Error("Unggah foto baru untuk dianalisis.");
      const data = new FormData();
      data.append("image", file);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: headers(),
        body: data,
        signal: AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(75000),
        ]),
      });
      const result = await responseData(response);
      const parsed = analysisSchema.safeParse(result.analysis);
      if (!parsed.success) throw new Error("Hasil belum valid. Coba lagi.");
      if (controller.signal.aborted) return;
      setAnalysis(parsed.data);
      setActiveCatalogVersion(CURRENT_CATALOG_VERSION);
      setNotice(
        "Periksa jenis makanan dan berat porsi, lalu simpan ke catatan harian.",
      );
    } catch (e) {
      if (controller.signal.aborted) return;
      setNotice("");
      setError(
        e instanceof Error && e.name === "TimeoutError"
          ? "Analisis melewati batas waktu. Coba lagi sebentar."
          : e instanceof Error
            ? e.message
            : "Analisis belum berhasil.",
      );
    } finally {
      clearTimeout(progress);
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob)
          void loadPhoto(
            new File([blob], "camera.jpg", { type: "image/jpeg" }),
          );
      },
      "image/jpeg",
      0.9,
    );
    setModal(null);
  }
  async function saveProfile(value: UserProfile) {
    setProfileSaving(true);
    setError("");
    try {
      await jsonRequest("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await jsonRequest("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      setProfile(data.profile);
      setCanResume(true);
      try {
        localStorage.removeItem("nutriscan-profile");
      } catch {}
      setModal(null);
      await cloudRecords(code);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Profil belum berhasil disimpan di Neon.",
      );
    } finally {
      setProfileSaving(false);
    }
  }
  async function saveResult() {
    if (!hasResults || saving || saved || preparingPhoto || busy) return;
    const iso = new Date(eatenAt + ":00+07:00");
    if (!Number.isFinite(iso.getTime())) {
      setError("Isi tanggal dan waktu makan yang valid.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    const previous = records.find((r) => r.id === editingId);
    const identity =
      draftIdentity.current ??
      (draftIdentity.current = {
        id: editingId ?? crypto.randomUUID(),
        createdAt: previous?.createdAt ?? new Date().toISOString(),
        revision: previous?.revision ?? 0,
      });
    const record: Submission = {
      id: identity.id,
      createdAt: identity.createdAt,
      revision: identity.revision,
      analysis: structuredClone(analysis),
      image: null,
      catalogVersion: activeCatalogVersion,
      reportVersion: 2,
      meal: {
        eatenAt: iso.toISOString(),
        mealType,
        targets: plan?.targets ?? ZERO,
      },
    };
    try {
      const photoData =
        image && !image.startsWith("/api/photos/")
          ? await thumbnail(image)
          : undefined;
      const outcome = await saveWithConfirmation(record, {
        hasPhoto: Boolean(photoData),
        save: () =>
          jsonRequest("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...record, photoData }),
            signal: AbortSignal.timeout(90000),
          }),
        load: () => cloudRecords(code),
        confirm: (data) => {
          identity.revision = data.revision;
          setEditingId(record.id);
          setSaved(true);
          setDay(jakartaDay(iso));
          setRecords((old) => [
            {
              ...record,
              revision: data.revision,
              image: data.image ?? image,
              photoStored: data.photoStored,
              photoPending: data.photoPending,
            },
            ...old.filter((r) => r.id !== record.id),
          ]);
          const pending = pendingPhotos();
          if (data.photoPending && photoData) pending[record.id] = photoData;
          else if (data.photoStored) delete pending[record.id];
          storePending(pending);
        },
      });
      setNotice(
        outcome.refreshFailed
          ? "Catatan sudah tersimpan di Neon. Riwayat belum berhasil dimuat ulang; coba Muat dari Neon."
          : outcome.ack.photoPending
            ? "Catatan tersimpan di Neon. Foto menunggu konfigurasi Object Storage; salinan sementara ada di browser."
            : "Catatan tersimpan di Neon" +
              (outcome.ack.photoStored ? " beserta foto online." : "."),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Catatan belum berhasil disimpan. Foto dan isian tetap tersedia.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function syncHistory() {
    if (saving) return;
    setCloudLoading(true);
    setError("");
    try {
      await cloudRecords(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Riwayat belum bisa dimuat.");
    } finally {
      setCloudLoading(false);
    }
  }
  async function deleteHistory() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const data = await jsonRequest("/api/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          deleteTarget === "all"
            ? { all: true, confirm: true }
            : { id: deleteTarget, confirm: true },
        ),
        signal: AbortSignal.timeout(90000),
      });
      const ids = new Set<string>(
        deleteTarget === "all"
          ? [...records.map((r) => r.id), ...data.ids]
          : [deleteTarget, ...data.ids],
      );
      setRecords((old) => old.filter((r) => !ids.has(r.id)));
      const pending = pendingPhotos();
      for (const id of ids) delete pending[id];
      if (deleteTarget === "all")
        for (const id of Object.keys(pending)) delete pending[id];
      storePending(pending);
      try {
        const old = JSON.parse(
          localStorage.getItem("nutriscan-history") ?? "[]",
        );
        const kept = Array.isArray(old)
          ? old.filter(
              (r: Submission) => !ids.has(r.id) && deleteTarget !== "all",
            )
          : [];
        if (kept.length)
          localStorage.setItem("nutriscan-history", JSON.stringify(kept));
        else localStorage.removeItem("nutriscan-history");
      } catch {}
      if (deleteTarget === "all" || (editingId && ids.has(editingId)))
        resetMeal();
      setDeleteTarget(null);
      setNotice(
        `${data.deleted} catatan dihapus.` +
          (data.pendingPhotoDeletes
            ? " Pembersihan file foto masih dalam antrean; foto sudah tidak bisa diakses dari riwayat."
            : " Foto terkait ikut dibersihkan."),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Penghapusan belum berhasil; data tetap tersedia.",
      );
    } finally {
      setDeleting(false);
    }
  }
  function openRecord(r: Submission) {
    if (saving || preparingPhoto) return;
    draftIdentity.current = {
      id: r.id,
      createdAt: r.createdAt,
      revision: r.revision ?? 0,
    };
    setEditingId(r.id);
    scanAbort.current?.abort();
    selectionRef.current++;
    setBusy(false);
    setAnalysis(r.analysis);
    setActiveCatalogVersion(versionForRecord(r));
    setImage(r.image);
    fileRef.current = null;
    setSaved(true);
    if (r.meal) {
      setEatenAt(localMealTime(r.meal.eatenAt));
      setMealType(r.meal.mealType);
    }
    setModal(null);
    setError("");
    setNotice(
      "Menampilkan catatan tersimpan; angka memakai versi katalog saat disimpan.",
    );
  }
  function exportRecord(record?: Submission) {
    const a = record?.analysis ?? analysis;
    const version = record ? versionForRecord(record) : activeCatalogVersion;
    const total = summarize(a.items, version);
    const result = {
      app: "NutriScan",
      exportedAt: new Date().toISOString(),
      analysis: a,
      catalogVersion: version,
      meal: record?.meal
        ? { ...record.meal, profile: undefined }
        : { eatenAt, mealType },
      nutrients: total.nutrients,
      incomplete: total.unmatched > 0,
      reference: metadataFor(version),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(result, null, 2)], { type: "application/json" }),
    );
    const aLink = document.createElement("a");
    aLink.href = url;
    aLink.download = "nutriscan-" + (day || "hasil") + ".json";
    aLink.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function saveCode(c: string) {
    setCode(c);
    try {
      sessionStorage.setItem("nutriscan-code", c);
    } catch {}
    setModal(null);
    void boot();
  }
  return {
    ready,
    dataReady,
    menus,
    canResume,
    profileSaving,
    resumeProfile,
    logout,
    boot,
    deleteTarget,
    setDeleteTarget,
    deleting,
    deleteHistory,
    profile,
    saveProfile,
    analysis,
    setAnalysis,
    image,
    activeCatalogVersion,
    setActiveCatalogVersion,
    records,
    status,
    code,
    day,
    setDay,
    eatenAt,
    setEatenAt,
    mealType,
    setMealType,
    modal,
    setModal,
    preparingPhoto,
    busy,
    saving,
    saved,
    error,
    setError,
    notice,
    setNotice,
    cloudLoading,
    cameraError,
    cameraReady,
    setCameraReady,
    uploadRef,
    captureRef,
    videoRef,
    totals,
    plan,
    daily,
    ideas,
    hasResults,
    markChanged,
    resetMeal,
    loadPhoto,
    analyzePhoto,
    capturePhoto,
    saveResult,
    syncHistory,
    openRecord,
    exportRecord,
    saveCode,
  };
}
