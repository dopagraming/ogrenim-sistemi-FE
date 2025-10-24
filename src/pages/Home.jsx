import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, Phone, Mail, Filter, Sparkles } from "lucide-react";
import api from "../lib/axios";

/* ---------- Static filter sources ---------- */
const FACULTIES = [
  "Barbaros Hayrettin Gemi İnşaatı ve Denizcilik Fakültesi",
  "Deniz Bilimleri ve Teknolojisi Fakültesi",
  "Havacılık ve Uzay Bilimleri Fakültesi",
  "İşletme ve Yönetim Bilimleri Fakültesi",
  "Mimarlık Fakültesi",
  "Mühendislik ve Doğa Bilimleri Fakültesi",
  "Turizm Fakültesi",
];

const DEPARTMENTS = [
  "Basım ve Yayım Teknolojileri",
  "Bilgisayar Programcılığı",
  "Bilgisayar Teknolojisi",
  "Büro Yönetimi ve Yönetici Asistanlığı",
  "Çevre Koruma ve Kontrol",
  "Elektrik",
  "Elektronik Haberleşme Teknolojisi",
  "Elektronik Teknolojisi",
  "Geleneksel El Sanatları",
  "Giyim Üretim Teknolojisi",
  "Harita ve Kadastro",
  "Hibrid ve Elektrikli Taşıtlar Teknolojisi",
  "İklimlendirme ve Soğutma Teknolojisi",
  "İnşaat Teknolojisi",
  "İnsansız Hava Aracı Teknolojisi ve Operatörlüğü",
  "Kontrol ve Otomasyon Teknolojisi",
  "Makine",
  "Makine, Resim ve Konstrüksiyon",
  "Mekatronik",
  "Metalurji",
  "Muhasebe ve Vergi Uygulamaları",
  "Otomotiv Teknolojisi",
];

/* ---------- Helpers ---------- */
const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "T";

/* ---------- Small components ---------- */
const TinyBadge = ({ children, tone = "rose" }) => {
  const tones = {
    rose: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-200 dark:border-rose-900/40",
    slate:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700",
    emerald:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-900/40",
    indigo:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-200 dark:border-indigo-900/40",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] border ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const DegreeChips = ({ bookingOptions }) => {
  const lisans = bookingOptions?.lisans || [];
  const yukseklisans = bookingOptions?.yukseklisans || [];
  if (!lisans.length && !yukseklisans.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {lisans.length > 0 && (
        <TinyBadge tone="emerald">Lisans · {lisans.length}</TinyBadge>
      )}
      {yukseklisans.length > 0 && (
        <TinyBadge tone="indigo">Y. Lisans · {yukseklisans.length}</TinyBadge>
      )}
    </div>
  );
};

function TeacherCard({ t }) {
  return (
    <Link
      to={`/teacher/${t._id}`}
      className="group relative rounded-2xl border border-gray-200/80 dark:border-gray-800/80 bg-white/90 dark:bg-gray-950/80 p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
    >
      {/* subtle top gradient */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c9253a] via-rose-400/60 to-gray-400/60 opacity-70 rounded-t-2xl" />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        {t.photoURL ? (
          <img
            src={t.photoURL}
            alt={t.displayName}
            className="h-14 w-14 rounded-xl object-cover border border-gray-200 dark:border-gray-800"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-[#c9253a]/10 text-[#c9253a] flex items-center justify-center font-bold">
            {initials(t.displayName)}
          </div>
        )}

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#c9253a]">
              {t.displayName}
            </h3>
            {t.faculty && <TinyBadge tone="slate">Fakülte</TinyBadge>}
          </div>

          <p className="truncate text-sm text-gray-600 dark:text-gray-400">
            {t.department || "—"}
          </p>
          {t.faculty && (
            <p className="truncate text-[12px] text-gray-400 mt-0.5">
              {t.faculty}
            </p>
          )}
        </div>
      </div>

      {/* contact blocks */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {t.office && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-900 p-2">
            <MapPin className="h-4 w-4 text-[#c9253a]" />
            <span className="truncate text-gray-700 dark:text-gray-300">
              {t.office}
            </span>
          </div>
        )}
        {t.phone && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-900 p-2">
            <Phone className="h-4 w-4 text-[#c9253a]" />
            <span className="truncate text-gray-700 dark:text-gray-300">
              {t.phone}
            </span>
          </div>
        )}
        {t.email && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-900 p-2 sm:col-span-2">
            <Mail className="h-4 w-4 text-[#c9253a]" />
            <span className="truncate text-gray-700 dark:text-gray-300">
              {t.email}
            </span>
          </div>
        )}
      </div>

      <DegreeChips bookingOptions={t.bookingOptions} />

      {/* sparkle on hover */}
      <Sparkles className="absolute right-3 top-3 h-4 w-4 text-amber-400 opacity-0 group-hover:opacity-100 transition" />
    </Link>
  );
}

