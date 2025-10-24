import React, { useCallback, useMemo, useState } from "react";
import api from "../../lib/axios";
import {
  UserPlus,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  RefreshCcw,
  GraduationCap,
} from "lucide-react";

export default function Dashboard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState({ type: null, message: "" });

  const emailValid = useMemo(() => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const errors = useMemo(() => {
    const e = {};
    if (!name?.trim()) e.name = "Lütfen öğrenci adı girin.";
    if (!email?.trim()) e.email = "Lütfen e-posta girin.";
    else if (!emailValid) e.email = "Geçerli bir e-posta girin.";
    return e;
  }, [name, email, emailValid]);

  const hasErrors = Object.keys(errors).length > 0;

  const resetForm = useCallback(() => {
    setName("");
    setEmail("");
    setBanner({ type: null, message: "" });
  }, []);

  const handleAddStudent = async (e) => {
    e?.preventDefault?.();
    setBanner({ type: null, message: "" });

    if (hasErrors) {
      setBanner({
        type: "error",
        message: errors.name || errors.email || "Form hatası.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/api/teachers/add-student", {
        name: name.trim(),
        email: email.trim(),
      });
      if (res.status === 200 || res.status === 201) {
        console.log(res);
        setBanner({
          type: "success",
          message: res.data.message || "Davet e-postası öğrenciye gönderildi.",
        });
        setName("");
        setEmail("");
      } else {
        setBanner({ type: "error", message: "Öğrenci eklenemedi." });
      }
    } catch (err) {
      console.log(err);
      setBanner({
        type: "error",
        message: err?.response?.data?.message || "Ağ hatası oluştu.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-red-600/10 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Öğrenci Daveti
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Doğru e-posta adresi kullandığınızdan emin olun.
            </p>
          </div>
        </div>

        {/* Banner */}
        {banner.type && (
          <div
            className={`px-6 py-3 border-b ${
              banner.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {banner.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{banner.message}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAddStudent} className="px-6 py-6">
          <div className="grid grid-cols-1 gap-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Öğrenci Adı
              </label>
              <div className={`relative`}>
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  placeholder="Örn: Abdelrahman Zourob"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500
                    ${
                      errors.name
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                />
              </div>
              {errors.name ? (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Lütfen tam adını giriniz.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Öğrenci E-posta
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Örn: abdelrahman.zourob.mdbf22@iste.edu.tr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500
                    ${
                      errors.email
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                />
              </div>
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Davet bu adrese gönderilir.
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Info className="h-4 w-4 mt-0.5" />
              <p>
                Davet e-postası, öğrencinin hesabını oluşturması için bağlantı
                içerir. Yanlış e-postaya gönderim yapmamak için lütfen bilgileri
                kontrol edin.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gönderiliyor…
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Öğrenci Ekle
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={submitting || (!name && !email)}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
              >
                <RefreshCcw className="h-4 w-4" />
                Temizle
              </button>
            </div>
          </div>
        </form>
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        İpucu: Formu doldurduktan sonra <kbd>Enter</kbd> ile de
        gönderebilirsiniz.
      </p>
    </div>
  );
}
