import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  Users,
  Shield,
  X,
  User,
} from "lucide-react";
import api from "../../lib/axios";
import { showToast } from "../../components/Toast";

/* ------------------------------ API ------------------------------ */
const adminApi = {
  list: (q = "") =>
    api.get(`/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  create: (payload) => api.post("/api/users", payload),
  update: (id, payload) => api.put(`/api/users/${id}`, payload),
  remove: (id) => api.delete(`/api/users/${id}`),
};

/* ------------------------------ Helpers ------------------------------ */
const ROLES = ["admin", "teacher"];

const roleStyles = {
  admin:
    "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-200 dark:border-purple-900/40",
  teacher:
    "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-900/40",
  student:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-200 dark:border-emerald-900/40",
};

const RoleBadge = ({ role }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
      roleStyles[role] || ""
    }`}
  >
    {role}
  </span>
);

/* ------------------------------ Confirm Modal ------------------------------ */
function ConfirmModal({
  open,
  title,
  desc,
  confirmText = "Sil",
  onClose,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
          <div className="px-5 pt-5">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h4>
            {desc ? (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {desc}
              </p>
            ) : null}
          </div>
          <div className="px-5 py-4 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              İptal
            </button>
            <button
              onClick={onConfirm}
              className="px-3 py-1.5 rounded-lg text-sm bg-rose-600 hover:bg-rose-700 text-white"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ User Form ------------------------------ */
function UserForm({ initial, onCancel, onSave }) {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState(
    initial || { displayName: "", email: "", role: "teacher", password: "" }
  );
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});

  const errors = useMemo(() => {
    const e = {};
    if (!form.displayName.trim()) e.displayName = "Ad soyad zorunludur.";
    if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "Geçerli bir e-posta girin.";
    if (!ROLES.includes(form.role)) e.role = "Geçersiz rol.";
    if (!isEdit && !form.password) e.password = "Geçici şifre zorunludur.";
    if (!isEdit && form.password && form.password.length < 6)
      e.password = "En az 6 karakter olmalı.";
    return e;
  }, [form, isEdit]);

  const hasError = (k) => touched[k] && errors[k];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({
      displayName: true,
      email: true,
      role: true,
      ...(isEdit ? {} : { password: true }),
    });
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Ad Soyad
        </label>
        <input
          name="displayName"
          value={form.displayName}
          onChange={handleChange}
          onBlur={() => setTouched((p) => ({ ...p, displayName: true }))}
          className={`mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            ${
              hasError("displayName")
                ? "border-rose-400"
                : "border-gray-300 dark:border-gray-700"
            }`}
          placeholder="Örn: Ahmet Yılmaz"
        />
        {hasError("displayName") && (
          <p className="mt-1 text-xs text-rose-500">{errors.displayName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          E-posta
        </label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          onBlur={() => setTouched((p) => ({ ...p, email: true }))}
          disabled={isEdit}
          className={`mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-60
            ${
              hasError("email")
                ? "border-rose-400"
                : "border-gray-300 dark:border-gray-700"
            }`}
          placeholder="ahmet@uni.edu.tr"
        />
        {hasError("email") && (
          <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
        )}
      </div>

      {/* Role + password */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Rol
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            onBlur={() => setTouched((p) => ({ ...p, role: true }))}
            className={`mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
              ${
                hasError("role")
                  ? "border-rose-400"
                  : "border-gray-300 dark:border-gray-700"
              }`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {hasError("role") && (
            <p className="mt-1 text-xs text-rose-500">{errors.role}</p>
          )}
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Geçici Şifre
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              onBlur={() => setTouched((p) => ({ ...p, password: true }))}
              className={`mt-1 w-full rounded-lg border px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                ${
                  hasError("password")
                    ? "border-rose-400"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              placeholder="En az 6 karakter"
            />
            {hasError("password") && (
              <p className="mt-1 text-xs text-rose-500">{errors.password}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`px-3 py-1.5 rounded-lg text-white text-sm ${
            saving ? "bg-indigo-600/70" : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {isEdit ? "Kaydet" : "Ekle"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------ Page ------------------------------ */
export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null); // null | {} new | doc
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const debounceRef = useRef(null);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.list(q.trim());
      setItems(data?.items ?? data ?? []);
    } catch (err) {
      console.error(err);
      showToast("error", "Kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchList, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async (payload) => {
    try {
      await adminApi.create(payload);
      showToast("success", "Kullanıcı eklendi.");
      setEditing(null);
      fetchList();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Kullanıcı eklenemedi.";
      showToast("error", msg);
    }
  };

  const onUpdate = async (payload) => {
    try {
      await adminApi.update(editing._id, payload);
      showToast("success", "Kullanıcı güncellendi.");
      setEditing(null);
      fetchList();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Kullanıcı güncellenemedi.";
      showToast("error", msg);
    }
  };

  const confirmDelete = (id) => setConfirm({ open: true, id });
  const onDelete = async () => {
    const id = confirm.id;
    setConfirm({ open: false, id: null });
    try {
      await adminApi.remove(id);
      showToast("success", "Kullanıcı silindi.");
      fetchList();
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Kullanıcı silinemedi.";
      showToast("error", msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <User className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Yönetim · Kullanıcılar
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Admin, öğretim üyesi ve öğrenci hesaplarını yönetin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing({})}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kullanıcı
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className=" mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 animate-pulse"
                    >
                      <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                      <div className="h-3 w-1/2 mt-3 rounded bg-gray-200 dark:bg-gray-800" />
                      <div className="h-8 mt-4 rounded bg-gray-200 dark:bg-gray-800" />
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Kayıt bulunamadı
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Farklı bir arama deneyin veya yeni kullanıcı ekleyin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                  {items.map((u) => (
                    <div
                      key={u._id}
                      className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {u.displayName}
                            </h4>
                            <RoleBadge role={u.role} />
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {u.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            title="Düzenle"
                            onClick={() => setEditing(u)}
                            className="p-2 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Sil"
                            onClick={() => confirmDelete(u._id)}
                            className="p-2 rounded-md border text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Form panel */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {editing?._id
                    ? "Kullanıcıyı Düzenle"
                    : editing
                    ? "Yeni Kullanıcı"
                    : "Seçim yapın"}
                </h3>
                {editing && (
                  <button
                    onClick={() => setEditing(null)}
                    className="p-1 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800"
                    title="Kapat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!editing ? (
                <p className="mt-2 text-xs text-gray-500">
                  Yeni kullanıcı eklemek veya bir kullanıcıyı düzenlemek için
                  üstten “Yeni Kullanıcı”ya basın ya da listedeki kalem
                  simgesini kullanın.
                </p>
              ) : (
                <div className="mt-4">
                  <UserForm
                    initial={editing?._id ? editing : null}
                    onCancel={() => setEditing(null)}
                    onSave={(payload) =>
                      editing?._id ? onUpdate(payload) : onCreate(payload)
                    }
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Confirm delete */}
      <ConfirmModal
        open={confirm.open}
        title="Bu kullanıcı silinsin mi?"
        desc="Bu işlem geri alınamaz."
        confirmText="Evet, sil"
        onClose={() => setConfirm({ open: false, id: null })}
        onConfirm={onDelete}
      />
    </div>
  );
}
