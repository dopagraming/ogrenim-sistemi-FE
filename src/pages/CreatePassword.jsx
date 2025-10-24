import { useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import api from "../lib/axios";

export default function CreatePassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState("");
  const recaptchaRef = useRef(null);

  const rules = useMemo(() => {
    const len = password.length >= 8;
    const upper = /[A-Z]/.test(password);
    const num = /\d/.test(password);
    const special = /[^A-Za-z0-9]/.test(password);
    const score = [len, upper, num, special].filter(Boolean).length;
    return { len, upper, num, special, score };
  }, [password]);

  const strengthLabel =
    ["Weak", "Okay", "Good", "Strong", "Very strong"][rules.score] || "Weak";
  const strengthBarClasses = [
    "bg-red-400",
    "bg-yellow-400",
    "bg-amber-500",
    "bg-green-500",
    "bg-emerald-600",
  ];

  const validToSubmit =
    token &&
    password &&
    confirm &&
    confirm === password &&
    rules.score >= 3 &&
    !!captchaToken;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setCaptchaError("");

    if (!token) return setMessage("Invalid or missing token.");
    if (!password) return setMessage("Please enter a password.");
    if (confirm !== password) return setMessage("Passwords do not match.");
    if (rules.score < 3)
      return setMessage("Please choose a stronger password (Good or better).");
    if (!captchaToken) {
      setCaptchaError("Please complete the CAPTCHA.");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post("/api/students/create-password", {
        token,
        password,
        captchaToken,
      });

      if (data?.success) {
        setMessage("✅ Password created! Redirecting to login…");
        try {
          recaptchaRef.current?.reset();
        } catch {}
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setMessage(data?.message || "Failed to create password.");
        console.log(data);
        if ((data?.message || "").toLowerCase().includes("captcha")) {
          recaptchaRef.current?.reset?.();
          setCaptchaToken(null);
          setCaptchaError("CAPTCHA failed. Please try again.");
        }
        setSubmitting(false);
      }
    } catch (err) {
      console.log(err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Network error.";
      setMessage(apiMsg);
      if (String(apiMsg).toLowerCase().includes("captcha")) {
        recaptchaRef.current?.reset?.();
        setCaptchaToken(null);
        setCaptchaError("CAPTCHA failed. Please try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-600/10 flex items-center justify-center">
            <ShieldCheck className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Create your password
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Secure your account with a strong password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-6">
          {!token && (
            <div className="mb-4 text-sm text-red-600 dark:text-red-400">
              Invalid or missing token. Please use the link from your email.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Strength meter */}
              <div className="mt-3">
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded ${
                        i < rules.score
                          ? strengthBarClasses[rules.score]
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Strength: <span className="font-medium">{strengthLabel}</span>
                </div>
              </div>

              {/* Checklist */}
              <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li
                  className={
                    rules.len ? "text-green-600 dark:text-green-400" : ""
                  }
                >
                  • At least 8 characters
                </li>
                <li
                  className={
                    rules.upper ? "text-green-600 dark:text-green-400" : ""
                  }
                >
                  • One uppercase letter (A–Z)
                </li>
                <li
                  className={
                    rules.num ? "text-green-600 dark:text-green-400" : ""
                  }
                >
                  • One number (0–9)
                </li>
                <li
                  className={
                    rules.special ? "text-green-600 dark:text-green-400" : ""
                  }
                >
                  • One special character (!@#$…)
                </li>
              </ul>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                    confirm && confirm !== password
                      ? "border-red-400 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-700 focus:ring-blue-500"
                  } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:border-transparent`}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {confirm && confirm !== password && (
                <p className="mt-1 text-xs text-red-600">
                  Passwords do not match.
                </p>
              )}
            </div>

            {/* CAPTCHA */}
            <div>
              <div className="dark:border-gray-700 p-3">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={
                    import.meta?.env?.VITE_RECAPTCHA_SITE_KEY ||
                    "6Lct7jwrAAAAAKAs2TjQQkso-V1lr_g-r86x6v8X"
                  }
                  onChange={(t) => {
                    setCaptchaToken(t);
                    setCaptchaError("");
                  }}
                  onExpired={() => {
                    setCaptchaToken(null);
                    setCaptchaError("CAPTCHA expired. Please try again.");
                  }}
                />
              </div>
              {captchaError && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  {captchaError}
                </p>
              )}
            </div>

            {/* Messages */}
            {message && (
              <div
                className={`text-sm rounded-md px-3 py-2 ${
                  message.startsWith("✅")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!validToSubmit || submitting}
              className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium transition
                ${
                  !validToSubmit || submitting
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
                  Setting Password…
                </>
              ) : (
                "Set Password"
              )}
            </button>

            <p className="text-[11px] text-center text-gray-500">
              By continuing, you agree to our terms and privacy policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
