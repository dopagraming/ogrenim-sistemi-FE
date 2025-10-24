import { useEffect, useMemo, useState } from "react";
import api from "../lib/axios";
import { showToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import {
  FileText,
  Filter,
  Plus,
  Search,
  CalendarDays,
  BookOpen,
  User2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";

export default function StudentArticles() {
  const { currentUser } = useAuth();

  // ---- state
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroup, setActiveGroup] = useState("all"); // all | expired | waiting | progress | completed

  const [showNewModal, setShowNewModal] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);
  const [newForm, setNewForm] = useState({
    title: "",
    doi: "",
    year: "",
    journal: "",
    abstract: "",
    teacherId: "",
    note: "",
    url: "",
  });

  const openNew = () => setShowNewModal(true);
  const closeNew = () => {
    setShowNewModal(false);
    setNewForm({
      title: "",
      doi: "",
      year: "",
      journal: "",
      abstract: "",
      teacherId: "",
      note: "",
      url: "",
    });
  };

  const refreshArticles = async (keepSelectionId = null) => {
    const res = await api.get(`/api/makaleler/${currentUser._id}/makaleler`);
    const list = res.data.data || [];
    setArticles(list);
    if (keepSelectionId) {
      const updated = list.find((a) => a._id === keepSelectionId);
      if (updated) handleSelectArticle(updated);
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      if (!currentUser?._id) return;
      try {
        setLoading(true);
        await refreshArticles();
      } catch (err) {
        showToast("error", "Makaleler yüklenirken hata oluştu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [currentUser?._id]);

  const now = useMemo(() => new Date(), []);
  const categorizeArticles = (list) => {
    const expired = [];
    const waiting = [];
    const inProgress = [];
    const completed = [];

    list.forEach((article) => {
      const deadline = article.submissionDeadline
        ? new Date(article.submissionDeadline)
        : null;
      const isOverdue = deadline && deadline < now;

      const submission = article.studentSubmissions?.find(
        (sub) =>
          sub.student === currentUser?._id ||
          sub.student?._id === currentUser?._id
      );

      const fields = [
        submission?.preprocessing,
        submission?.methods,
        submission?.classification,
        submission?.results,
        submission?.database,
        submission?.analysis,
        submission?.labels,
      ];
      const anyFilled = fields.some((val) => val?.trim());
      const allFilled = fields.every((val) => val?.trim());
      const isSubmitted = submission?.submitted;

      if (isOverdue) expired.push(article);
      else if (isSubmitted && allFilled) completed.push(article);
      else if (anyFilled) inProgress.push(article);
      else waiting.push(article);
    });

    return { expired, waiting, inProgress, completed };
  };

  const filteredBySearch = useMemo(() => {
    if (!searchTerm.trim()) return articles;
    const q = searchTerm.toLowerCase();
    return articles.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.journal?.toLowerCase().includes(q) ||
        String(a.year || "").includes(q) ||
        a.author?.toLowerCase().includes(q)
    );
  }, [articles, searchTerm]);

  const groupedList = useMemo(() => {
    const { expired, waiting, inProgress, completed } =
      categorizeArticles(filteredBySearch);
    return {
      all: filteredBySearch,
      expired,
      waiting,
      progress: inProgress,
      completed,
    };
  }, [filteredBySearch]);

  const handleSelectArticle = (article) => {
    setSelectedArticle(article);
    const submission = article.studentSubmissions?.find(
      (sub) =>
        sub.student === currentUser?._id ||
        sub.student?._id === currentUser?._id
    );
    setStudentSubmission(submission || null);
    setForm({
      preprocessing: submission?.preprocessing || "",
      methods: submission?.methods || "",
      classification: submission?.classification || "",
      results: submission?.results || "",
      database: submission?.database || "",
      analysis: submission?.analysis || "",
      labels: submission?.labels || "",
    });
  };

  const isEditable =
    !studentSubmission?.submitted || studentSubmission?.isAccepted === false;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!selectedArticle || !currentUser?._id) {
      return showToast("error", "Geçersiz işlem. Lütfen tekrar deneyin.");
    }
    try {
      await api.put(`/api/makaleler/${selectedArticle._id}/student-save`, form);
      showToast("success", "Değişiklikler kaydedildi.");
      await refreshArticles(selectedArticle._id);
    } catch (err) {
      showToast("error", "Kaydetme işlemi sırasında hata oluştu.");
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedArticle || !currentUser?._id) {
      return showToast("error", "Geçersiz işlem. Lütfen yeniden deneyin.");
    }
    const required = [
      "preprocessing",
      "methods",
      "classification",
      "results",
      "database",
      "analysis",
      "labels",
    ];
    const empty = required.filter((f) => !form[f]?.trim());
    if (empty.length) {
      return showToast(
        "error",
        `Lütfen tüm alanları doldurun: ${empty.join(", ")}`
      );
    }
    try {
      await api.put(
        `/api/makaleler/${selectedArticle._id}/student-submit`,
        form
      );
      showToast("success", "Gönderildi! Öğretmenin onayı bekleniyor.");
      await refreshArticles(selectedArticle._id);
    } catch (err) {
      showToast("error", "Gönderme işlemi sırasında hata oluştu.");
      console.error(err);
    }
  };

  const submitNewArticle = async () => {
    if (!newForm.title.trim()) {
      return showToast("error", "Başlık zorunludur.");
    }
    setSubmittingNew(true);
    try {
      const payload = {
        title: newForm.title,
        doi: newForm.doi,
        year: newForm.year,
        journal: newForm.journal,
        abstract: newForm.abstract,
        url: newForm.url,
      };

      if (currentUser?.manuscriptSubmission) {
        await api.post(`/api/makaleler/student-direct-add`, payload);
        showToast(
          "success",
          "Makale listenize eklendi (PDF hoca tarafından yüklenecek)."
        );
      } else {
        const teacherId = newForm.teacherId || currentUser?.teacher || "";
        if (!teacherId) {
          return showToast("error", "Lütfen öğretmen ID giriniz.");
        }
        await api.post(`/api/makaleler/student-request-add`, {
          ...payload,
          teacherId,
          note: newForm.note,
        });
        showToast("success", "Ekleme isteğiniz hocaya gönderildi.");
      }

      await refreshArticles();
      closeNew();
    } catch (e) {
      console.error(e);
      showToast("error", "İşlem başarısız. Bilgileri kontrol edin.");
    } finally {
      setSubmittingNew(false);
    }
  };
  // ---- UI helpers
  const hasSelection = !!selectedArticle;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div
        className={`flex gap-6 transition-all duration-300 ${
          hasSelection ? "flex-col md:flex-row" : "flex-col"
        }`}
      >
        {/* Sidebar */}
        <aside
          className={`h-fit transition-all duration-300 ${
            hasSelection ? "md:w-1/3" : "w-full"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Makaleler
            </h3>
            <button
              onClick={openNew}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              Yeni Makale
            </button>
          </div>

          {/* Search */}
          <div className="mb-3 relative">
            <input
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ara: başlık, dergi, yıl, yazar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Group tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: "all", label: "Tümü", count: groupedList.all.length },
              {
                key: "expired",
                label: "Süresi Geçmiş",
                count: groupedList.expired.length,
              },
              {
                key: "waiting",
                label: "Bekleyen",
                count: groupedList.waiting.length,
              },
              {
                key: "progress",
                label: "Devam",
                count: groupedList.progress.length,
              },
              {
                key: "completed",
                label: "Tamamlanan",
                count: groupedList.completed.length,
              },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveGroup(t.key)}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  activeGroup === t.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {t.label}{" "}
                <span className="ml-1 text-[10px] opacity-80">({t.count})</span>
              </button>
            ))}
          </div>

          {/* Lists */}
          <div className="space-y-6">
            {activeGroup === "all" && groupedList.all.length === 0 && (
              <EmptyHint />
            )}

            {activeGroup === "all" && groupedList.all.length > 0 && (
              <ListBlock
                title="Tümü"
                color="text-gray-800"
                items={groupedList.all}
                onSelect={handleSelectArticle}
                selectedId={selectedArticle?._id}
              />
            )}

            {activeGroup === "expired" && (
              <ListBlock
                title="Süresi Geçmiş"
                icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
                color="text-red-600"
                items={groupedList.expired}
                onSelect={handleSelectArticle}
                selectedId={selectedArticle?._id}
                itemTone="red"
              />
            )}

            {activeGroup === "waiting" && (
              <ListBlock
                title="Bekleyenler"
                icon={<Clock className="h-4 w-4 text-gray-500" />}
                color="text-gray-800"
                items={groupedList.waiting}
                onSelect={handleSelectArticle}
                selectedId={selectedArticle?._id}
                itemTone="gray"
              />
            )}

            {activeGroup === "progress" && (
              <ListBlock
                title="Devam Edenler"
                icon={<BookOpen className="h-4 w-4 text-blue-600" />}
                color="text-blue-600"
                items={groupedList.progress}
                onSelect={handleSelectArticle}
                selectedId={selectedArticle?._id}
                itemTone="blue"
              />
            )}

            {activeGroup === "completed" && (
              <ListBlock
                title="Tamamlananlar"
                icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                color="text-green-600"
                items={groupedList.completed}
                onSelect={handleSelectArticle}
                selectedId={selectedArticle?._id}
                itemTone="green"
              />
            )}
          </div>
        </aside>

        {/* Detail Panel (renders only after selection) */}
        {hasSelection && (
          <main className="md:w-2/3">
            {loading ? (
              <SkeletonDetail />
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedArticle.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    {selectedArticle?.address && (
                      <a
                        href={selectedArticle.address}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                      >
                        URL <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {studentSubmission?.status && (
                      <StatusBadge status={studentSubmission.status} />
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 mb-4">
                  <MetaRow
                    icon={<User2 className="h-4 w-4" />}
                    label="Author"
                    value={selectedArticle.author}
                  />
                  <MetaRow label="Abstract" value={selectedArticle.abstract} />
                  <MetaRow label="Year" value={selectedArticle.year} />
                  <MetaRow label="Journal" value={selectedArticle.journal} />
                  <MetaRow label="Volume" value={selectedArticle.volume} />
                  <MetaRow label="Number" value={selectedArticle.number} />
                </div>

                {/* Deadline */}
                <DeadlineBanner article={selectedArticle} />

                {/* Teacher note */}
                {studentSubmission?.teacherNote && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Öğretmen Notu
                    </p>
                    <p className="text-sm text-yellow-800">
                      {studentSubmission.teacherNote}
                    </p>
                  </div>
                )}

                {studentSubmission?.lastSavedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Son kayıt:{" "}
                    {new Date(studentSubmission.lastSavedAt).toLocaleString()}
                  </p>
                )}

                {/* Fields with your color logic */}
                <div className="mt-5 space-y-4">
                  {[
                    "preprocessing",
                    "methods",
                    "classification",
                    "results",
                    "database",
                    "analysis",
                    "labels",
                  ].map((field) => {
                    const base =
                      "w-full border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 min-h-[96px]";
                    const disabledCls = !isEditable
                      ? "bg-gray-100 cursor-not-allowed border-gray-200"
                      : "border-gray-300 focus:ring-blue-500";
                    const colorFill = !form[field]?.trim()
                      ? "bg-red-100" // waiting (empty)
                      : studentSubmission?.submitted
                      ? "bg-green-100" // completed/submitted
                      : "bg-blue-100"; // in progress
                    return (
                      <div key={field}>
                        <label className="block mb-1 text-sm font-medium capitalize text-gray-700">
                          {field}
                        </label>
                        <textarea
                          name={field}
                          value={form[field]}
                          onChange={handleChange}
                          disabled={!isEditable}
                          className={`${base} ${disabledCls} ${colorFill}`}
                          placeholder={`Enter ${field}...`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Status banners */}
                <div className="mt-5 space-y-2">
                  {!studentSubmission?.status && (
                    <Ribbon color="blue" icon={<Filter className="h-4 w-4" />}>
                      Henüz gönderim yapılmadı. Bilgilerinizi girip
                      gönderebilirsiniz.
                    </Ribbon>
                  )}
                  {studentSubmission?.status === "accepted" && (
                    <Ribbon
                      color="green"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                    >
                      Bu makale öğretmen tarafından onaylandı.
                    </Ribbon>
                  )}
                  {studentSubmission?.status === "waiting" && (
                    <Ribbon color="amber" icon={<Clock className="h-4 w-4" />}>
                      Öğretmen onayı bekleniyor.
                    </Ribbon>
                  )}
                  {studentSubmission?.status === "rejected" && (
                    <Ribbon
                      color="red"
                      icon={<AlertTriangle className="h-4 w-4" />}
                    >
                      Öğretmen gönderiminizi reddetti. Lütfen düzeltin.
                    </Ribbon>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  {!studentSubmission?.submitted && (
                    <>
                      <button
                        onClick={handleSave}
                        className="px-5 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {studentSubmission?.status === "rejected"
                          ? "Tekrar Gönder"
                          : "Gönder"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </main>
        )}
      </div>

      {/* New Article Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-lg border border-gray-200">
            <div className="px-5 py-4 border-b">
              <h4 className="text-lg font-semibold">
                {currentUser?.manuscriptSubmission
                  ? "Doğrudan Makale Ekle"
                  : "Makale Ekleme İsteği"}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Lütfen temel bilgileri girin. Başlık zorunludur.
              </p>
            </div>

            <div className="px-5 py-4 space-y-3">
              <Input
                label="Başlık (Title) *"
                value={newForm.title}
                onChange={(v) => setNewForm((p) => ({ ...p, title: v }))}
                placeholder="Makale başlığı"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="DOI"
                  value={newForm.doi}
                  onChange={(v) => setNewForm((p) => ({ ...p, doi: v }))}
                  placeholder="10.xxxx/xxxxx"
                />
                <Input
                  label="Yıl (Year)"
                  value={newForm.year}
                  onChange={(v) => setNewForm((p) => ({ ...p, year: v }))}
                  placeholder="2024"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Dergi (Journal)"
                  value={newForm.journal}
                  onChange={(v) => setNewForm((p) => ({ ...p, journal: v }))}
                  placeholder="Journal of …"
                />
                <Input
                  label="URL"
                  value={newForm.url}
                  onChange={(v) => setNewForm((p) => ({ ...p, url: v }))}
                  placeholder="https://…"
                />
              </div>
              <Textarea
                label="Özet (Abstract)"
                value={newForm.abstract}
                onChange={(v) => setNewForm((p) => ({ ...p, abstract: v }))}
                rows={3}
              />

              {/* teacherId + note when not allowed direct submission */}
              {!currentUser?.manuscriptSubmission && (
                <>
                  <Input
                    label="Öğretmen ID (teacherId)"
                    value={newForm.teacherId}
                    onChange={(v) =>
                      setNewForm((p) => ({ ...p, teacherId: v }))
                    }
                    placeholder="Ör: 66a1b2c3d4e5f6…"
                  />
                  <Textarea
                    label="Not (isteğe bağlı)"
                    value={newForm.note}
                    onChange={(v) => setNewForm((p) => ({ ...p, note: v }))}
                    rows={2}
                  />
                </>
              )}
            </div>

            <div className="px-5 py-4 border-t flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded-md border hover:bg-gray-50"
                onClick={closeNew}
              >
                İptal
              </button>
              <button
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={submitNewArticle}
                disabled={submittingNew}
              >
                {submittingNew
                  ? "Kaydediliyor…"
                  : currentUser?.manuscriptSubmission
                  ? "Ekle"
                  : "İstek Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Small UI helpers ---------- */
function ListBlock({
  title,
  icon,
  color = "text-gray-800",
  items,
  onSelect,
  selectedId,
  itemTone, // "red" | "gray" | "blue" | "green"
}) {
  if (!items || items.length === 0)
    return (
      <section>
        <h4 className={`font-semibold mb-2 ${color} flex items-center gap-2`}>
          {icon} {title}
        </h4>
        <div className="text-xs text-gray-500">Kayıt yok.</div>
      </section>
    );

  const toneMap = {
    red: "border-red-200 bg-red-50 hover:bg-red-100",
    gray: "border-gray-200 bg-white hover:bg-gray-50",
    blue: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    green: "border-green-200 bg-green-50 hover:bg-green-100",
    default: "border-gray-200 bg-white hover:bg-gray-50",
  };

  return (
    <section>
      <h4 className={`font-semibold mb-2 ${color} flex items-center gap-2`}>
        {icon} {title}
      </h4>
      <div className="space-y-2">
        {items.map((a) => (
          <button
            key={a._id}
            onClick={() => onSelect(a)}
            className={`w-full text-left p-3 rounded-lg border transition group ${
              selectedId === a._id
                ? "border-blue-500 bg-blue-50"
                : toneMap[itemTone] || toneMap.default
            }`}
          >
            <div className="font-medium text-gray-900">{a.name}</div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              {a.journal && <span>{a.journal}</span>}
              {a.year && <span>({a.year})</span>}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function MetaRow({ label, value, icon }) {
  if (!value) return null;
  return (
    <p className="flex items-start gap-2">
      {icon && <span className="mt-0.5">{icon}</span>}
      <span className="font-semibold">{label}:</span>
      <span className="text-gray-700">{value}</span>
    </p>
  );
}

function DeadlineBanner({ article }) {
  if (!article?.submissionDeadline) return null;
  const remaining = new Date(article.submissionDeadline) - new Date();
  const isOverdue = remaining <= 0;

  return (
    <div
      className={`mt-2 mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
        isOverdue ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
      }`}
    >
      <CalendarDays className="h-4 w-4" />
      {isOverdue ? (
        <>
          Süre doldu • {new Date(article.submissionDeadline).toLocaleString()}
        </>
      ) : (
        <>
          Son Tarih: {new Date(article.submissionDeadline).toLocaleString()} •{" "}
          <span className="opacity-80">
            {(() => {
              const diff = new Date(article.submissionDeadline) - new Date();
              const d = Math.floor(diff / (1000 * 60 * 60 * 24));
              const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
              return `${d} gün ${h} saat kaldı`;
            })()}
          </span>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  const map = {
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    waiting: "bg-amber-100 text-amber-700",
  };
  const label =
    {
      accepted: "Onaylandı",
      rejected: "Reddedildi",
      waiting: "Beklemede",
    }[status] || status;

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        map[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {label}
    </span>
  );
}

function Ribbon({ children, color = "blue", icon }) {
  const map = {
    blue: "bg-blue-50 text-blue-800 border-blue-100",
    green: "bg-green-50 text-green-800 border-green-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    red: "bg-red-50 text-red-800 border-red-100",
  };
  return (
    <div
      className={`p-3 rounded-md text-sm border flex items-center gap-2 ${map[color]}`}
    >
      {icon}
      <div>{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700 mb-1 block">{label}</span>
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Textarea({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700 mb-1 block">{label}</span>
      <textarea
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
      />
    </label>
  );
}

function EmptyHint() {
  return (
    <div className="p-4 rounded-lg border border-dashed border-gray-200 text-center">
      <FileText className="mx-auto h-6 w-6 text-gray-400 mb-1" />
      <div className="text-sm text-gray-600">Kayıt bulunamadı.</div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-2/3" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
      </div>
      <div className="h-28 bg-gray-200 rounded" />
      <div className="h-28 bg-gray-200 rounded" />
    </div>
  );
}
