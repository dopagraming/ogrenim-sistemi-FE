import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/axios";
import { showToast } from "../../components/Toast";
import {
  CheckCircle2,
  XCircle,
  FileUp,
  FileText,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  FileSignature,
} from "lucide-react";

export default function TeacherArticleProposals() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("pending"); // pending | approved | rejected | all
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [expanded, setExpanded] = useState(null); // articleId for details row

  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null); // article id for PDF upload
  const [debounceTimer, setDebounceTimer] = useState(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/makaleler"); // teacher-protected
      const data = res.data.data || [];
      // Only proposals / student-origin or those in review flow
      const filtered = data.filter(
        (a) =>
          a.origin === "student" ||
          ["pending", "approved", "rejected"].includes(a.reviewStatus)
      );
      setList(filtered);
    } catch (e) {
      console.error(e);
      showToast("error", "Makaleler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Counts for tab pills
  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: 0 };
    c.all = list.length;
    list.forEach((a) => (c[a.reviewStatus] = (c[a.reviewStatus] || 0) + 1));
    return c;
  }, [list]);

  // Debounced search setter
  const onSearchChange = (val) => {
    setSearch(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(
      setTimeout(() => {
        // we already filter on client; this is to make typing smooth
      }, 250)
    );
  };

  const filteredList = useMemo(() => {
    let arr = list;

    // tab filter
    if (tab !== "all") {
      arr = arr.filter((a) => a.reviewStatus === tab);
    }

    // search filter
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter((a) => {
        return (
          a.name?.toLowerCase().includes(q) ||
          a.journal?.toLowerCase().includes(q) ||
          String(a.year || "").includes(q) ||
          a?.proposedBy?.name?.toLowerCase?.().includes(q) ||
          a?.doi?.toLowerCase?.().includes(q)
        );
      });
    }

    return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [list, tab, search]);

  const approve = async (article) => {
    try {
      setActionLoading(article._id);
      const studentId =
        article.proposedBy?._id || article.proposedBy || article.students?.[0];

      await api.put(`/api/makaleler/${article._id}/proposal-decision`, {
        decision: "approved",
        studentId,
      });
      showToast("success", "Onaylandı");
      fetchArticles();
    } catch (e) {
      console.error(e);
      showToast("error", "Onaylama başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  const reject = async (article) => {
    try {
      setActionLoading(article._id);
      await api.put(`/api/makaleler/${article._id}/proposal-decision`, {
        decision: "rejected",
      });
      showToast("success", "Reddedildi");
      fetchArticles();
    } catch (e) {
      console.error(e);
      showToast("error", "Reddetme başarısız");
    } finally {
      setActionLoading(null);
    }
  };

  const onChoosePdf = (id) => {
    setUploadTarget(id);
    fileInputRef.current?.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    const fd = new FormData();
    fd.append("pdf", file);
    try {
      setActionLoading(uploadTarget);
      await api.put(`/api/makaleler/${uploadTarget}/upload-pdf`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("success", "PDF yüklendi");
      fetchArticles();
    } catch (err) {
      console.error(err);
      showToast("error", "PDF yüklenemedi");
    } finally {
      setActionLoading(null);
      setUploadTarget(null);
      e.target.value = "";
    }
  };

  const toggleExpand = (id) => setExpanded((p) => (p === id ? null : id));

  const InfoRow = ({ label, value }) => (
    <div className="flex gap-2 text-sm">
      <div className="w-40 text-gray-500 dark:text-gray-400">{label}</div>
      <div className="flex-1 text-gray-800 dark:text-gray-200">
        {value || "-"}
      </div>
    </div>
  );

  const Badge = ({ status }) => {
    const map = {
      pending:
        "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-900/40",
      approved:
        "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-900/40",
      rejected:
        "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-900/40",
      none: "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700",
    };
    const label =
      status === "pending"
        ? "Pending"
        : status === "approved"
        ? "Approved"
        : status === "rejected"
        ? "Rejected"
        : "None";
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          map[status || "none"]
        }`}
      >
        {label}
      </span>
    );
  };

  const LoadingRow = () => (
    <tr>
      <td colSpan={6} className="px-6 py-6">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header + Tabs */}

      <div className="sticky top-2 z-10 mb-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur shadow-sm bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 ">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-600/10 flex items-center justify-center">
              <Filter className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Student Proposals
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Öğrenci tarafından önerilen makaleleri inceleyin ve karar verin.
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "pending", label: "Pending", count: counts.pending },
              { key: "approved", label: "Approved", count: counts.approved },
              { key: "rejected", label: "Rejected", count: counts.rejected },
              { key: "all", label: "All", count: counts.all },
            ].map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                    active
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs ${
                      active ? "bg-white/20" : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Ara: Başlık / DOI / Dergi / Yıl / Öğrenci"
              className="w-full pl-9 pr-20 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              {[
                "Başlık",
                "Öğrenci",
                "Dergi / Yıl",
                "Durum",
                "Oluşturma",
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

          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {loading && (
              <>
                <LoadingRow />
                <LoadingRow />
                <LoadingRow />
              </>
            )}

            {!loading && filteredList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
                      Kriterlere uygun kayıt bulunamadı
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Filtreleri değiştirerek tekrar deneyin.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              filteredList.map((a) => (
                <Fragment key={a._id}>
                  <tr className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {a.name}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {a.abstract}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {a.proposedBy?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {a.journal || "-"}{" "}
                      {a.year ? (
                        <span className="text-gray-400">({a.year})</span>
                      ) : (
                        ""
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge status={a.reviewStatus} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {a.createdAt
                        ? new Date(a.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => toggleExpand(a._id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          {expanded === a._id ? (
                            <>
                              Gizle <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              Göster <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </button>

                        {a.reviewStatus === "pending" && (
                          <>
                            <button
                              disabled={actionLoading === a._id}
                              onClick={() => approve(a)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {actionLoading === a._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Onayla
                            </button>
                            <button
                              disabled={actionLoading === a._id}
                              onClick={() => reject(a)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                            >
                              {actionLoading === a._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              Reddet
                            </button>
                          </>
                        )}

                        {a.reviewStatus === "approved" && (
                          <>
                            {a.pdfUrl ? (
                              <a
                                href={a.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <FileText className="h-4 w-4" />
                                PDF’yi Gör
                              </a>
                            ) : (
                              <button
                                disabled={actionLoading === a._id}
                                onClick={() => onChoosePdf(a._id)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                              >
                                {actionLoading === a._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FileUp className="h-4 w-4" />
                                )}
                                PDF Yükle
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded details */}
                  {expanded === a._id && (
                    <tr className="bg-gray-50/60 dark:bg-gray-900/40">
                      <td colSpan={6} className="px-6 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InfoRow label="Başlık" value={a.name} />
                          <InfoRow label="DOI" value={a.doi} />
                          <InfoRow label="Dergi" value={a.journal} />
                          <InfoRow label="Yıl" value={a.year} />
                          <InfoRow label="Köken (Origin)" value={a.origin} />
                          <InfoRow
                            label="Öneren Öğrenci"
                            value={
                              a.proposedBy
                                ? `${a.proposedBy.name || "-"} • ${
                                    a.proposedBy.email || ""
                                  } • ${a.proposedBy._id || ""}`
                                : "-"
                            }
                          />
                          <InfoRow
                            label="PDF"
                            value={a.pdfUrl ? "Yüklü" : "Yüklü değil"}
                          />
                          <InfoRow
                            label="Son Tarih (Deadline)"
                            value={
                              a.submissionDeadline
                                ? new Date(
                                    a.submissionDeadline
                                  ).toLocaleString()
                                : "-"
                            }
                          />
                          <InfoRow
                            label="Oluşturma"
                            value={
                              a.createdAt
                                ? new Date(a.createdAt).toLocaleString()
                                : "-"
                            }
                          />
                          <InfoRow
                            label="Güncelleme"
                            value={
                              a.updatedAt
                                ? new Date(a.updatedAt).toLocaleString()
                                : "-"
                            }
                          />
                        </div>

                        {a.abstract && (
                          <div className="mt-4">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Abstract
                            </div>
                            <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {a.abstract}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
          </tbody>
        </table>

        {/* Hidden file input for PDF upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
