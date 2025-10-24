import React, { useState, useEffect, useMemo } from "react";
import { useAppointments } from "../../contexts/AppointmentContext";
import {
  Calendar,
  Clock,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowLeftRight,
  X,
  Check,
} from "lucide-react";
import BookingCard from "../../components/BookingCard";
import { getTeacherTimeSlots } from "../../services/timeSlotService";
import { useAuth } from "../../contexts/AuthContext";
import { moveDayAppointments } from "../../services/appointmentService";

const weekdayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday"];

function titleCase(s = "") {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export default function AppointmentsList() {
  const { appointments, loading } = useAppointments();
  const { currentUser } = useAuth();

  const [selectedDay, setSelectedDay] = useState("");
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState("");

  const [movingDay, setMovingDay] = useState(null); // "monday" | ... | null
  const [moveToDay, setMoveToDay] = useState("monday");
  const [movingBusy, setMovingBusy] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [moveSuccess, setMoveSuccess] = useState("");

  useEffect(() => {
    if (!currentUser?._id) return;
    (async () => {
      setIsLoading(true);
      try {
        const slots = await getTeacherTimeSlots(currentUser._id);
        setTimeSlots(Array.isArray(slots) ? slots : []);
      } catch (err) {
        console.error("Error fetching time slots:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentUser?._id]);

  const appsBySlot = useMemo(() => {
    const map = new Map();
    (appointments || []).forEach((a) => {
      const id = a.timeSlot;
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(a);
    });
    return map;
  }, [appointments]);

  const slotsByDay = useMemo(() => {
    const grouped = {};
    for (const slot of timeSlots) {
      const d = (slot.dayOfWeek || "").toLowerCase();
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(slot);
    }
    for (const d of Object.keys(grouped)) {
      grouped[d].sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || "")
      );
    }
    return grouped;
  }, [timeSlots]);

  const allDays = useMemo(() => {
    const keys = Object.keys(slotsByDay);
    return weekdayOrder.filter((d) => keys.includes(d));
  }, [slotsByDay]);

  useEffect(() => {
    if (!selectedDay && allDays.length) {
      setSelectedDay(allDays[0]);
    } else if (selectedDay && !allDays.includes(selectedDay)) {
      setSelectedDay(allDays[0] || "");
    }
  }, [allDays, selectedDay]);

  const visibleSlots = useMemo(() => {
    const list = slotsByDay[selectedDay] || [];
    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter((s) => {
      const status = s.isBooked ? "booked" : "available";
      return (
        (s.startTime || "").toLowerCase().includes(query) ||
        (s.endTime || "").toLowerCase().includes(query) ||
        status.includes(query)
      );
    });
  }, [slotsByDay, selectedDay, q]);

  const filteredAppointments = useMemo(() => {
    if (!selectedTimeSlot) return [];
    return appsBySlot.get(selectedTimeSlot._id) || [];
  }, [selectedTimeSlot, appsBySlot]);

  if (loading || isLoading) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
      </div>
    );
  }

  const totalForDay = (day) => (slotsByDay[day] || []).length;
  const appointmentsCountForSlot = (slotId) =>
    (appsBySlot.get(slotId) || []).length;

  const moveDayCursor = (direction) => {
    if (!allDays.length) return;
    const idx = allDays.indexOf(selectedDay);
    if (idx === -1) return setSelectedDay(allDays[0]);
    const nextIdx = (idx + direction + allDays.length) % allDays.length;
    setSelectedDay(allDays[nextIdx]);
    setSelectedTimeSlot(null);
  };

  const handleConfirmMove = async () => {
    if (!currentUser?._id) return;
    if (!movingDay || !moveToDay || moveToDay === movingDay) return;
    setMovingBusy(true);
    setMoveError("");
    setMoveSuccess("");
    try {
      await moveDayAppointments({
        teacherId: currentUser._id, 
        fromDay: movingDay,
        toDay: moveToDay,
        createMissingSlots: true,
      });

      const slots = await getTeacherTimeSlots(currentUser._id);
      setTimeSlots(Array.isArray(slots) ? slots : []);

      setSelectedDay(moveToDay);
      setSelectedTimeSlot(null);
      setMoveSuccess("Gün kaydırma başarıyla tamamlandı.");

      setTimeout(() => {
        setMovingDay(null);
        setMoveSuccess("");
      }, 800);
    } catch (e) {
      console.error(e);
      setMoveError(
        e?.response?.data?.message || "Gün kaydırma sırasında bir hata oluştu."
      );
    } finally {
      setMovingBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Randevular
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uygun zaman dilimlerinizi görüntüleyin ve rezervasyonları
                yönetin.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Zaman/durum ara örn. "10:00", "müsait"'
              className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-red-500 focus:border-red-500 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Days list */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />
                Uygun Günler
              </h3>
              <div className="flex items-center gap-1">
                <button
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => moveDayCursor(-1)}
                >
                  <ChevronLeft className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => moveDayCursor(1)}
                >
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-2 max-h-[60vh] overflow-auto">
              {allDays.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  Zaman dilimi olan gün yok.
                </div>
              ) : (
                allDays.map((d) => {
                  const count = totalForDay(d);
                  const isActive = selectedDay === d;
                  const isMovingThis = movingDay === d;
                  return (
                    <div key={d} className="space-y-2">
                      {/* Row */}
                      <div
                        className={`w-full px-3 py-2 rounded-lg border transition flex items-center justify-between gap-2 ${
                          isActive
                            ? "bg-red-50 dark:bg-red-900/20 border-red-500"
                            : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <button
                          onClick={() => {
                            setSelectedDay(d);
                            setSelectedTimeSlot(null);
                          }}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {titleCase(d)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                              {count}{" "}
                              {count === 1 ? "zaman dilimi" : "zaman dilimi"}
                            </span>
                          </div>
                        </button>

                        {/* Kaydır button */}
                        <button
                          title="Bu gündeki TÜM randevuları başka güne taşı"
                          onClick={() => {
                            setMoveToDay(
                              weekdayOrder.find((x) => x !== d) || "monday"
                            );
                            setMovingDay(isMovingThis ? null : d);
                            setMoveError("");
                            setMoveSuccess("");
                          }}
                          className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                          Kaydır
                        </button>
                      </div>

                      {/* Inline move panel */}
                      {isMovingThis && (
                        <div className="ml-1 mr-1 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                              {titleCase(d)} →
                            </span>
                            <select
                              value={moveToDay}
                              onChange={(e) => setMoveToDay(e.target.value)}
                              className="text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1"
                            >
                              {weekdayOrder
                                .filter((x) => x !== d)
                                .map((x) => (
                                  <option key={x} value={x}>
                                    {titleCase(x)}
                                  </option>
                                ))}
                            </select>

                            <button
                              disabled={movingBusy || moveToDay === d}
                              onClick={handleConfirmMove}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
                            >
                              <Check className="h-3.5 w-3.5" />
                                Kaydir
                            </button>
                            <button
                              onClick={() => {
                                setMovingDay(null);
                                setMoveError("");
                                setMoveSuccess("");
                              }}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <X className="h-3.5 w-3.5" />
                              İptal
                            </button>
                          </div>

                          {moveError ? (
                            <p className="mt-2 text-xs text-rose-600">
                              {moveError}
                            </p>
                          ) : null}
                          {moveSuccess ? (
                            <p className="mt-2 text-xs text-emerald-600">
                              {moveSuccess}
                            </p>
                          ) : null}
                          {movingBusy ? (
                            <p className="mt-2 text-xs text-gray-500">
                              Taşınıyor…
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Slots & appointments */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                {selectedDay
                  ? `Zaman Dilimleri • ${titleCase(selectedDay)}`
                  : "Zaman Dilimleri"}
              </h3>
            </div>

            <div className="p-4">
              {selectedDay && visibleSlots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visibleSlots.map((slot) => {
                    const isActive = selectedTimeSlot?._id === slot._id;
                    const count = appointmentsCountForSlot(slot._id);
                    return (
                      <button
                        key={slot._id}
                        onClick={() =>
                          setSelectedTimeSlot(isActive ? null : slot)
                        }
                        className={`text-left p-4 rounded-xl border transition group ${
                          isActive
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {slot.startTime} – {slot.endTime}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {slot.isBooked ? "Dolu" : "Müsait"}
                            </div>
                          </div>
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                            {count} randevu
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {selectedDay
                      ? "Bu gün için zaman dilimi yok"
                      : "Zaman dilimlerini görmek için bir gün seçin"}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Bir gün seçmek için soldaki gün listesini kullanın.
                  </p>
                </div>
              )}
            </div>
          </div>

          {selectedTimeSlot && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Randevular • {selectedTimeSlot.startTime} –{" "}
                  {selectedTimeSlot.endTime}
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredAppointments.length} randevu
                </div>
              </div>

              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <BookingCard key={appointment._id} booking={appointment} />
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Randevu yok
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Bu zaman dilimi için randevu bulunmuyor.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
