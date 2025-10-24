import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getTeacherById } from "../services/teacherService";
import { getTimeSlotById } from "../services/timeSlotService";
import { createBooking } from "../services/bookingService";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  FileText,
  Calendar,
  Clock,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { showToast } from "../components/Toast";
import api from "../lib/axios";
import ReCAPTCHA from "react-google-recaptcha";
import { getBookingMajors } from "../services/bookingOptionsService";

function BookingForm() {
  const { teacherId, slotId } = useParams();
  const navigate = useNavigate();

  const [captchaToken, setCaptchaToken] = useState(null);

  const [teacher, setTeacher] = useState(null);
  const [timeSlot, setTimeSlot] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [pageError, setPageError] = useState(null);

  const [exists, setExists] = useState(null);
  const [existsError, setExistsError] = useState(false);
  const [checking, setChecking] = useState(false);

  const [majorOptions, setMajorOptions] = useState([]);
  const [majorsLoading, setMajorsLoading] = useState(false);

  const [formData, setFormData] = useState({
    userType: "visitor",
    studentNumber: "",
    studentName: "",
    studentEmail: "",
    studentPhone: "",
    studentMajor: "",
    notes: "",
    educationLevel: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [teacherData, slotData] = await Promise.all([
          getTeacherById(teacherId),
          getTimeSlotById(teacherId, slotId),
        ]);

        setTeacher(teacherData);
        setTimeSlot(slotData);

        if (!slotData || slotData.isBooked) {
          setPageError(
            "This time slot is no longer available. Please choose another time slot."
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setPageError(
          "Failed to load booking information. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [teacherId, slotId]);

  useEffect(() => {
    if (!teacherId || !formData.educationLevel) return;
    let cancelled = false;
    setMajorsLoading(true);

    getBookingMajors(teacherId, formData.educationLevel)
      .then((list) => {
        if (cancelled) return;
        console.log(list);
        setMajorOptions(list);
        setFormData((prev) => {
          if (list.length === 0) return { ...prev, studentMajor: "" };
          if (list?.includes(prev.studentMajor)) return prev;
          return { ...prev, studentMajor: list[0] };
        });
      })
      .catch(() => setMajorOptions([]))
      .finally(() => setMajorsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [teacherId, formData.educationLevel]);

  useEffect(() => {
    if (formData.userType !== "student") {
      setExists(null);
      setExistsError(false);
      setChecking(false);
      return;
    }

    if (!formData.studentNumber.trim()) {
      setExists(null);
      setExistsError(false);
      setChecking(false);
      return;
    }

    setChecking(true);
    setPageError("");

    const timer = setTimeout(async () => {
      try {
        const response = await api.get("/api/students/check", {
          params: { number: formData.studentNumber.trim() },
        });
        const found = response.data?.data || null;
        setExists(found);
        setExistsError(!found);
      } catch (err) {
        console.log(err);
        setPageError("Error checking student");
        setExists(null);
        setExistsError(false);
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.userType, formData.studentNumber]);

  const maskName = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    return parts
      .map((p) => (p.length <= 2 ? p : `${p.slice(0, 2)}**`))
      .join(" ");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.studentName.trim())
      newErrors.studentName = "Name is required";

    if (formData.userType === "student") {
      if (!formData.studentNumber.trim())
        newErrors.studentNumber = "Student number is required";
      if (!formData.educationLevel.trim())
        newErrors.educationLevel = "Education level is required";
    }

    if (!formData.studentEmail.trim()) {
      newErrors.studentEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.studentEmail)) {
      newErrors.studentEmail = "Email is invalid";
    }

    if (majorOptions.length > 0 && !formData.studentMajor) {
      newErrors.studentMajor = "Please choose a field of study";
    }

    if (!formData.notes.trim()) newErrors.notes = "Notes is required";

    if (!captchaToken) newErrors.captcha = "Please complete the CAPTCHA";

    if (
      formData.userType === "student" &&
      exists &&
      exists.name &&
      formData.studentName &&
      exists.name.trim().toLowerCase() !==
        formData.studentName.trim().toLowerCase()
    ) {
      newErrors.match = "Student number doesn't match the student name";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timeSlot?.isBooked) {
      showToast("error", "This slot has just been booked by someone else.");
      return;
    }
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await createBooking({
        ...formData,
        captchaToken,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        status: "pending",
        teacher: teacherId,
        slotId,
      });

      showToast("success", "Booking request submitted successfully!");
      navigate(`/teacher/${teacherId}`, { state: { bookingSuccess: true } });
    } catch (error) {
      console.error("Error submitting booking:", error);
      const msg =
        error?.response?.data?.message ||
        "Could not submit booking. Please try again.";
      showToast("warning", msg);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (pageError || !teacher || !timeSlot) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-lg w-full text-center px-6 py-8 bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="text-red-500 mb-4 flex justify-center">
            <ShieldCheck className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Unable to complete booking
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {pageError || "Booking information not found."}
          </p>
          <div className="mt-6">
            <Link
              to={`/teacher/${teacherId}`}
              className="inline-flex items-center px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Teacher Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const slotUnavailable = Boolean(timeSlot.isBooked);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to={`/teacher/${teacherId}`}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to {teacher.displayName}
          </Link>
        </div>

        {/* Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Schedule an appointment with {teacher.displayName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fill in your details below to request this time slot.
            </p>
          </div>

          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-900/10">
              <div className="flex items-center text-blue-900 dark:text-blue-200 mb-2">
                <User className="h-5 w-5 mr-2" />
                <span className="font-medium">Teacher</span>
              </div>
              <div className="ml-7 text-gray-800 dark:text-gray-200">
                {teacher.displayName}
              </div>
              {teacher.department && (
                <div className="ml-7 text-sm text-gray-600 dark:text-gray-400">
                  {teacher.department}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-900/10">
              <div className="flex items-center text-emerald-900 dark:text-emerald-200 mb-2">
                <Calendar className="h-5 w-5 mr-2" />
                <span className="font-medium">Selected Slot</span>
              </div>
              <div className="ml-7 space-y-1 text-gray-800 dark:text-gray-200">
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  {timeSlot.dayOfWeek}
                </p>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                  {timeSlot.startTime} – {timeSlot.endTime}
                </p>
                {slotUnavailable && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                    This slot is already booked. Please go back and choose
                    another one.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          {/* top divider & user type row */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="px-6 pt-6 pb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User type
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BookOpen className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.userType
                      ? "border border-red-300"
                      : "border border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <option value="visitor">Visitor</option>
                  <option value="student">Student</option>
                </select>
              </div>
              {errors.userType && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.userType}
                </p>
              )}
            </div>

            <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student-specific */}
              {formData.userType === "student" && (
                <>
                  <Field
                    label="Student number"
                    icon={<User className="h-5 w-5 text-gray-400" />}
                    error={errors.studentNumber}
                  >
                    <input
                      type="text"
                      name="studentNumber"
                      value={formData.studentNumber}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                        errors.studentNumber
                          ? "border border-red-300"
                          : "border border-gray-300 dark:border-gray-700"
                      }`}
                      placeholder="e.g. 22222222"
                      autoFocus
                    />
                  </Field>

                  <Field
                    label="Education level"
                    icon={<BookOpen className="h-5 w-5 text-gray-400" />}
                    error={errors.educationLevel}
                  >
                    <select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                        errors.educationLevel
                          ? "border border-red-300"
                          : "border border-gray-300 dark:border-gray-700"
                      }`}
                    >
                      <option value="">Choose…</option>
                      <option value="lisans">Lisans</option>
                      <option value="yukseklisans">Yüksek Lisans</option>
                    </select>
                  </Field>

                  <div className="md:col-span-2">
                    <Field
                      label="Field of Study"
                      icon={<BookOpen className="h-5 w-5 text-gray-400" />}
                      error={errors.studentMajor}
                    >
                      <select
                        name="studentMajor"
                        value={formData.studentMajor}
                        onChange={handleChange}
                        disabled={majorsLoading}
                        className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                          errors.studentMajor
                            ? "border border-red-300"
                            : "border border-gray-300 dark:border-gray-700"
                        }`}
                      >
                        {majorsLoading && <option>Loading…</option>}
                        {!majorsLoading && majorOptions.length === 0 && (
                          <option value="">No options</option>
                        )}
                        {!majorsLoading &&
                          majorOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                      </select>
                    </Field>
                  </div>
                </>
              )}

              <div>
                <Field
                  label="Full name"
                  icon={<User className="h-5 w-5 text-gray-400" />}
                  error={errors.studentName || errors.match}
                >
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    placeholder="Abdelrahman Zourob"
                    className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                      errors.studentName || errors.match
                        ? "border border-red-300"
                        : "border border-gray-300 dark:border-gray-700"
                    }`}
                  />
                </Field>
                <div className="md:col-span-2 ">
                  {checking && (
                    <p className="mt-1 text-xs text-gray-500">
                      Checking student number…
                    </p>
                  )}
                  {existsError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      Student not found
                    </p>
                  )}
                  {exists?.name && (
                    <p className="mt-1 text-xs text-gray-500">
                      Matched:{" "}
                      <span className="font-medium">
                        {maskName(exists.name)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <Field
                label="Email address"
                icon={<Mail className="h-5 w-5 text-gray-400" />}
                error={errors.studentEmail}
              >
                <input
                  type="email"
                  name="studentEmail"
                  value={formData.studentEmail}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    errors.studentEmail
                      ? "border border-red-300"
                      : "border border-gray-300 dark:border-gray-700"
                  }`}
                />
              </Field>

              <Field
                label="Phone number (optional)"
                icon={<Phone className="h-5 w-5 text-gray-400" />}
              >
                <input
                  type="tel"
                  name="studentPhone"
                  value={formData.studentPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 987-6543"
                  className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Additional notes"
                  icon={<FileText className="h-5 w-5 text-gray-400" />}
                  error={errors.notes}
                  iconTop
                >
                  <textarea
                    name="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Let the teacher know what you'd like to discuss…"
                    className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                      errors.notes
                        ? "border border-red-300"
                        : "border border-gray-300 dark:border-gray-700"
                    }`}
                  />
                </Field>
              </div>

              {/* CAPTCHA */}
              <div className="md:col-span-2">
                <div className="dark:border-gray-700 p-3">
                  <ReCAPTCHA
                    sitekey="6Lct7jwrAAAAAKAs2TjQQkso-V1lr_g-r86x6v8X"
                    onChange={(token) => setCaptchaToken(token)}
                    onExpired={() => setCaptchaToken(null)}
                  />
                </div>
                {errors.captcha && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                    {errors.captcha}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <Link
              to={`/teacher/${teacherId}`}
              className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting || slotUnavailable}
              className={`inline-flex items-center gap-2 py-2 px-4 rounded-lg text-white text-sm font-medium transition ${
                submitting || slotUnavailable
                  ? "bg-blue-600/70 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting…
                </>
              ) : (
                <>
                  Book Appointment
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;

/* ---------- Small bordered field wrapper ---------- */
function Field({ label, icon, error, iconTop = false, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className={`relative ${iconTop ? "pt-5" : ""}`}>
        {!iconTop ? (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        ) : (
          <div className="absolute top-2 left-3 pointer-events-none">
            {icon}
          </div>
        )}
        {children}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
