import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import {
  Bell,
  Lock,
  Moon,
  Sun,
  Mail,
  Globe,
  Plus,
  X,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import { updatePassword } from "firebase/auth";
import { showToast } from "../../components/Toast";
import { updateBookingMajors } from "../../services/bookingOptionsService";
import { getTeacherById } from "../../services/teacherService";

function TeacherSettings() {
  const { currentUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [majorsSaving, setMajorsSaving] = useState(false);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    language: "english",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const [bookingMajors, setBookingMajors] = useState({
    lisans: [],
    yukseklisans: [],
  });
  const [newMajor, setNewMajor] = useState({ lisans: "", yukseklisans: "" });

  useEffect(() => {
    const teacherId = currentUser?._id;
    if (!teacherId) return;

    getTeacherById(teacherId)
      .then((t) => {
        const opts = t?.bookingOptions || { lisans: [], yukseklisans: [] };
        setBookingMajors({
          lisans: Array.isArray(opts.lisans) ? opts.lisans : [],
          yukseklisans: Array.isArray(opts.yukseklisans)
            ? opts.yukseklisans
            : [],
        });
      })
      .catch(() => {});
  }, [currentUser]);

  // --- Handlers
  const handleSettingChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Mevcut şifre zorunludur";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "Yeni şifre zorunludur";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Yeni şifre en az 6 karakter olmalıdır";
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Şifreler eşleşmiyor";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsLoading(true);
    try {
      // Not: Firebase çoğunlukla yeniden kimlik doğrulaması ister
      await updatePassword(currentUser, passwordForm.newPassword);
      showToast("success", "Şifre başarıyla güncellendi");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      let errorMessage = "Şifre güncellenemedi";
      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Şifrenizi değiştirmeden önce lütfen tekrar oturum açın";
      }
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    // Persist here if you add backend support
    showToast("success", "Ayarlar kaydedildi");
  };

  const addMajor = (level) => {
    const val = newMajor[level].trim();
    if (!val) return;
    setBookingMajors((prev) => ({
      ...prev,
      [level]: Array.from(new Set([...(prev[level] || []), val])),
    }));
    setNewMajor((p) => ({ ...p, [level]: "" }));
  };

  const removeMajor = (level, val) => {
    setBookingMajors((prev) => ({
      ...prev,
      [level]: prev[level].filter((x) => x !== val),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Ayarlar
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hesap, görünüm ve randevu seçeneklerini yönetin.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {/* Appearance */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <header className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Moon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Görünüm
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Uygulamanın görünümünü özelleştirin
              </p>
            </div>
          </header>

          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  {darkMode ? (
                    <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {darkMode ? "Koyu Mod" : "Açık Mod"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Göz yormayan bir görünüm için koyu modu kullanın.
                  </p>
                </div>
              </div>

              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-12 items-center rounded-full transition
                  ${darkMode ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    darkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <header className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Bildirimler
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bildirimleri nasıl alacağınızı yapılandırın
              </p>
            </div>
          </header>

          <div className="px-6 py-6 space-y-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="emailNotifications"
                name="emailNotifications"
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={handleSettingChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  E-posta bildirimleri
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Öğrenciler randevu aldığında, iptal ettiğinde veya
                  değiştirdiğinde e-posta alın.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="pushNotifications"
                name="pushNotifications"
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={handleSettingChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Anlık bildirimler
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Önemli olaylar için tarayıcı bildirimleri alın.
                </p>
              </div>
            </label>

            <div className="pt-2 text-right">
              <button
                onClick={handleSaveSettings}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ayarları kaydet
              </button>
            </div>
          </div>
        </section>

        {/* Language */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <header className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Dil ve Bölge
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tercih ettiğiniz dili ayarlayın
              </p>
            </div>
          </header>

          <div className="px-6 py-6">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dil
              </label>
              <select
                id="language"
                name="language"
                value={settings.language}
                onChange={handleSettingChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="english">English</option>
                <option value="turkish">Türkçe</option>
              </select>
            </div>

            <div className="pt-4 text-right">
              <button
                onClick={handleSaveSettings}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ayarları kaydet
              </button>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <header className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/30">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Güvenlik
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hesap güvenliği ayarlarınızı yönetin
              </p>
            </div>
          </header>

          <div className="px-6 py-6">
            <form
              onSubmit={handlePasswordSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Current */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mevcut şifre
                </label>
                <div className="mt-1 relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showPass.current ? "text" : "password"}
                    autoComplete="current-password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 ${
                      passwordErrors.currentPassword
                        ? "border-red-300"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPass((p) => ({ ...p, current: !p.current }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label="Şifreyi göster/gizle"
                  >
                    {showPass.current ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yeni şifre
                </label>
                <div className="mt-1 relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPass.next ? "text" : "password"}
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 ${
                      passwordErrors.newPassword
                        ? "border-red-300"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPass((p) => ({ ...p, next: !p.next }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label="Şifreyi göster/gizle"
                  >
                    {showPass.next ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yeni şifreyi doğrulayın
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPass.confirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 ${
                      passwordErrors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPass((p) => ({ ...p, confirm: !p.confirm }))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label="Şifreyi göster/gizle"
                  >
                    {showPass.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Güncelleniyor...
                    </>
                  ) : (
                    "Şifreyi değiştir"
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Booking majors */}
        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <header className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Randevu Seçenekleri (Seviyeye Göre Bölümler)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Eğitim seviyesine göre öğrencilerin seçebileceği “Alan/Bölüm”
              seçeneklerini yapılandırın.
            </p>
          </header>

          <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {["lisans", "yukseklisans"].map((level) => (
              <div
                key={level}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold capitalize text-gray-900 dark:text-gray-100">
                    {level}
                  </h4>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMajor[level]}
                    onChange={(e) =>
                      setNewMajor((p) => ({ ...p, [level]: e.target.value }))
                    }
                    placeholder={`${level} bölüm ekle...`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMajor(level);
                      }
                    }}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => addMajor(level)}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" /> Ekle
                  </button>
                </div>

                {bookingMajors[level]?.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {bookingMajors[level].map((m) => (
                      <li
                        key={m}
                        className="group inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1 text-sm text-gray-800 dark:text-gray-100"
                      >
                        <span className="truncate max-w-[180px]">{m}</span>
                        <button
                          type="button"
                          onClick={() => removeMajor(level, m)}
                          className="rounded-full p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                          aria-label="Kaldır"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Henüz bölüm yok.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 text-right">
            <button
              disabled={majorsSaving}
              onClick={async () => {
                try {
                  setMajorsSaving(true);
                  const teacherId = currentUser?._id;
                  await updateBookingMajors(teacherId, {
                    lisans: bookingMajors.lisans,
                    yukseklisans: bookingMajors.yukseklisans,
                  });
                  showToast("success", "Randevu seçenekleri kaydedildi");
                } catch (e) {
                  console.log(e);
                  showToast("error", "Randevu seçenekleri kaydedilemedi");
                } finally {
                  setMajorsSaving(false);
                }
              }}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {majorsSaving
                ? "Kaydediliyor..."
                : "Randevu seçeneklerini kaydet"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default TeacherSettings;
