import { useEffect, useMemo, useState, useId } from "react";
import { Clock, Timer, Info, RotateCcw } from "lucide-react";

const weekdayOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (s) => {
  if (!s || !HHMM.test(s)) return NaN;
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

const minutesToHHMM = (mins) => {
  const m = Math.max(0, Math.min(mins, 24 * 60));
  const h = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${h}:${mm}`;
};

export default function TimeSlotForm({ onSubmit, onCancel, initialValues }) {
  const formId = useId();

  const [form, setForm] = useState({
    id: undefined,
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    studentsNumber: 1,
  });

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues) {
      setForm({
        id: initialValues.id,
        dayOfWeek: initialValues.dayOfWeek || "",
        startTime: initialValues.startTime || "",
        endTime: initialValues.endTime || "",
        studentsNumber:
          Number.isInteger(initialValues.studentsNumber) &&
          initialValues.studentsNumber > 0
            ? initialValues.studentsNumber
            : 1,
      });
    } else {
      setForm({
        id: undefined,
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        studentsNumber: 1,
      });
    }
    setTouched({});
  }, [initialValues]);

  const errors = useMemo(() => {
    const errs = {};
    if (!form.dayOfWeek) errs.dayOfWeek = "Select a day.";
    if (!form.startTime || !HHMM.test(form.startTime))
      errs.startTime = "Use 24-hour HH:mm.";
    if (!form.endTime || !HHMM.test(form.endTime))
      errs.endTime = "Use 24-hour HH:mm.";

    const a = toMinutes(form.startTime);
    const b = toMinutes(form.endTime);
    if (!Number.isNaN(a) && !Number.isNaN(b) && b <= a) {
      errs.endTime = "End must be after start.";
    }

    const n = Number(form.studentsNumber);
    if (!Number.isInteger(n) || n < 1) {
      errs.studentsNumber = "Must be an integer ≥ 1.";
    } else if (n > 100) {
      errs.studentsNumber = "Maximum is 100.";
    }

    return errs;
  }, [form.dayOfWeek, form.startTime, form.endTime, form.studentsNumber]);

  const hasErrors = Object.keys(errors).length > 0;

  const duration = useMemo(() => {
    const a = toMinutes(form.startTime);
    const b = toMinutes(form.endTime);
    if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null;
    const mins = b - a;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
  }, [form.startTime, form.endTime]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
  };

  const handleDurationPreset = (minutes) => {
    const start = toMinutes(form.startTime);
    if (Number.isNaN(start)) return;
    const next = start + minutes;
    setField("endTime", minutesToHHMM(next));
    setTouched((t) => ({ ...t, endTime: true }));
  };

  const handleSwapTimes = () => {
    if (!form.startTime || !form.endTime) return;
    setForm((f) => ({ ...f, startTime: f.endTime, endTime: f.startTime }));
    setTouched({ startTime: true, endTime: true, dayOfWeek: !!form.dayOfWeek });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      studentsNumber: true,
    });
    if (hasErrors) return;

    try {
      setSubmitting(true);
      await onSubmit({
        id: form.id,
        dayOfWeek: form.dayOfWeek.toLowerCase(),
        startTime: form.startTime,
        endTime: form.endTime,
        studentsNumber: Number(form.studentsNumber),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ---- UI bits ----
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-200";
  const baseInputCls =
    "mt-1 block w-full rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition";
  const errorBorder = "border-red-500";
  const normalBorder = "border-gray-300 dark:border-gray-700";

  return (
    <form onSubmit={handleSubmit} aria-labelledby={`${formId}-title`}>
      {/* Card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h4
              id={`${formId}-title`}
              className="text-base font-semibold text-gray-900 dark:text-gray-100"
            >
              {form.id ? "Edit time slot" : "Create time slot"}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              24-hour format, e.g. <span className="font-mono">09:00</span> →{" "}
              <span className="font-mono">10:00</span>
            </p>
          </div>
        </div>

        {/* Duration pill */}
        <div
          className={`hidden sm:flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
            duration
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
              : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          }`}
          title={
            duration ? "Selected duration" : "Pick valid times to see duration"
          }
        >
          <Timer className="h-4 w-4" />
          <span>{duration || "—"}</span>
        </div>
      </div>

      {/* Day selector */}
      <div className="mb-4">
        <label className={labelCls}>Day of week</label>
        <div className="mt-2 grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
          {weekdayOrder.map((d) => {
            const active = form.dayOfWeek === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setField("dayOfWeek", d)}
                onBlur={handleBlur}
                name="dayOfWeek"
                aria-pressed={active}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  active
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200"
                    : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                } transition`}
              >
                {d[0].toUpperCase() + d.slice(1)}
              </button>
            );
          })}
        </div>
        {touched.dayOfWeek && errors.dayOfWeek && (
          <p className="mt-1 text-xs text-red-600">{errors.dayOfWeek}</p>
        )}
      </div>

      {/* Time row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Start */}
        <div>
          <label className={labelCls} htmlFor={`${formId}-start`}>
            Start time
          </label>
          <input
            id={`${formId}-start`}
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={(e) => setField("startTime", e.target.value)}
            onBlur={handleBlur}
            step={300}
            className={`${baseInputCls} ${
              touched.startTime && errors.startTime ? errorBorder : normalBorder
            }`}
            aria-invalid={touched.startTime && !!errors.startTime}
            aria-describedby={
              touched.startTime && errors.startTime
                ? `${formId}-start-err`
                : undefined
            }
            required
          />
          {touched.startTime && errors.startTime && (
            <p id={`${formId}-start-err`} className="mt-1 text-xs text-red-600">
              {errors.startTime}
            </p>
          )}
        </div>

        {/* End */}
        <div>
          <div className="flex items-center justify-between">
            <label className={labelCls} htmlFor={`${formId}-end`}>
              End time
            </label>
            {form.startTime && form.endTime && (
              <button
                type="button"
                onClick={handleSwapTimes}
                className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                title="Swap start/end"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Swap
              </button>
            )}
          </div>
          <input
            id={`${formId}-end`}
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={(e) => setField("endTime", e.target.value)}
            onBlur={handleBlur}
            step={300}
            className={`${baseInputCls} ${
              touched.endTime && errors.endTime ? errorBorder : normalBorder
            }`}
            aria-invalid={touched.endTime && !!errors.endTime}
            aria-describedby={
              touched.endTime && errors.endTime
                ? `${formId}-end-err`
                : undefined
            }
            required
          />
          {touched.endTime && errors.endTime && (
            <p id={`${formId}-end-err`} className="mt-1 text-xs text-red-600">
              {errors.endTime}
            </p>
          )}

          {/* Quick duration chips */}
          <div className="flex flex-wrap gap-2 mt-2">
            {[15, 30, 45, 60].map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-full px-3 py-1 text-xs border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-100"
                onClick={() => handleDurationPreset(m)}
                disabled={!form.startTime || !HHMM.test(form.startTime)}
                title={`Set end = start + ${m}m`}
              >
                +{m}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students per slot */}
      <div className="mt-4">
        <label className={labelCls} htmlFor={`${formId}-students`}>
          Students per slot
        </label>
        <input
          id={`${formId}-students`}
          type="number"
          name="studentsNumber"
          inputMode="numeric"
          min={1}
          max={100}
          step={1}
          value={form.studentsNumber}
          onChange={(e) => {
            const v = e.target.value;
            // allow empty string for typing; coerce on submit/blur
            setField(
              "studentsNumber",
              v === "" ? "" : Math.max(1, Math.min(100, parseInt(v, 10) || 0))
            );
          }}
          onBlur={(e) => {
            setTouched((t) => ({ ...t, studentsNumber: true }));
            // normalize blank/NaN to 1 on blur
            const n = parseInt(e.target.value, 10);
            if (!Number.isInteger(n) || n < 1) setField("studentsNumber", 1);
          }}
          className={`${baseInputCls} ${
            touched.studentsNumber && errors.studentsNumber
              ? errorBorder
              : normalBorder
          }`}
          aria-invalid={touched.studentsNumber && !!errors.studentsNumber}
          aria-describedby={
            touched.studentsNumber && errors.studentsNumber
              ? `${formId}-students-err`
              : undefined
          }
          required
        />
        {touched.studentsNumber && errors.studentsNumber && (
          <p
            id={`${formId}-students-err`}
            className="mt-1 text-xs text-red-600"
          >
            {errors.studentsNumber}
          </p>
        )}

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2 mt-2">
          {[1, 2, 3, 5, 10].map((n) => (
            <button
              key={n}
              type="button"
              className={`rounded-full px-3 py-1 text-xs border ${
                Number(form.studentsNumber) === n
                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-200"
                  : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              onClick={() => {
                setField("studentsNumber", n);
                setTouched((t) => ({ ...t, studentsNumber: true }));
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          How many students can book this time slot.
        </p>
      </div>

      {/* Subtle hint */}
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Info className="h-4 w-4 mt-0.5" />
        <p>
          Times use a <span className="font-medium">24-hour clock</span>.
          Touching slots like <span className="font-mono">09:00–10:00</span> and{" "}
          <span className="font-mono">10:00–11:00</span> are allowed.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || hasErrors}
          className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 transition"
        >
          {submitting ? "Saving..." : form.id ? "Save changes" : "Create slot"}
        </button>
      </div>
    </form>
  );
}
