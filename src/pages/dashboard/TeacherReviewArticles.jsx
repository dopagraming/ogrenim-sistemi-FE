import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import api from "../../lib/axios";
import { showToast } from "../../components/Toast";
import {
  Filter,
  Search,
  UserSearch,
  BookText,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  NotebookPen,
  ClipboardCheck,
} from "lucide-react";

const STATUS_BADGE = {
  accepted:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-900/40",
  rejected:
    "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-900/40",
  waiting:
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-900/40",
};

export default function TeacherReviewArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // filters (server-side)
  const [filters, setFilters] = useState({
    status: "all",
    author: "",
    journal: "",
    year: "",
    studentName: "",
    q: "", // labels + all submission content
  });

  // key: `${articleId}:${studentId}` -> note string
  const [notes, setNotes] = useState({});
  const debounceRef = useRef(null);

  /* ----------------------- Fetch Helpers ----------------------- */
  const buildQueryFrom = (f, pageArg, pageSizeArg) => {
    const qp = new URLSearchParams();
    if (f.status && f.status !== "all") qp.set("status", f.status);
    if (f.author?.trim()) qp.set("author", f.author.trim());
    if (f.journal?.trim()) qp.set("journal", f.journal.trim());
    if (f.year?.trim()) qp.set("year", f.year.trim());
    if (f.studentName?.trim()) qp.set("studentName", f.studentName.trim());
    if (f.q?.trim()) qp.set("q", f.q.trim());
    qp.set("page", String(pageArg));
    qp.set("pageSize", String(pageSizeArg));
    return qp.toString();
  };

  const fetchArticlesWith = async (f, pageArg, pageSizeArg) => {
    setLoading(true);
    try {
      const query = buildQueryFrom(f, pageArg, pageSizeArg);
      const res = await api.get(`/api/makaleler/submissions?${query}`);
      const items = res.data.items || res.data.data || [];
      setArticles(items);
      setTotal(res.data.total ?? items.length);
    } catch (err) {
      console.error("Error fetching submissions", err);
      showToast("error", "Makale gönderimleri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Debounced setter that uses the latest filter snapshot (fixes tw/two issue)
  const setDebounced = (name, value) => {
    const next = { ...filters, [name]: value };
    setFilters(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchArticlesWith(next, 1, pageSize);
    }, 300);
  };

  const onStatusChange = (e) => {
    const next = { ...filters, status: e.target.value };
    setFilters(next);
    setPage(1);
    fetchArticlesWith(next, 1, pageSize);
  };

  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id));

  const setNote = (articleId, studentId, val) => {
    setNotes((prev) => ({ ...prev, [`${articleId}:${studentId}`]: val }));
  };
  const getNote = (articleId, studentId) =>
    notes[`${articleId}:${studentId}`] ?? "";

  const handleDecision = async (articleId, studentId, decision) => {
    const teacherNote = getNote(articleId, studentId);
    try {
      await api.put(`/api/makaleler/${articleId}/decision`, {
        studentId,
        status: decision,
        teacherNote,
      });
      showToast(
        "success",
        decision === "accepted" ? "Gönderim onaylandı" : "Gönderim reddedildi"
      );
      // refresh with current filters/page
      fetchArticlesWith(filters, page, pageSize);
    } catch (err) {
      console.error(err);
      showToast("error", "İşlem başarısız oldu");
    }
  };

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const StatusBadge = ({ status }) => {
    const normalized = status === "pending" ? "waiting" : status || "waiting";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[normalized]}`}
      >
        {normalized === "accepted"
          ? "Onaylandı"
          : normalized === "rejected"
          ? "Reddedildi"
          : "Beklemede"}
      </span>
    );
  };

  const LoadingSkeleton = () => (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 animate-pulse">
      <div className="h-4 w-52 bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
    </div>
  );

  const ClearButton = ({ onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      aria-label="Clear"
      title="Temizle"
    >
      ×
    </button>
  );

  /* ----------------------- Student Summary Helpers ----------------------- */
  const now = useMemo(() => new Date(), []);

  const categorizeSubmission = (article, submission) => {
    const deadline = article?.submissionDeadline
      ? new Date(article.submissionDeadline)
      : null;
    const isOverdue = deadline && deadline < now;

    const fields = [
      submission?.preprocessing,
      submission?.methods,
      submission?.classification,
      submission?.results,
      submission?.database,
      submission?.analysis,
      submission?.labels,
    ];

    const anyFilled = fields.some((v) => v?.trim?.());
    const allFilled = fields.every((v) => v?.trim?.());
    const isSubmitted = submission?.submitted;

    if (isOverdue) return "expired";
    if (isSubmitted && allFilled) return "completed";
    if (anyFilled) return "progress";
    return "waiting";
  };

  const studentRollup = useMemo(() => {
    const map = new Map();
    (articles || []).forEach((a) => {
      (a.studentSubmissions || []).forEach((s) => {
        const id = s?.student?._id || s?.student;
        if (!id) return;

        const name =
          s?.student?.name ||
          s?.studentName ||
          s?.student?.studentNumber ||
          "—";

        const cat = categorizeSubmission(a, s);
        const rec = map.get(id) || {
          id,
          name,
          total: 0,
          expired: 0,
          waiting: 0,
          progress: 0,
          completed: 0,
        };

        rec.total += 1;
        if (cat && rec[cat] !== undefined) rec[cat] += 1;
        map.set(id, rec);
      });
    });

    return Array.from(map.values()).sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name)
    );
  }, [articles, now]);

  /* ----------------------- Effects ----------------------- */
  // initial load
  useEffect(() => {
    fetchArticlesWith(filters, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // page/pageSize change
  useEffect(() => {
    fetchArticlesWith(filters, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  /* ----------------------- Render ----------------------- */
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Makale Gönderim İnceleme
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Öğrenci gönderimlerini görüntüleyin, filtreleyin ve karar verin.
              </p>
            </div>
          </div>

          {/* Reset All */}
          <button
            type="button"
            onClick={() => {
              const next = {
                status: "all",
                author: "",
                journal: "",
                year: "",
                studentName: "",
                q: "",
              };
              setFilters(next);
              setPage(1);
              fetchArticlesWith(next, 1, pageSize);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Tüm filtreleri temizle"
          >
            Hepsini Temizle
          </button>
        </div>
      </div>

      {/* Sticky Filters Card */}
      <div className="sticky top-2 z-10 mb-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-red-600/10 flex items-center justify-center">
            <Filter className="h-4 w-4 text-red-600" />
          </div>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Filtreler
          </h2>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Status */}
          <div className="col-span-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Durum
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={onStatusChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Tümü</option>
              <option value="pending">Bekleyenler</option>
              <option value="accepted">Onaylananlar</option>
              <option value="rejected">Reddedilenler</option>
            </select>
          </div>

          {/* Author */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Yazar
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="author"
                value={filters.author}
                onChange={(e) => setDebounced("author", e.target.value)}
                placeholder="Yazar"
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
              />
              {filters.author && (
                <ClearButton
                  onClick={() => {
                    const next = { ...filters, author: "" };
                    setFilters(next);
                    setPage(1);
                    fetchArticlesWith(next, 1, pageSize);
                  }}
                />
              )}
            </div>
          </div>

          {/* Journal */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Dergi
            </label>
            <div className="relative">
              <BookText className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="journal"
                value={filters.journal}
                onChange={(e) => setDebounced("journal", e.target.value)}
                placeholder="Dergi"
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
              />
              {filters.journal && (
                <ClearButton
                  onClick={() => {
                    const next = { ...filters, journal: "" };
                    setFilters(next);
                    setPage(1);
                    fetchArticlesWith(next, 1, pageSize);
                  }}
                />
              )}
            </div>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Yıl
            </label>
            <div className="relative">
              <Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="year"
                value={filters.year}
                onChange={(e) => setDebounced("year", e.target.value)}
                placeholder="YYYY"
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
              />
              {filters.year && (
                <ClearButton
                  onClick={() => {
                    const next = { ...filters, year: "" };
                    setFilters(next);
                    setPage(1);
                    fetchArticlesWith(next, 1, pageSize);
                  }}
                />
              )}
            </div>
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Öğrenci Adı
            </label>
            <div className="relative">
              <UserSearch className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={filters.studentName}
                onChange={(e) => setDebounced("studentName", e.target.value)}
                placeholder="Örn: Ayşe"
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
              />
              {filters.studentName && (
                <ClearButton
                  onClick={() => {
                    const next = { ...filters, studentName: "" };
                    setFilters(next);
                    setPage(1);
                    fetchArticlesWith(next, 1, pageSize);
                  }}
                />
              )}
            </div>
          </div>

          {/* q: labels + content */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Etiketler / İçerikte Ara
            </label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={filters.q}
                onChange={(e) => setDebounced("q", e.target.value)}
                placeholder='Örn: "data augmentation", SVM, ROI'
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
              />
              {filters.q && (
                <ClearButton
                  onClick={() => {
                    const next = { ...filters, q: "" };
                    setFilters(next);
                    setPage(1);
                    fetchArticlesWith(next, 1, pageSize);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="px-4 pb-4 flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Toplam <span className="font-semibold">{total}</span> kayıt
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                const sz = parseInt(e.target.value, 10);
                setPageSize(sz);
                setPage(1);
              }}
              className="px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / sayfa
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => page > 1 && setPage(page - 1)}
                className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                disabled={page <= 1}
              >
                ←
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => page < totalPages && setPage(page + 1)}
                className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                disabled={page >= totalPages}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Student Summary Table (rollup) ---------------- */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Öğrenci Özet Tablosu
          </h3>
          <p className="text-xs text-gray-500">
            Görünen makalelere göre (filtreler uygulanmış)
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Yükleniyor…</div>
        ) : studentRollup.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">Kayıt yok.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                {[
                  "Öğrenci",
                  "Toplam",
                  "Süresi Geçmiş",
                  "Bekleyen",
                  "Devam",
                  "Tamamlanan",
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
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {studentRollup.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {s.name}
                  </td>
                  <td className="px-6 py-3 text-sm">{s.total}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                      {s.expired}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                      {s.waiting}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      {s.progress}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                      {s.completed}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ----------------------- Articles List (existing) ------------------ */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center bg-white dark:bg-gray-900">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <NotebookPen className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
            Kayıt bulunamadı
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Filtreleri değiştirerek tekrar deneyin.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                {["Makale", "Yazar", "Dergi / Yıl", "Gönderim", " "].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {articles.map((a) => (
                <React.Fragment key={a._id}>
                  <tr
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(a._id)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {a.name}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {a.abstract}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {a.author || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {a.journal || "-"}{" "}
                      {a.year ? (
                        <span className="text-gray-400">({a.year})</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {a.studentSubmissions?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(a._id);
                        }}
                      >
                        {expandedId === a._id ? (
                          <>
                            Gizle <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Göster <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedId === a._id && (
                    <tr className="bg-gray-50/60 dark:bg-gray-900/40">
                      <td colSpan={5} className="px-6 py-5">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          Öğrenci Gönderimleri
                        </h4>

                        {a.studentSubmissions?.length ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {a.studentSubmissions.map((s) => {
                              const status = s.status || "waiting";
                              const sid = s.student?._id || s.student;
                              return (
                                <div
                                  key={sid}
                                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {s.student?.name || "-"}{" "}
                                        {s.student?.studentNumber
                                          ? `(${s.student.studentNumber})`
                                          : ""}
                                      </div>
                                      <div className="mt-1 text-xs text-gray-500">
                                        Gönderim:{" "}
                                        {s.submittedAt
                                          ? new Date(
                                              s.submittedAt
                                            ).toLocaleString()
                                          : "-"}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Son Kaydetme:{" "}
                                        {s.lastSavedAt
                                          ? String(s.lastSavedAt)
                                              .replace("T", " ")
                                              .split(".")[0]
                                          : "-"}
                                      </div>
                                    </div>
                                    <StatusBadge status={status} />
                                  </div>

                                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                                    {[
                                      ["preprocessing", "Ön İşleme"],
                                      ["methods", "Yöntemler"],
                                      ["classification", "Sınıflandırma"],
                                      ["results", "Sonuçlar"],
                                      ["database", "Veriseti"],
                                      ["analysis", "Analiz"],
                                      ["labels", "Etiketler"],
                                    ].map(([key, label]) => (
                                      <div
                                        key={key}
                                        className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2"
                                      >
                                        <span className="text-gray-500 dark:text-gray-400 mr-1">
                                          {label}:
                                        </span>
                                        <span className="text-gray-800 dark:text-gray-200">
                                          {s[key] || "-"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Teacher note + actions */}
                                  <div className="mt-4">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                      Notunuz
                                    </label>
                                    <div className="relative">
                                      <textarea
                                        value={getNote(a._id, s.student?._id)}
                                        onChange={(e) =>
                                          setNote(
                                            a._id,
                                            s.student?._id,
                                            e.target.value
                                          )
                                        }
                                        placeholder="Örn: Detayları netleştir, ikinci deney setini ekle…"
                                        className="w-full min-h-[72px] px-3 py-2 pr-24 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
                                      />
                                      <div className="absolute right-2 bottom-2 flex gap-2">
                                        {status !== "accepted" && (
                                          <button
                                            onClick={() =>
                                              handleDecision(
                                                a._id,
                                                s.student?._id,
                                                "accepted"
                                              )
                                            }
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                                          >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Onayla
                                          </button>
                                        )}
                                        {status !== "rejected" && (
                                          <button
                                            onClick={() =>
                                              handleDecision(
                                                a._id,
                                                s.student?._id,
                                                "rejected"
                                              )
                                            }
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                                          >
                                            <XCircle className="h-4 w-4" />
                                            Reddet
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Bu makale için öğrenci gönderimi bulunmamaktadır.
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
