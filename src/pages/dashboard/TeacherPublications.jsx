// src/pages/teacher/TeacherPublications.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/axios";
import { showToast } from "../../components/Toast";
import {
  Search,
  Plus,
  BookText,
  ExternalLink,
  FileText,
  FileUp,
  Loader2,
  Pencil,
  Trash2,
  Link2,
  Tag,
  X,
} from "lucide-react";

const TYPES = [
  { key: "article", label: "Makale" },
  { key: "conference", label: "Konferans" },
  { key: "book_chapter", label: "Kitap Bölümü" },
  { key: "book", label: "Kitap" },
  { key: "thesis", label: "Tez" },
  { key: "other", label: "Diğer" },
];

export default function TeacherPublications() {
  const [tab, setTab] = useState("article");
  const [search, setSearch] = useState("");
  const [debounceId, setDebounceId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  // create/edit state
  const [form, setForm] = useState({
    title: "",
    authors: "",
    year: "",
    venue: "",
    doi: "",
    url: "",
    type: "article",
    tags: "",
    pdf: null,
  });
  const [editingId, setEditingId] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const fileRef = useRef(null);
  const [formPdfProgress, setFormPdfProgress] = useState(0);

  // row pdf upload
  const rowFileRef = useRef(null);
  const [uploadTargetId, setUploadTargetId] = useState(null);
  const [rowPdfProgress, setRowPdfProgress] = useState(0);

  // scholar modal
  const [scholarOpen, setScholarOpen] = useState(false);
  const [scholarLoading, setScholarLoading] = useState(false);
  const [scholarItems, setScholarItems] = useState([]);
  const [selectedImport, setSelectedImport] = useState({}); // idx -> boolean
  const [scholarTypes, setScholarTypes] = useState({}); // idx -> type (editable by user)
  const [scholarTab, setScholarTab] = useState("all"); // grouping tab inside modal

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/publications", {
        params: { type: tab || undefined, search: search || undefined },
      });
      setList(res.data.data || []);
    } catch (e) {
      console.error(e);
      showToast("error", "Yayınlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Debounced local search for snappy input
  const onSearchChange = (val) => {
    setSearch(val);
    if (debounceId) clearTimeout(debounceId);
    setDebounceId(setTimeout(fetchList, 300));
  };

  const filtered = useMemo(() => {
    // Backend already filters by search; this is a gentle local refine
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.venue?.toLowerCase().includes(q) ||
        p.doi?.toLowerCase().includes(q) ||
        String(p.year || "").includes(q) ||
        (p.authors || []).join(", ").toLowerCase().includes(q)
    );
  }, [list, search]);

  const resetForm = () =>
    setForm({
      title: "",
      authors: "",
      year: "",
      venue: "",
      doi: "",
      url: "",
      type: tab || "article",
      tags: "",
      pdf: null,
    });

  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = "Başlık zorunludur";
    if (!form.type) errors.type = "Tür seçiniz";
    if (form.year && (Number(form.year) < 1900 || Number(form.year) > 2100)) {
      errors.year = "Yıl 1900 - 2100 aralığında olmalı";
    }
    if (form.url && !/^https?:\/\//i.test(form.url)) {
      errors.url = "URL http(s) ile başlamalıdır";
    }
    if (form.doi && !/10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(form.doi)) {
      // loose DOI check
      errors.doi = "Geçerli bir DOI giriniz (örn. 10.xxxx/xxxxx)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        // update JSON first
        await api.put(`/api/publications/${editingId}`, {
          title: form.title,
          authors: form.authors
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          year: form.year ? Number(form.year) : undefined,
          venue: form.venue,
          doi: form.doi,
          url: form.url,
          type: form.type,
          tags: form.tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });

        // upload PDF if provided
        if (form.pdf) {
          const fd = new FormData();
          fd.append("pdf", form.pdf);
          setFormPdfProgress(0);
          await api.put(`/api/publications/${editingId}/upload-pdf`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (ev) => {
              if (!ev.total) return;
              setFormPdfProgress(Math.round((ev.loaded / ev.total) * 100));
            },
          });
        }

        showToast("success", "Yayın güncellendi");
      } else {
        // create with formdata
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append(
          "authors",
          JSON.stringify(
            form.authors
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        );
        if (form.year) fd.append("year", form.year);
        if (form.venue) fd.append("venue", form.venue);
        if (form.doi) fd.append("doi", form.doi);
        if (form.url) fd.append("url", form.url);
        fd.append("type", form.type);
        fd.append(
          "tags",
          JSON.stringify(
            form.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        );
        if (form.pdf) fd.append("pdf", form.pdf);

        setFormPdfProgress(0);
        await api.post(`/api/publications`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (ev) => {
            if (!ev.total) return;
            setFormPdfProgress(Math.round((ev.loaded / ev.total) * 100));
          },
        });

        showToast("success", "Yayın eklendi");
      }

      setEditingId(null);
      resetForm();
      if (fileRef.current) fileRef.current.value = "";
      setFormPdfProgress(0);
      await fetchList();
    } catch (e) {
      console.error(e);
      showToast("error", "Kayıt başarısız");
      setFormPdfProgress(0);
    }
  };

  const onEdit = (p) => {
    setEditingId(p._id);
    setForm({
      title: p.title || "",
      authors: (p.authors || []).join(", "),
      year: p.year || "",
      venue: p.venue || "",
      doi: p.doi || "",
      url: p.url || "",
      type: p.type || "article",
      tags: (p.tags || []).join(", "),
      pdf: null,
    });
    setFormErrors({});
    if (fileRef.current) fileRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (id) => {
    if (!window.confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/api/publications/${id}`);
      showToast("success", "Silindi");
      await fetchList();
    } catch (e) {
      console.error(e);
      showToast("error", "Silme başarısız");
    }
  };

  const onRowPdfChoose = (id) => {
    setUploadTargetId(id);
    rowFileRef.current?.click();
  };

  const onRowPdfChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    const fd = new FormData();
    fd.append("pdf", file);
    try {
      setRowPdfProgress(0);
      await api.put(`/api/publications/${uploadTargetId}/upload-pdf`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (!ev.total) return;
          setRowPdfProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      });
      showToast("success", "PDF yüklendi");
      await fetchList();
    } catch (err) {
      console.error(err);
      showToast("error", "PDF yükleme hatası");
    } finally {
      e.target.value = "";
      setUploadTargetId(null);
      setRowPdfProgress(0);
    }
  };

  // ---------- Scholar ----------
  const getEffectiveType = (it, idx) =>
    scholarTypes[idx] || it?.predictedType || it?.type || "article";

  const openScholar = async () => {
    setScholarOpen(true);
    setScholarLoading(true);
    setScholarItems([]);
    setSelectedImport({});
    setScholarTypes({});
    setScholarTab("all");
    try {
      const res = await api.get("/api/publications/scholar/check");
      const items = res.data?.data || [];
      setScholarItems(items);

      const init = {};
      items.forEach((it, idx) => {
        init[idx] = it?.predictedType || it?.type || "article";
      });
      setScholarTypes(init);
    } catch (e) {
      console.error(e);
      showToast("error", "Scholar kontrolü başarısız");
    } finally {
      setScholarLoading(false);
    }
  };

  const countsByType = useMemo(() => {
    const counts = { all: scholarItems.length };
    TYPES.forEach((t) => (counts[t.key] = 0));
    scholarItems.forEach((it, idx) => {
      const tp = getEffectiveType(it, idx);
      if (!counts[tp]) counts[tp] = 0;
      counts[tp] += 1;
    });
    return counts;
  }, [scholarItems, scholarTypes]);

  const visibleScholarItems = useMemo(() => {
    const arr = scholarItems.map((it, idx) => ({ it, idx }));
    if (scholarTab === "all") return arr;
    return arr.filter(
      ({ it, idx }) => getEffectiveType(it, idx) === scholarTab
    );
  }, [scholarItems, scholarTab, scholarTypes]);

  const toggleSelectImport = (idx) => {
    setSelectedImport((p) => ({ ...p, [idx]: !p[idx] }));
  };

  const changeScholarType = (idx, value) => {
    setScholarTypes((p) => ({ ...p, [idx]: value }));
  };

  const toggleSelectAllInTab = (checked) => {
    setSelectedImport((prev) => {
      const next = { ...prev };
      visibleScholarItems.forEach(({ idx }) => {
        next[idx] = checked;
      });
      return next;
    });
  };

  const importSelected = async () => {
    const items = scholarItems
      .map((it, idx) => ({ it, idx }))
      .filter(({ idx }) => selectedImport[idx])
      .map(({ it, idx }) => ({
        title: it.title,
        authors: it.authors || [],
        year: it.year,
        venue: it.venue,
        url: it.url,
        externalId: it.externalId,
        type: getEffectiveType(it, idx),
      }));

    if (!items.length) {
      showToast("error", "Lütfen en az bir öğe seçin");
      return;
    }
    try {
      await api.post("/api/publications/scholar/import", { items });
      showToast("success", "Seçilen yayınlar eklendi");
      setScholarOpen(false);
      await fetchList();
    } catch (e) {
      console.error(e);
      showToast("error", "İçe aktarma başarısız");
    }
  };

  // ---------- Helpers ----------
  const typeLabel = (key) => TYPES.find((t) => t.key === key)?.label || key;
  const copy = (text) =>
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("success", "Kopyalandı"));

  // ---------- UI ----------
  return (
    <div className="space-y-6">
      {/* Sticky header */}
      <div className="sticky top-2 z-10 mb-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-600/10 flex items-center justify-center">
              <BookText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Yayınlarım
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kayıt ekleyin, düzenleyin ve PDF yükleyin.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => {
                setEditingId(null);
                resetForm();
                setFormErrors({});
                if (fileRef.current) fileRef.current.value = "";
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Plus className="h-4 w-4" /> Yeni Kayıt
            </button>
            <button
              className="px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700"
              onClick={openScholar}
            >
              Scholar’dan Kontrol Et
            </button>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                  tab === t.key
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-md w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ara: Başlık / Dergi / DOI / Yıl / Yazar"
              className="w-full pl-9 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  fetchList();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit Form */}
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-5 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Başlık *
            </label>
            <input
              className={`w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 ${
                formErrors.title
                  ? "border-rose-400"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Yayın başlığı"
              required
            />
            {formErrors.title && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Tür *
            </label>
            <select
              className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
            >
              {TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Yazarlar
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500"
              value={form.authors}
              onChange={(e) => setForm({ ...form, authors: e.target.value })}
              placeholder="Virgülle ayırın: Ad Soyad, Ad Soyad"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Örn: Ali Veli, John Doe
            </p>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Yıl
            </label>
            <input
              className={`w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 ${
                formErrors.year
                  ? "border-rose-400"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="2024"
              type="number"
              min="1900"
              max="2100"
            />
            {formErrors.year && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.year}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Dergi/Konferans
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="Journal / Conference / Book"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              DOI
            </label>
            <div className="relative">
              <input
                className={`w-full border rounded-md px-3 py-2 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 ${
                  formErrors.doi
                    ? "border-rose-400"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                value={form.doi}
                onChange={(e) => setForm({ ...form, doi: e.target.value })}
                placeholder="10.xxxx/xxxxx"
              />
              {form.doi && (
                <button
                  type="button"
                  title="Kopyala"
                  onClick={() => copy(form.doi)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <Link2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {formErrors.doi && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.doi}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              URL
            </label>
            <div className="relative">
              <input
                className={`w-full border rounded-md px-3 py-2 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 ${
                  formErrors.url
                    ? "border-rose-400"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://…"
              />
              {form.url && (
                <a
                  href={form.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            {formErrors.url && (
              <p className="text-xs text-rose-500 mt-1">{formErrors.url}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Etiketler
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-red-500"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="signal processing, deep learning"
            />
            <p className="text-[11px] text-gray-500 mt-1">Virgülle ayırın</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              PDF (opsiyonel)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setForm({ ...form, pdf: e.target.files?.[0] || null })
              }
              className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            />
            {formPdfProgress > 0 && (
              <div className="mt-2 h-2 w-full bg-gray-200 dark:bg-gray-800 rounded">
                <div
                  className="h-2 bg-red-600 rounded"
                  style={{ width: `${formPdfProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          {editingId && (
            <button
              type="button"
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700"
              onClick={() => {
                setEditingId(null);
                resetForm();
                setFormErrors({});
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              İptal
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2"
          >
            {editingId ? (
              <>
                <Pencil className="h-4 w-4" /> Güncelle
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Ekle
              </>
            )}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              {[
                "Başlık",
                "Yazarlar",
                "Dergi/Yıl",
                "Etiketler",
                "PDF",
                "İşlemler",
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Yükleniyor...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Kayıt bulunamadı
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Filtreleri değiştirerek tekrar deneyin.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p._id}
                  className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {typeLabel(p.type)}
                    </div>
                    <div className="flex gap-2 mt-1">
                      {p.doi && (
                        <button
                          type="button"
                          title="DOI kopyala"
                          onClick={() => copy(p.doi)}
                          className="text-[11px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700"
                        >
                          <Link2 className="h-3 w-3" /> DOI
                        </button>
                      )}
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-700"
                        >
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {(p.authors || []).join(", ")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {p.venue || "-"}{" "}
                    {p.year ? (
                      <span className="text-gray-400">({p.year})</span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(p.tags || []).length ? (
                        p.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                          >
                            <Tag className="h-3 w-3" />
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {p.pdfUrl ? (
                      <a
                        href={p.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Gör
                      </a>
                    ) : (
                      <span className="text-gray-400">Yok</span>
                    )}

                    {/* Inline row upload progress */}
                    {uploadTargetId === p._id && rowPdfProgress > 0 && (
                      <div className="mt-2 h-2 w-32 bg-gray-200 dark:bg-gray-800 rounded">
                        <div
                          className="h-2 bg-indigo-600 rounded"
                          style={{ width: `${rowPdfProgress}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => onEdit(p)}
                      >
                        <Pencil className="h-4 w-4" /> Düzenle
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-700"
                        onClick={() => onDelete(p._id)}
                      >
                        <Trash2 className="h-4 w-4" /> Sil
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                        onClick={() => onRowPdfChoose(p._id)}
                      >
                        <FileUp className="h-4 w-4" />
                        {p.pdfUrl ? "PDF Değiştir" : "PDF Yükle"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* hidden row uploader */}
        <input
          ref={rowFileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onRowPdfChange}
        />
      </div>

      {/* Scholar Modal */}
      {scholarOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h4 className="text-lg font-semibold">
                Google Scholar Eksik Yayınlar
              </h4>
              <button
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setScholarOpen(false)}
              >
                <X className="h-4 w-4" /> Kapat
              </button>
            </div>

            <div className="p-4">
              {scholarLoading ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Kontrol ediliyor...
                </div>
              ) : (
                <>
                  {/* Category Tabs */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      onClick={() => setScholarTab("all")}
                      className={`px-3 py-1.5 rounded-full border text-sm ${
                        scholarTab === "all"
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      Tümü ({countsByType.all || 0})
                    </button>
                    {TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setScholarTab(t.key)}
                        className={`px-3 py-1.5 rounded-full border text-sm ${
                          scholarTab === t.key
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {t.label} ({countsByType[t.key] || 0})
                      </button>
                    ))}
                  </div>

                  {/* Bulk select */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Görüntülenen:{" "}
                      <span className="font-medium">
                        {visibleScholarItems.length}
                      </span>
                    </div>
                    {visibleScholarItems.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700"
                          onClick={() => toggleSelectAllInTab(true)}
                        >
                          Hepsini Seç
                        </button>
                        <button
                          className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-700"
                          onClick={() => toggleSelectAllInTab(false)}
                        >
                          Seçimi Kaldır
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Table */}
                  {scholarItems.length === 0 ? (
                    <p className="text-gray-500">
                      Eksik yayın önerisi bulunamadı.
                    </p>
                  ) : visibleScholarItems.length === 0 ? (
                    <p className="text-gray-500">
                      Bu kategoride gösterilecek öğe yok.
                    </p>
                  ) : (
                    <div className="max-h-[60vh] overflow-auto border border-gray-200 dark:border-gray-800 rounded-lg">
                      <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/40">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Seç
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Başlık
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Yıl
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Kaynak
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Tür
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleScholarItems.map(({ it, idx }) => (
                            <tr
                              key={idx}
                              className="border-t border-gray-100 dark:border-gray-800 align-top"
                            >
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={!!selectedImport[idx]}
                                  onChange={() => toggleSelectImport(idx)}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {it.title}
                                </div>
                                {it.authors?.length ? (
                                  <div className="text-xs text-gray-500">
                                    {it.authors.join(", ")}
                                  </div>
                                ) : null}
                                <div className="mt-1">
                                  <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                    Öneri:{" "}
                                    {typeLabel(getEffectiveType(it, idx))}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {it.year || "-"}
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {it.venue || "-"}
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  className="border border-gray-300 dark:border-gray-700 rounded-md p-1 text-sm bg-white dark:bg-gray-800"
                                  value={getEffectiveType(it, idx)}
                                  onChange={(e) =>
                                    changeScholarType(idx, e.target.value)
                                  }
                                >
                                  {TYPES.map((t) => (
                                    <option key={t.key} value={t.key}>
                                      {t.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700"
                      onClick={() => setScholarOpen(false)}
                    >
                      Vazgeç
                    </button>
                    <button
                      className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                      onClick={importSelected}
                    >
                      Seçilenleri Ekle
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
