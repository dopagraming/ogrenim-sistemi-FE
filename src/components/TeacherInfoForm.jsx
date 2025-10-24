// src/components/TeacherInfoForm.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  Book,
  MapPin,
  Briefcase,
  Image as ImageIcon,
  Link as LinkIcon,
  Key as KeyIcon,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  X,
  GraduationCap,
  Building2,
} from "lucide-react";
import { updateTeacherProfile } from "../services/teacherService";
import { showToast } from "./Toast";
import api from "../lib/axios";

/* --- Options --- */
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
  "Bilgisayar Mühendislik",
];

function TeacherInfoForm({ teacherData }) {
  const { currentUser, userProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    faculty: "",
    department: "",
    office: "",
    bio: "",
    photoURL: "",
    scholarProfileUrl: "",
    scholarUserId: "",
  });

  // ---- Helpers ----
  const extractScholarUserId = (url) => {
    if (!url) return "";
    try {
      const match = url.match(/[?&]user=([^&]+)/i);
      if (match && match[1]) return decodeURIComponent(match[1]);
      const u = new URL(url);
      const user = u.searchParams.get("user");
      return user || "";
    } catch {
      const m = String(url).match(/user=([^&\s]+)/i);
      return m?.[1] || "";
    }
  };

  const scholarLinkValid = useMemo(() => {
    if (!formData.scholarProfileUrl) return false;
    try {
      const u = new URL(formData.scholarProfileUrl);
      return (
        /scholar\.google\./i.test(u.hostname) && !!u.searchParams.get("user")
      );
    } catch {
      return false;
    }
  }, [formData.scholarProfileUrl]);

  const errors = useMemo(() => {
    const e = {};
    if (!formData.displayName.trim()) e.displayName = "Ad soyad zorunludur.";
    if (!formData.email) e.email = "E-posta zorunludur.";
    if (formData.photoURL && !/^https?:\/\//i.test(formData.photoURL))
      e.photoURL = "Fotoğraf URL’si http:// veya https:// ile başlamalıdır.";
    if (
      formData.scholarProfileUrl &&
      !/^https?:\/\//i.test(formData.scholarProfileUrl)
    )
      e.scholarProfileUrl =
        "Profil URL’si http:// veya https:// ile başlamalıdır.";
    if (formData.phone && !/^[\d\s+().-]{6,}$/.test(formData.phone))
      e.phone = "Lütfen geçerli bir telefon numarası girin.";
    if (formData.bio && formData.bio.length > 1000)
      e.bio = "Biyografi 1000 karakteri aşamaz.";
    // if (!formData.faculty) e.faculty = "Fakülte zorunludur.";
    // if (!formData.department) e.department = "Bölüm zorunludur.";
    return e;
  }, [formData]);

  const hasError = (name) => !!errors[name] && touched[name];

  useEffect(() => {
    const data = teacherData || userProfile || {};
    const initialPhoto = data.photoURL || "";
    setFormData((prev) => ({
      ...prev,
      displayName: data.displayName || currentUser?.displayName || "",
      email: data.email || currentUser?.email || "",
      phone: data.phone || "",
      faculty: data.faculty || "",
      department: data.department || "",
      office: data.office || "",
      bio: data.bio || "",
      photoURL: initialPhoto,
      scholarProfileUrl: data.scholarProfileUrl || "",
      scholarUserId:
        data.scholarUserId ||
        extractScholarUserId(data.scholarProfileUrl || "") ||
        "",
    }));
    setPhotoPreviewUrl(initialPhoto || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherData, userProfile, currentUser]);

  // ---- Handlers ----
  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (["displayName", "department", "office", "faculty"].includes(name)) {
      v = v.replace(/^\s+/, "");
    }
    let next = { ...formData, [name]: v };
    if (name === "scholarProfileUrl") {
      const autoId = extractScholarUserId(v);
      if (autoId) next.scholarUserId = autoId;
    }
    if (name === "photoURL") {
      setSelectedPhotoFile(null);
      setPhotoPreviewUrl(v);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setFormData(next);
  };

  const onBlur = (e) => setTouched((p) => ({ ...p, [e.target.name]: true }));

  const onPickPhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedPhotoFile(null);
      return;
    }
    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!okTypes.includes(file.type)) {
      showToast("error", "Sadece JPG, PNG, WEBP veya GIF yükleyin.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Max 5MB fotoğraf yükleyebilirsiniz.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setFormData((p) => ({ ...p, photoURL: "" }));
  };

  const clearSelectedPhoto = () => {
    setSelectedPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPhotoPreviewUrl(formData.photoURL || "");
  };

  const uploadAvatarIfNeeded = async () => {
    if (!selectedPhotoFile) return formData.photoURL?.trim() || "";
    const form = new FormData();
    form.append("image", selectedPhotoFile);
    const { data } = await api.post("/api/auth/profile/photo", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.url || "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      displayName: true,
      email: true,
      phone: true,
      faculty: true,
      department: true,
      office: true,
      bio: true,
      photoURL: true,
      scholarProfileUrl: true,
      scholarUserId: true,
    });
    if (Object.keys(errors).length) {
      showToast("error", "Lütfen vurgulanan alanları düzeltin.");
      return;
    }
    setIsLoading(true);
    try {
      const finalPhotoURL = await uploadAvatarIfNeeded();

      await updateTeacherProfile(currentUser._id, {
        ...formData,
        photoURL: finalPhotoURL,
      });

      showToast("success", "Profil başarıyla güncellendi");
      setPhotoPreviewUrl(finalPhotoURL || "");
      setSelectedPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("error", "Profil güncellenemedi");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- UI ----
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="px-6 pb-6">
          {/* Identity Section */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Kimlik
            </h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ad Soyad <span className="text-rose-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className={`block w-full pl-10 pr-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border ${
                      hasError("displayName")
                        ? "border-rose-400"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                    placeholder="John Doe"
                    required
                  />
                </div>
                {hasError("displayName") && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.displayName}
                  </p>
                )}
              </div>

              {/* Email (disabled) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-posta adresi
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className="block w-full pl-10 pr-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                    placeholder="john@example.com"
                    disabled
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  E-posta değiştirilemez.
                </p>
              </div>

              {/* Faculty (select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fakülte
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className={`block w-full pl-10 pr-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border ${
                      hasError("faculty")
                        ? "border-rose-400"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <option value="">Seçiniz</option>
                    {FACULTIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                {hasError("faculty") && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.faculty}
                  </p>
                )}
              </div>

              {/* Department (select; change to input if you want free text) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bölüm
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className={`block w-full pl-10 pr-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border ${
                      hasError("department")
                        ? "border-rose-400"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <option value="">Seçiniz</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {/* If you prefer free text instead, replace the select above with:
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className="block w-full pl-10 pr-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border border-gray-300 dark:border-gray-700"
                    placeholder="Bilgisayar Mühendisliği"
                  /> */}
                </div>
                {hasError("department") && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.department}
                  </p>
                )}
              </div>

              {/* Office */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ofis konumu
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="office"
                    value={formData.office}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className="block w-full pl-10 pr-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border border-gray-300 dark:border-gray-700"
                    placeholder="A Blok, Oda 101"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefon numarası
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className={`block w-full pl-10 pr-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border ${
                      hasError("phone")
                        ? "border-rose-400"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                    placeholder="+90 555 555 55 55"
                  />
                </div>
                {hasError("phone") && (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Photo URL + File Upload */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Profil Fotoğrafı (URL veya Yükleme)
                </label>

                {/* URL input */}
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    name="photoURL"
                    value={formData.photoURL}
                    onChange={handleChange}
                    onBlur={onBlur}
                    placeholder="https://example.com/your-photo.jpg"
                    className={`block w-full pl-10 pr-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border ${
                      hasError("photoURL")
                        ? "border-rose-400"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                </div>
                {hasError("photoURL") ? (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.photoURL}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    URL girin veya aşağıdan bir dosya seçin (en fazla 5MB).
                  </p>
                )}

                {/* File input + preview row */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                  <div className="sm:col-span-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={onPickPhotoFile}
                      className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 focus:outline-none"
                    />
                  </div>

                  <div className="relative">
                    {/* Preview */}
                    <div className="h-20 w-20 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 mx-auto">
                      {photoPreviewUrl ? (
                        <img
                          src={photoPreviewUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {(selectedPhotoFile || formData.photoURL) && (
                      <button
                        type="button"
                        onClick={clearSelectedPhoto}
                        title="Önizlemeyi temizle"
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow hover:bg-gray-50"
                      >
                        <X className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Biyografi
            </h4>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <Book className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                name="bio"
                rows={5}
                value={formData.bio}
                onChange={handleChange}
                onBlur={onBlur}
                maxLength={1000}
                className={`block w-full pl-10 pr-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border ${
                  hasError("bio")
                    ? "border-rose-400"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                placeholder="Öğrencilere uzmanlık alanlarınızı, ilgi alanlarınızı ve öğretim yaklaşımınızı anlatın…"
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              {hasError("bio") ? (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.bio}
                </p>
              ) : (
                <span className="text-xs text-gray-500">
                  {formData.bio.length}/1000
                </span>
              )}
            </div>
          </div>

          {/* Google Scholar Section */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Google Scholar
            </h4>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {/* Scholar URL */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scholar Profil URL’si
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <LinkIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    name="scholarProfileUrl"
                    value={formData.scholarProfileUrl}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className={`block w-full pl-10 pr-10 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border ${
                      hasError("scholarProfileUrl")
                        ? "border-rose-400"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                    placeholder="https://scholar.google.com/citations?user=jc-TC-kAAAAJ&hl=tr"
                  />
                  {scholarLinkValid && (
                    <a
                      href={formData.scholarProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Profili aç"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {hasError("scholarProfileUrl") ? (
                  <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.scholarProfileUrl}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    <code>user=...</code> değeri otomatik olarak çıkarılacaktır.
                  </p>
                )}
              </div>

              {/* Scholar user id */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scholar Kullanıcı Kimliği
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="scholarUserId"
                    value={formData.scholarUserId}
                    onChange={handleChange}
                    onBlur={onBlur}
                    className="block w-full pl-10 pr-3 py-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 border border-gray-300 dark:border-gray-700"
                    placeholder="jc-TC-kAAAAJ"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Gerekirse elle düzenleyebilirsiniz.
                </p>
                {formData.scholarUserId ? (
                  <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Algılandı: <code>{formData.scholarUserId}</code>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky footer actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 rounded-b-2xl flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? (
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
                  />
                </svg>
                Kaydediliyor…
              </>
            ) : (
              "Değişiklikleri Kaydet"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

export default TeacherInfoForm;
