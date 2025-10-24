import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ChevronLeft,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import TimeSlot from "../components/TimeSlot";
import api from "../lib/axios";
import DOMPurify from "dompurify";

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const WEEKDAY_TR = {
  monday: "Pazartesi",
  tuesday: "Salı",
  wednesday: "Çarşamba",
  thursday: "Perşembe",
  friday: "Cuma",
  saturday: "Cumartesi",
  sunday: "Pazar",
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const toMins = (s) => {
  if (!s || !HHMM.test(s)) return Number.MAX_SAFE_INTEGER;
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

const isFree = (slot) => {
  if (typeof slot?.isAvailable === "boolean") return slot.isAvailable;
  if (slot?.status) return String(slot.status).toLowerCase() === "available";
  return !(slot?.isBooked || slot?.booked || slot?.reserved);
};

const getDayKey = (slot) =>
  String(slot?.dayOfWeek || slot?.day || slot?.weekday || "").toLowerCase();

function TeacherProfile() {
  const { id } = useParams();

  const [teacher, setTeacher] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [articles, setArticles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDay, setSelectedDay] = useState(null);

  const getTruncatedText = (html, max = 100) => {
    if (!html) return "";
    const plain = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
    const trimmed = plain.replace(/\s+/g, " ").trim();
    return trimmed.length > max ? trimmed.slice(0, max).trim() + "…" : trimmed;
  };

  const fetchArticlesSmart = async (teacherId) => {
    try {
      const res1 = await api.get(`/api/content/${teacherId}/articles`);
      const a1 = res1?.data?.data ?? res1?.data ?? [];
      if (Array.isArray(a1) && a1.length >= 0) return a1;
    } catch (_) {}
    try {
      const res2 = await api.get(`/api/teachers/${teacherId}/articles`);
      const a2 = res2?.data?.data ?? res2?.data ?? [];
      if (Array.isArray(a2)) return a2;
    } catch (_) {}
    return [];
  };

  useEffect(() => {
    async function fetchTeacherData() {
      try {
        setLoading(true);

        const [teacherRes, slotsRes, articleList] = await Promise.all([
          api.get(`/api/teachers/${id}`),
          api.get(`/api/teachers/${id}/timeslots`),
          fetchArticlesSmart(id),
        ]);

        const t = teacherRes?.data?.data || teacherRes?.data;
        const s = slotsRes?.data?.data || slotsRes?.data || [];

        setTeacher(t || null);
        setAvailableSlots(Array.isArray(s) ? s : []);
        setArticles(Array.isArray(articleList) ? articleList : []);
        console.log(articleList);
      } catch (err) {
        console.error("Error fetching teacher data:", err);
        setError("Öğretmen bilgileri yüklenemedi. Lütfen tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    }

    fetchTeacherData();
  }, [id]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(WEEKDAYS.map((d) => [d, []]));
    for (const slot of availableSlots || []) {
      const day = getDayKey(slot);
      if (!WEEKDAYS.includes(day)) continue;
      if (isFree(slot)) map[day].push(slot);
    }
    WEEKDAYS.forEach((d) => {
      map[d].sort((a, b) => toMins(a.startTime) - toMins(b.startTime));
    });
    return map;
  }, [availableSlots]);

  // Varsayılan seçili gün
  useEffect(() => {
    const todayIdx = new Date().getDay(); // 0=Sun..6=Sat
    const today = WEEKDAYS[(todayIdx + 6) % 7];
    const firstWithFree = WEEKDAYS.find((d) => grouped[d]?.length > 0);
    setSelectedDay(
      firstWithFree || (WEEKDAYS.includes(today) ? today : "monday")
    );
  }, [grouped]);

  /* ---------------- Yükleniyor ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-3xl mx-auto px-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
            <div className="h-48 sm:h-64 bg-gradient-to-r from-[#c9253a] to-gray-700 dark:to-gray-900 animate-pulse" />
            <div className="px-6 pb-10 pt-24">
              <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5"
                  >
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Hata ---------------- */
  if (error || !teacher) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-lg w-full text-center px-6 py-8 bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-red-500 mb-4 flex justify-center">
            <Calendar className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Bir şeyler ters gitti
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error || "Öğretmen bulunamadı."}
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Ana sayfaya dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Başarılı ---------------- */
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <section className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Kapak */}
          <div className="relative h-48 sm:h-64 bg-gradient-to-r from-[#c9253a] to-gray-700 dark:to-gray-900">
            <div className="absolute inset-0 flex items-center justify-center">
              <Calendar className="h-20 w-20 text-white/20" />
            </div>

            {/* Geri */}
            <div className="absolute left-4 top-4">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-gray-900/70 text-gray-700 dark:text-gray-200 border border-white/60 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                Ana Sayfa
              </Link>
            </div>

            {/* Avatar */}
            <div className="absolute inset-x-0 -bottom-16 flex justify-center">
              <div className="h-36 w-36 rounded-full bg-white dark:bg-gray-700 border-4 border-white dark:border-gray-800 p-1 shadow-xl">
                {teacher.photoURL ? (
                  <img
                    src={teacher.photoURL}
                    alt={teacher.displayName}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full rounded-full bg-gray-100 dark:bg-gray-600">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* İçerik */}
          <div className="pt-24 pb-10 px-6 sm:px-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              {teacher.displayName}
            </h1>

            {teacher.department && (
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-1">
                {teacher.department}
              </p>
            )}

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Sol sütun */}
              <div className="space-y-8">
                {/* İletişim */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-[#c9253a]" />
                    İletişim
                  </h2>
                  <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                    {teacher.email && (
                      <li className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <a
                          href={`mailto:${teacher.email}`}
                          className="hover:underline"
                        >
                          {teacher.email}
                        </a>
                      </li>
                    )}
                    {teacher.phone && (
                      <li className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <a
                          href={`tel:${teacher.phone}`}
                          className="hover:underline"
                        >
                          {teacher.phone}
                        </a>
                      </li>
                    )}
                    {teacher.office && (
                      <li className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        {teacher.office}
                      </li>
                    )}
                  </ul>
                </div>

                {/* Hakkında */}
                {teacher.bio && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Hakkında
                    </h2>
                    <p className="text-sm leading-6 text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {teacher.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Sağ sütun – Uygunluk */}
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#c9253a]" />
                    Uygunluk
                  </h2>

                  {/* Gösterge */}
                  <div className="hidden sm:flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
                      Müsait değil
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      Müsait
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WEEKDAYS.map((d) => {
                    const hasFree = (grouped[d]?.length ?? 0) > 0;
                    const active = selectedDay === d;
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDay(d)}
                        className={[
                          "group w-full rounded-xl px-3.5 py-2.5 border transition text-left",
                          active
                            ? "border-emerald-300 bg-white dark:bg-gray-800 shadow-sm"
                            : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:bg-white/60 dark:hover:bg-gray-800/60",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={[
                              "text-sm font-medium",
                              hasFree
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-gray-600 dark:text-gray-300",
                            ].join(" ")}
                          >
                            {WEEKDAY_TR[d]}
                          </span>

                          {/* Küçük durum noktası */}
                          <span
                            className={[
                              "ml-2 inline-block h-2.5 w-2.5 rounded-full",
                              hasFree ? "bg-emerald-400" : "bg-gray-300",
                            ].join(" ")}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {hasFree ? "Müsait" : "Müsait değil"}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Seçili gün slotları */}
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {WEEKDAY_TR[selectedDay || "monday"]}
                  </h3>

                  {grouped[selectedDay]?.length > 0 ? (
                    <div className="space-y-3">
                      {grouped[selectedDay].map((slot) => (
                        <div
                          key={slot._id || slot.id}
                          className="transform transition hover:scale-[1.01]"
                        >
                          <TimeSlot slot={slot} teacherId={id} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-600 dark:text-gray-400 py-6 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                      <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      Bu günde uygun zaman yok
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Duyurular */}
            <div className="mt-10">
              {Array.isArray(articles) && articles.length > 0 ? (
                <>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Duyurular
                  </h2>

                  <ul className="flex flex-col gap-4">
                    {articles?.map((item) => (
                      <li
                        key={item._id}
                        className="rounded-xl flex items-stretch border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
                      >
                        <div className="w-32 h-24 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
                          {item?.image ? (
                            <img
                              src={item.image}
                              alt={item.title || "duyuru"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            {item.title && (
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                {item.title}
                              </h3>
                            )}

                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                              {getTruncatedText(
                                item.html || item.description,
                                100
                              )}{" "}
                              <a
                                href={`/articles/${item._id}`}
                                className="ml-1 text-xs font-medium underline hover:no-underline"
                                aria-label={`daha fazla ${
                                  item.title || "makale"
                                }`}
                              >
                                fazla
                              </a>
                            </p>
                          </div>

                          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleString("tr-TR")
                              : ""}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  Şu an duyuru yok.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default TeacherProfile;
