import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import TimeSlotForm from "../../components/TimeSlotForm";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Search,
} from "lucide-react";
import {
  getTeacherTimeSlots,
  addTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
} from "../../services/timeSlotService";
import { showToast } from "../../components/Toast";

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/; 
const weekdayOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const toMinutes = (s) => {
  if (!s || !HHMM.test(s)) return NaN;
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

const formatDuration = (start, end) => {
  const a = toMinutes(start);
  const b = toMinutes(end);
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return "—";
  const diff = b - a;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h && m) return `${h}sa ${m}dk`;
  if (h) return `${h}sa`;
  return `${m}dk`;
};

const isOverlapMinutes = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && bStart < aEnd;


function findConflicts(candidate, allSlots, ignoreId) {
  const cStartM = toMinutes(candidate.startTime);
  const cEndM = toMinutes(candidate.endTime);

  if (Number.isNaN(cStartM) || Number.isNaN(cEndM)) {
    return { error: "Saat HH:mm biçiminde olmalıdır (00:00–23:59)." };
  }
  if (!candidate.dayOfWeek) {
    return { error: "Lütfen bir hafta günü seçin." };
  }
  if (cEndM <= cStartM) {
    return { error: "Bitiş saati başlangıç saatinden sonra olmalıdır." };
  }

  const day = candidate.dayOfWeek.toLowerCase();

  const sameDaySlots = allSlots.filter(
    (s) => s.dayOfWeek?.toLowerCase() === day
  );

  const conflicts = sameDaySlots.filter((s) => {
    if (ignoreId && (s._id === ignoreId || s.id === ignoreId)) return false;
    const sStartM = toMinutes(s.startTime);
    const sEndM = toMinutes(s.endTime);
    if (Number.isNaN(sStartM) || Number.isNaN(sEndM)) return false;
    return isOverlapMinutes(cStartM, cEndM, sStartM, sEndM);
  });

  return { conflicts };
}