/* ---------- Page ---------- */
export default function TeachersHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [qDraft, setQDraft] = useState(searchParams.get("q") || "");
  const [q, setQ] = useState(searchParams.get("q") || "");

  const [faculty, setFaculty] = useState(searchParams.get("faculty") || "");
  const [department, setDepartment] = useState(
    searchParams.get("department") || ""
  );

  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [pageSize, setPageSize] = useState(12);

  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / pageSize)),
    [total, pageSize]
  );

  // debounce qDraft -> q
  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      setQ(qDraft.trim());
    }, 300);
    return () => clearTimeout(id);
  }, [qDraft]);

  // Sync URL with state
  useEffect(() => {
    const current = new URLSearchParams(searchParams);
    const changed =
      current.get("q") !== (q || "") ||
      current.get("faculty") !== (faculty || "") ||
      current.get("department") !== (department || "") ||
      parseInt(current.get("page") || "1", 10) !== page;

    if (!changed) return;

    if (q) current.set("q", q);
    else current.delete("q");

    if (faculty) current.set("faculty", faculty);
    else current.delete("faculty");

    if (department) current.set("department", department);
    else current.delete("department");

    current.set("page", String(page));
    setSearchParams(current, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, faculty, department, page]);

  // Fetch
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        setError("");

        if (q && q.length < 2) {
          setTeachers([]);
          setTotal(0);
          setLoading(false);
          return;
        }

        const qp = new URLSearchParams();
        if (q) qp.set("q", q);
        if (faculty) qp.set("faculty", faculty);
        if (department) qp.set("department", department);
        qp.set("page", String(page));
        qp.set("pageSize", String(pageSize));

        const { data } = await api.get(`/api/teachers?${qp.toString()}`, {
          signal: controller.signal,
        });

        const items = data?.items || data?.data || data || [];
        setTeachers(items);
        setTotal(data?.total ?? items.length);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        console.error(err);
        setError("Öğretmenler yüklenemedi.");
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [q, faculty, department, page, pageSize]);

  const clearAll = () => {
    setQDraft("");
    setQ("");
    setFaculty("");
    setDepartment("");
    setPage(1);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#c9253a]/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* hero */}
      <header className="relative">
        <div className="h-44 sm:h-56 bg-gradient-to-r from-[#c9253a] to-gray-700 dark:to-gray-900" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-6xl mx-auto w-full px-4 pb-4 space-y-4">
            {/* title row */}
            <div className="flex items-end justify-between">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-3"
                aria-label="Home"
              >
                <div className="h-12 w-12 rounded-2xl bg-white/90 dark:bg-gray-900/70 border border-white/60 dark:border-gray-700 flex items-center justify-center shadow-sm">
                  <span className="text-[#c9253a] font-black text-lg">T</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">
                    Öğretmenler
                  </h1>
                  <p className="text-white/80 text-sm">
                    Fakülte & Bölüm’e göre keşfedin
                  </p>
                </div>
              </button>

              {(q || faculty || department) && (
                <button
                  onClick={clearAll}
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-white/90 text-[#c9253a] border border-white/60 hover:bg-white transition"
                >
                  Filtreleri Temizle
                </button>
              )}
            </div>

            {/* glass filter dock */}
            <div className="rounded-2xl border border-white/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur shadow-sm p-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* search */}
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={qDraft}
                    onChange={(e) => setQDraft(e.target.value)}
                    placeholder="İsim / bölüm / e-posta…"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-950/70 focus:bg-white dark:focus:bg-gray-900 shadow-inner focus:ring-2 focus:ring-[#c9253a] outline-none text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* faculty */}
                <select
                  value={faculty}
                  onChange={(e) => {
                    setFaculty(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-950/70 focus:bg-white dark:focus:bg-gray-900 shadow-inner focus:ring-2 focus:ring-[#c9253a] outline-none text-gray-900 dark:text-gray-100"
                >
                  <option value="">Tüm Fakülteler</option>
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>

                {/* department */}
                <select
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200/70 dark:border-gray-700/70 bg-white/90 dark:bg-gray-950/70 focus:bg-white dark:focus:bg-gray-900 shadow-inner focus:ring-2 focus:ring-[#c9253a] outline-none text-gray-900 dark:text-gray-100"
                >
                  <option value="">Tüm Bölümler</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* active filters summary */}
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <Filter className="h-4 w-4" />
                {q || faculty || department ? (
                  <div className="flex flex-wrap gap-2">
                    {q && <TinyBadge>Arama: “{q}”</TinyBadge>}
                    {faculty && (
                      <TinyBadge tone="slate">Fakülte: {faculty}</TinyBadge>
                    )}
                    {department && (
                      <TinyBadge tone="slate">Bölüm: {department}</TinyBadge>
                    )}
                  </div>
                ) : (
                  <span>Filtre uygulanmadı</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* list */}
      <main className="relative max-w-6xl mx-auto px-4 pb-12 pt-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 p-5 animate-pulse"
              >
                <div className="h-14 w-14 rounded-xl bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-2/3 mt-4 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-1/2 mt-2 rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-8 mt-4 rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center bg-white/90 dark:bg-gray-900/70">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              ☕
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
              Sonuç bulunamadı
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Farklı bir isim/fakülte/bölüm deneyin veya filtreleri temizleyin.
            </p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {teachers.map((t) => (
                <TeacherCard key={t._id} t={t} />
              ))}
            </section>

            {/* pagination */}
            {total > pageSize && (
              <div className="mt-8 flex items-center justify-between gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Toplam <span className="font-semibold">{total}</span> öğretmen
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value, 10));
                      setPage(1);
                    }}
                    className="px-2.5 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    {[12, 24, 36].map((n) => (
                      <option key={n} value={n}>
                        {n} / sayfa
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => page > 1 && setPage(page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                    >
                      ←
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {page} / {totalPages}
                    </span>
                    <button
                      onClick={() => page < totalPages && setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
