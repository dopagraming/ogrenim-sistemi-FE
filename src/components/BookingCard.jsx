import React, { useState, useEffect, useMemo } from "react";
import { useAppointments } from "../contexts/AppointmentContext";
import { useAuth } from "../contexts/AuthContext";
import { getTeacherAvailableSlots } from "../services/timeSlotService";
import { showToast } from "./Toast";
import {
  Clock,
  Calendar,
  User,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Save,
  ArrowRight,
} from "lucide-react";

function BookingCard({ booking }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState(booking.notes || "");
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const { currentUser } = useAuth();
  const {
    acceptAppointment,
    rejectAppointment,
    updateAppointmentNotes, // if you have it in your context
    moveAppointment,
  } = useAppointments();

  // Load available slots when opening the move modal
  useEffect(() => {
    console.log(currentUser._id);

    if (!isMoveOpen) return;
    (async () => {
      try {
        const slots = await getTeacherAvailableSlots(currentUser._id);
        // Only those with capacity (not booked and studentsNumber > 0)
        const usable = (slots || []).filter(
          (s) => !s.isBooked && (s.studentsNumber ?? 0) > 0
        );
        setAvailableSlots(usable);
      } catch (e) {
        console.error(e);
        showToast("error", "Failed to load available slots");
      }
    })();
  }, [isMoveOpen, currentUser?._id]);

  const handleAccept = async () => {
    setIsLoading(true);
    try {
      const success = await acceptAppointment(booking._id);
      if (success) showToast("success", "Appointment accepted successfully");
      else showToast("error", "Failed to accept appointment");
    } catch {
      showToast("error", "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      const success = await rejectAppointment(booking._id);
      if (success) showToast("success", "Appointment rejected");
      else showToast("error", "Failed to reject appointment");
    } catch {
      showToast("error", "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsLoading(true);
    try {
      await updateAppointmentNotes(booking._id, notes);
      showToast("success", "Notes saved successfully");
    } catch {
      showToast("error", "Failed to save notes");
    } finally {
      setIsLoading(false);
    }
  };

  const doMove = async () => {
    if (!selectedSlotId) {
      showToast("error", "Please select a target time slot");
      return;
    }
    setIsLoading(true);
    try {
      const { ok, message } = await moveAppointment(
        booking._id,
        selectedSlotId
      );
      if (ok) {
        showToast("success", "Appointment moved");
        setIsMoveOpen(false);
      } else {
        showToast("error", message || "Failed to move appointment");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-all duration-300 mb-4
        ${isExpanded ? "shadow-md" : "shadow-sm"} 
        ${
          booking.status === "pending"
            ? "border-yellow-300 dark:border-yellow-900"
            : booking.status === "accepted"
            ? "border-green-300 dark:border-green-900"
            : "border-red-300 dark:border-red-900"
        }
        bg-white dark:bg-gray-900
      `}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
            <span className="font-medium text-gray-900 dark:text-white">
              {booking.studentName}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge()}
            <button
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <svg
                className={`h-5 w-5 transform transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center mr-6 mb-2">
            <Calendar className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
            {booking.startTime}
          </div>
          <div className="flex items-center mb-2">
            <Clock className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
            {booking.startTime} - {booking.endTime}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          {/* Student + Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Student Information
              </p>
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {booking.studentName}
                </span>
              </div>
              <div className="flex items-center mb-2">
                <Mail className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {booking.studentEmail}
                </span>
              </div>
              {booking.studentPhone && (
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {booking.studentPhone}
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                <span className="font-medium">Major:</span>{" "}
                {booking.studentMajor || "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Teacher's Notes
              </p>
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Add notes about this appointment..."
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={isLoading}
                  className="absolute bottom-2 right-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Notes
                </button>
              </div>
            </div>
          </div>

          {/* Actions row: Move is always visible; Accept/Reject only for pending */}
          <div className="flex flex-wrap justify-end gap-3 mt-4">
            <button
              onClick={() => setIsMoveOpen(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-700 text-sm leading-4 font-medium rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition"
            >
              <ArrowRight className="mr-1.5 h-4 w-4" />
              Move
            </button>

            {booking.status === "pending" && (
              <>
                <button
                  onClick={handleReject}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Reject
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  Accept
                </button>
              </>
            )}
          </div>

          {/* Move Modal */}
          {isMoveOpen && (
            <MoveModal
              onClose={() => setIsMoveOpen(false)}
              availableSlots={availableSlots}
              selectedSlotId={selectedSlotId}
              setSelectedSlotId={setSelectedSlotId}
              onMove={doMove}
              isLoading={isLoading}
              currentSlotId={booking.timeSlot}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default BookingCard;

/** Small controlled modal to pick a new slot */
function MoveModal({
  onClose,
  availableSlots,
  selectedSlotId,
  setSelectedSlotId,
  onMove,
  isLoading,
  currentSlotId,
}) {
  // Group by day for nicer selection
  const grouped = useMemo(() => {
    const byDay = {};
    for (const s of availableSlots) {
      if (s._id === currentSlotId) continue; // skip same slot
      const day = s.dayOfWeek || "unknown";
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(s);
    }
    return byDay;
  }, [availableSlots, currentSlotId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Move appointment to another slot
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {Object.keys(grouped).length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No available slots to move to.
            </p>
          )}

          {Object.entries(grouped).map(([day, slots]) => (
            <div key={day}>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                {day[0].toUpperCase() + day.slice(1)}
              </p>
              <div className="grid grid-cols-1 gap-2">
                {slots.map((s) => (
                  <label
                    key={s._id}
                    className={`flex items-center justify-between p-3 rounded-md border cursor-pointer ${
                      selectedSlotId === s._id
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {s.startTime} - {s.endTime}
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="targetSlot"
                      value={s._id}
                      checked={selectedSlotId === s._id}
                      onChange={() => setSelectedSlotId(s._id)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onMove}
            disabled={isLoading || !selectedSlotId}
            className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