export default function ManageAvailability() {
  const { currentUser } = useAuth();

  const [timeSlots, setTimeSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editSlot, setEditSlot] = useState(null);

  const [showBookedSlots, setShowBookedSlots] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "startTime",
    direction: "asc",
  });
  const [selectedDay, setSelectedDay] = useState("");

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef(null);
  const onSearch = (val) => {
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => setDebouncedQuery(val.trim().toLowerCase()),
      200
    );
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [currentUser?._id]);

  const fetchTimeSlots = async () => {
    try {
      const slots = await getTeacherTimeSlots(currentUser._id);
      setTimeSlots(slots || []);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      showToast("error", "Zaman dilimleri yüklenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewSlot = async (slotData) => {
    const { error, conflicts } = findConflicts(slotData, timeSlots);
    if (error) {
      showToast("error", error);
      return;
    }
    if (conflicts?.length) {
      showToast(
        "error",
        `Bu zaman, ${slotData.dayOfWeek} günündeki mevcut ${conflicts.length} zaman dilimiyle çakışıyor.`
      );
      return;
    }

    try {
      const newSlot = await addTimeSlot(currentUser._id, slotData);
      setTimeSlots((prev) => [...prev, newSlot]);
      showToast("success", "Zaman dilimi başarıyla eklendi");
      setIsAddOpen(false); 
    } catch (error) {
      console.error("Error adding time slot:", error);
      showToast("error", "Zaman dilimi eklenemedi");
    }
  };

  const handleUpdateSlot = async (slotData) => {
    const currentId = slotData.id || slotData._id;
    const { error, conflicts } = findConflicts(slotData, timeSlots, currentId);
    if (error) {
      showToast("error", error);
      return;
    }
    if (conflicts?.length) {
      showToast(
        "error",
        `Bu zaman, ${slotData.dayOfWeek} günündeki mevcut ${conflicts.length} zaman dilimiyle çakışıyor.`
      );
      return;
    }

    try {
      const updatedSlot = await updateTimeSlot(currentUser._id, slotData);
      setTimeSlots((prev) =>
        prev.map((s) => (s._id === updatedSlot._id ? updatedSlot : s))
      );
      showToast("success", "Zaman dilimi başarıyla güncellendi");
      setEditSlot(null);
    } catch (error) {
      console.error("Error updating time slot:", error);
      showToast("error", "Zaman dilimi güncellenemedi");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Bu zaman dilimini silmek istediğinize emin misiniz?"))
      return;
    try {
      await deleteTimeSlot(currentUser._id, slotId);
      setTimeSlots((prev) => prev.filter((s) => s._id !== slotId));
      showToast("success", "Zaman dilimi başarıyla silindi");
    } catch (error) {
      console.error("Error deleting time slot:", error);
      showToast("error", "Zaman dilimi silinemedi");
    }
  };

  const handleSort = (key) => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredSlots = useMemo(() => {
    let filtered = [...timeSlots];

    if (!showBookedSlots) filtered = filtered.filter((s) => !s.isBooked);

    if (debouncedQuery) {
      filtered = filtered.filter(
        (s) =>
          s.dayOfWeek?.toLowerCase().includes(debouncedQuery) ||
          s.startTime?.includes(debouncedQuery) ||
          s.endTime?.includes(debouncedQuery)
      );
    }

    if (selectedDay) {
      filtered = filtered.filter(
        (s) => s.dayOfWeek?.toLowerCase() === selectedDay.toLowerCase()
      );
    }

    return filtered.sort((a, b) => {
      if (sortConfig.key === "startTime") {
        const da = weekdayOrder.indexOf(a.dayOfWeek?.toLowerCase());
        const db = weekdayOrder.indexOf(b.dayOfWeek?.toLowerCase());
        if (da !== db) {
          return sortConfig.direction === "asc" ? da - db : db - da;
        }
        const am = toMinutes(a.startTime);
        const bm = toMinutes(b.startTime);
        const cmp = am - bm;
        return sortConfig.direction === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }, [timeSlots, showBookedSlots, debouncedQuery, selectedDay, sortConfig]);

  if (isLoading) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Uygunlukları Yönet
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Zaman dilimlerinizi oluşturun, düzenleyin ve yönetin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Zaman Dilimi Ekle
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="xl:col-span-2 flex flex-wrap gap-2">
              <Chip
                active={selectedDay === ""}
                onClick={() => setSelectedDay("")}
              >
                Hepsi
              </Chip>
              {weekdayOrder.map((d) => (
                <Chip
                  key={d}
                  active={selectedDay === d}
                  onClick={() => setSelectedDay(d)}
                >
                  {d[0].toUpperCase() + d.slice(1)}
                </Chip>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Ara (gün veya saat)…"
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 focus:ring-red-500 focus:border-red-500 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="flex items-center justify-between md:justify-end">
              <label className="inline-flex items-center select-none">
                <input
                  type="checkbox"
                  checked={showBookedSlots}
                  onChange={(e) => setShowBookedSlots(e.target.checked)}
                  className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Dolu dilimleri göster
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <Th onClick={() => handleSort("startTime")}>
                  <div className="flex items-center">
                    Gün & Saat
                    {sortConfig.key === "startTime" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="h-4 w-4 ml-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 ml-1" />
                      ))}
                  </div>
                </Th>
                <Th>Süre</Th>
                <Th>Durum</Th>
                <Th className="text-right">İşlemler</Th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedAndFilteredSlots.map((slot) => (
                <tr
                  key={slot._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40"
                >
                  <Td>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {slot.dayOfWeek?.[0]?.toUpperCase() +
                        slot.dayOfWeek?.slice(1)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {slot.startTime} – {slot.endTime}
                    </div>
                  </Td>

                  <Td>
                    <span className="inline-flex items-center text-sm text-gray-900 dark:text-white">
                      <Clock className="h-4 w-4 mr-1.5 text-gray-400" />
                      {formatDuration(slot.startTime, slot.endTime)}
                    </span>
                  </Td>

                  <Td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        slot.isBooked
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                      }`}
                    >
                      {slot.isBooked ? "Dolu" : "Müsait"}
                    </span>
                  </Td>

                  <Td className="text-right">
                    {!slot.isBooked ? (
                      <div className="flex justify-end gap-2">
                        <IconBtn
                          title="Düzenle"
                          onClick={() => setEditSlot(slot)}
                        >
                          <Edit className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn
                          title="Sil"
                          danger
                          onClick={() => handleDeleteSlot(slot._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </Td>
                </tr>
              ))}

              {sortedAndFilteredSlots.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-14 text-center">
                    <div className="mx-auto h-14 w-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Calendar className="h-7 w-7 text-gray-400" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                      Zaman dilimi bulunamadı
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Öğrencilerin randevu alabilmesi için ilk zaman diliminizi
                      oluşturun.
                    </p>
                    <button
                      onClick={() => setIsAddOpen(true)}
                      className="mt-4 inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Zaman Dilimi Ekle
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={() => setIsAddOpen(true)}
        className="fixed sm:hidden bottom-5 right-5 h-12 w-12 rounded-full shadow-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
        aria-label="Zaman Dilimi Ekle"
      >
        <Plus className="h-5 w-5" />
      </button>

      {/* ADD POPUP */}
      {isAddOpen && (
        <Modal onClose={() => setIsAddOpen(false)} title="Zaman Dilimi Ekle">
          <TimeSlotForm
            onCancel={() => setIsAddOpen(false)}
            onSubmit={handleAddNewSlot}
          />
        </Modal>
      )}

      {editSlot && (
        <Modal onClose={() => setEditSlot(null)} title="Zaman Dilimini Düzenle">
          <TimeSlotForm
            onCancel={() => setEditSlot(null)}
            onSubmit={handleUpdateSlot}
            initialValues={{
              id: editSlot._id,
              dayOfWeek: editSlot.dayOfWeek,
              startTime: editSlot.startTime,
              endTime: editSlot.endTime,
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function Th({ children, className = "", onClick }) {
  const base =
    "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider";
  return (
    <th
      className={`${base} ${
        onClick ? "cursor-pointer select-none" : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>{children}</td>
  );
}

function Chip({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm border transition ${
        active
          ? "bg-red-600 text-white border-red-600 shadow-sm"
          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center h-9 w-9 rounded-md border transition ${
        danger
          ? "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-300 dark:border-red-900/40 dark:hover:bg-red-900/20"
          : "text-gray-700 border-gray-200 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700/40"
      }`}
    >
      {children}
    </button>
  );
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full sm:max-w-lg sm:rounded-xl sm:shadow-xl bg-white dark:bg-gray-800 sm:m-0 m-0 rounded-t-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
