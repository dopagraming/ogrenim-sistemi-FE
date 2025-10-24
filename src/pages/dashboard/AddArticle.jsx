import React, { useEffect, useMemo, useState, useCallback } from "react";
import StudentSelector from "../../components/StudentSelector";
import ManualInputForm from "../../components/ManualInputForm";
import FileUploadForm from "../../components/FileUploadForm";
import api from "../../lib/axios";
import { showToast } from "../../components/Toast";
import {
  FileText,
  Upload,
  Users,
  CalendarDays,
  Save,
  RotateCcw,
  Edit3,
  Trash2,
  Loader2,
  AlertTriangle,
  FilePlus,
} from "lucide-react";

export default function AddArticle() {
  const [submissionType, setSubmissionType] = useState("manual"); // 'manual' | 'file'
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [submissionDeadline, setSubmissionDeadline] = useState("");
  const [articleData, setArticleData] = useState({}); 

  const handleArticlePatch = useCallback((patch) => {
    setArticleData((prev) => ({ ...prev, ...patch }));
  }, []);

  const [makaleler, setMakaleler] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchMakaleler = async () => {
    try {
      setListError("");
      setListLoading(true);
      const res = await api.get("/api/makaleler/");
      const rows =
        res?.data?.data ??
        res?.data?.items ??
        (Array.isArray(res?.data) ? res.data : []) ??
        [];
      setMakaleler(rows);
    } catch (err) {
      console.error("Error fetching makaleler", err);
      setListError("Makaleler yüklenirken hata oluştu");
      showToast("error", "Makaleler yüklenirken hata oluştu");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchMakaleler();
  }, []);

  const errors = useMemo(() => {
    const e = {};
    if (!selectedStudents || selectedStudents.length === 0) {
      e.students = "Lütfen en az bir öğrenci seçin";
    }
    if (!submissionDeadline) {
      e.deadline = "Son teslim tarihi gerekli";
    } else {
      const d = new Date(submissionDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(d.getTime())) e.deadline = "Geçersiz tarih";
      else if (d < today) e.deadline = "Son teslim tarihi geçmiş olamaz";
    }
    const name = articleData?.name || articleData?.title;
    if (!name || String(name).trim().length < 2) {
      e.article = "Makale adı/bilgisi eksik";
    }
    return e;
  }, [selectedStudents, submissionDeadline, articleData]);

  const hasErrors = Object.keys(errors).length > 0;

  const resetForm = () => {
    setArticleData({});
    setEditId(null);
    setSelectedStudents([]);
    setSubmissionDeadline("");
  };

  const handleSubmit = async () => {
    if (hasErrors) {
      const first =
        errors.students ||
        errors.deadline ||
        errors.article ||
        "Eksik alanlar var";
      showToast("warning", first);
      return;
    }

    const payload = {
      ...articleData,
      students: selectedStudents,
      submissionDeadline,
    };

    try {
      setSubmitting(true);
      if (editId) {
        await api.put(`/api/makaleler/${editId}`, payload);
        showToast("success", "Makale başarıyla güncellendi");
      } else {
        await api.post("/api/makaleler/teacher", payload);
        showToast("success", "Makale başarıyla oluşturuldu");
      }
      await fetchMakaleler();
      resetForm();

      setTimeout(() => {
        const el = document.getElementById("makale-listesi");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (err) {
      console.error("Submit failed", err);
      showToast("error", "İşlem sırasında bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Bu makaleyi silmek istediğinize emin misiniz?");
    if (!ok) return;
    try {
      await api.delete(`/api/makaleler/${id}`);
      await fetchMakaleler();
      showToast("success", "Makale başarıyla silindi");
    } catch (err) {
      console.error("Delete failed", err);
      showToast("error", "Silme işlemi sırasında hata oluştu");
    }
  };

  const handleEdit = (makale) => {
    setArticleData({
      name: makale.name || makale.title || "",
      abstract: makale.abstract || "",
      author: makale.author || "",
      year: makale.year || "",
      journal: makale.journal || "",
      volume: makale.volume || "",
      number: makale.number || "",
      address: makale.address || "",
    });
    setEditId(makale._id);
    setSelectedStudents(makale.students || []);
    setSubmissionDeadline(makale.submissionDeadline?.split("T")[0] || "");
    setSubmissionType("manual"); 
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sectionCard =
    "p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800";

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <FilePlus className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {editId ? "Makale Güncelle" : "Makale Ekle"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {editId
                  ? "Makale bilgilerini güncelleyin"
                  : "Yeni bir makale ekleyin"}{" "}
              </p>
            </div>
          </div>
          <div className="mb-8 flex items-start justify-between gap-4">
            {editId && (
              <button
                onClick={resetForm}
                className="inline-flex items-center gap-2 h-10 px-3 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <RotateCcw className="h-4 w-4" />
                İptal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Öğrenci Seçimi */}
      <div className={`${sectionCard} mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-red-600/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Öğrenci Seçimi
            </h3>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Seçili öğrenci:{" "}
            <b className="text-gray-700 dark:text-gray-200">
              {selectedStudents.length}
            </b>
          </span>
        </div>

        <StudentSelector
          selected={selectedStudents}
          onChange={setSelectedStudents}
        />

        {errors.students && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> {errors.students}
          </p>
        )}
      </div>

      {/* Makale Bilgileri */}
      <div className={`${sectionCard} mb-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-sky-600/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-sky-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Makale Bilgileri
            </h3>
          </div>
        </div>

        {/* Deadline */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              Son Teslim Tarihi
            </span>
          </label>
          <input
            type="date"
            value={submissionDeadline}
            onChange={(e) => setSubmissionDeadline(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border ${
              errors.deadline
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-700"
            }`}
          />
          <p className="mt-1 text-xs text-gray-500">
            Öğrenciler bu tarihe kadar makalelerini teslim etmelidir.
          </p>
          {errors.deadline && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> {errors.deadline}
            </p>
          )}
        </div>

        <div className="mb-5">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setSubmissionType("manual")}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
                submissionType === "manual"
                  ? "bg-red-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Edit3 className="h-4 w-4" />
              Manuel Giriş
            </button>
            <button
              type="button"
              onClick={() => setSubmissionType("file")}
              className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
                submissionType === "file"
                  ? "bg-red-600 text-white"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Upload className="h-4 w-4" />
              Dosya Yükleme (.ris / .bib / .pdf)
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
          {submissionType === "manual" ? (
            <ManualInputForm
              value={articleData} 
              onChange={handleArticlePatch} 
            />
          ) : (
            <FileUploadForm
              onChange={handleArticlePatch}
            />
          )}
        </div>

        {errors.article && (
          <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> {errors.article}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 md:static bg-white/70 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md border-t border-gray-200 dark:border-gray-800 md:border-none py-4 md:py-0">
        <div className="flex items-center gap-3 md:gap-4 md:mb-12">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {editId ? "Güncelle" : "Kaydet"}
              </>
            )}
          </button>

          {editId && (
            <button
              onClick={resetForm}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              İptal
            </button>
          )}
        </div>
      </div>

      <div id="makale-listesi" className="mt-10">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Eklenen Makaleler
        </h3>

        {listLoading && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Yükleniyor…</span>
          </div>
        )}

        {!listLoading && listError && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>{listError}</span>
          </div>
        )}

        {!listLoading && !listError && makaleler.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              Henüz makale eklenmedi
            </p>
          </div>
        )}

        {!listLoading && !listError && makaleler.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {makaleler.map((makale) => (
              <div
                key={makale._id}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-base">
                        {makale.name || makale.title || "İsimsiz Makale"}
                      </p>
                      {makale.createdAt && (
                        <span className="text-xs text-gray-500">
                          {makale.createdAt.split("T")[0]}
                        </span>
                      )}
                      {makale.submissionDeadline && (
                        <span className="text-xs text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded px-2 py-0.5">
                          Son Tarih: {makale.submissionDeadline.split("T")[0]}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {makale.journal ? `${makale.journal}` : "—"}
                      {makale.year ? `, ${makale.year}` : ""}
                    </p>

                    {makale.students?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Öğrenciler:{" "}
                        {makale.students.map((s) => s.name || s).join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(makale)}
                      className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-sm"
                    >
                      <Edit3 className="h-4 w-4" />
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(makale._id)}
                      className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
