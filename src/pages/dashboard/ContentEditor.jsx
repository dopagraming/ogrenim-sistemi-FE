// src/pages/admin/AdminEditor.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/axios";
import { showToast } from "../../components/Toast";
import DOMPurify from "dompurify";

// TipTap
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

// UI
import { PencilLine, Image as ImageIcon } from "lucide-react";

const ToolbarButton = ({ active, onClick, title, children, disabled }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={`h-9 px-3 rounded-lg border text-sm transition
      ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-gray-50 dark:hover:bg-gray-700"
      }
      ${
        active
          ? "bg-[#d93559] text-white border-[#d93559]"
          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100"
      }`}
  >
    {children}
  </button>
);

export default function AdminEditor({ initialContent = "" }) {
  const { currentUser } = useAuth();
  const { teacherId } = useParams(); // optional if you need it elsewhere

  const {
    handleSubmit: rhfHandleSubmit,
    setValue,
    reset,
    watch,
    register,
    formState: { errors },
  } = useForm({
    defaultValues: { title: "", image: "", content: initialContent },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [articles, setArticles] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: initialContent || "<p></p>",
    onUpdate({ editor }) {
      setValue("content", editor.getHTML(), { shouldDirty: true });
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 min-h-[320px] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && typeof initialContent === "string") {
      editor.commands.setContent(initialContent || "<p></p>");
      setValue("content", initialContent || "<p></p>", { shouldDirty: false });
    }
  }, [initialContent, editor, setValue]);

  const fetchArticles = async () => {
    try {
      setLoadingList(true);
      const res = await api.get(`/api/content/${currentUser._id}/articles`);
      setArticles(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      showToast("error", e?.data?.message || "Makaleler yüklenemedi.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]); // triggers reload if you navigate by teacher

  // Helpers
  const isEmptyHtml = (html) => {
    if (!html) return true;
    const cleaned = html
      .replace(/<p><br><\/p>/gi, "")
      .replace(/<p><\/p>/gi, "")
      .replace(/\s|&nbsp;|<br\/?>/gi, "");
    return cleaned === "" || cleaned === "<p></p>";
  };

  const uploadImageFile = async (file) => {
    const form = new FormData();
    form.append("image", file);
    const { data } = await api.post("/api/content/upload-image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.url;
  };

  const onSubmit = async (data) => {
    if (!data.title?.trim()) {
      showToast("error", "Lütfen başlık giriniz.");
      return;
    }
    if (!data.content || isEmptyHtml(data.content)) {
      showToast("error", "Lütfen açıklama giriniz.");
      return;
    }

    const safeHtml = DOMPurify.sanitize(data.content);

    setIsSaving(true);
    try {
      let finalImageUrl = data.image?.trim() || "";

      // If a file is selected, upload it and override the final URL
      if (selectedFile) {
        const uploadedUrl = await uploadImageFile(selectedFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      await api.post(`/api/content/articles`, {
        title: data.title.trim(),
        image: finalImageUrl,
        html: safeHtml,
      });

      showToast("success", "İçerik başarıyla kaydedildi!");
      editor?.commands.setContent("<p></p>");
      reset({ title: "", image: "", content: "" });
      setSelectedFile(null);

      fetchArticles();
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (e) {
      console.error(e);
      showToast("error", "İçerik kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Bu içeriği silmek istediğinizden emin misiniz?");
    if (!ok) return;
    try {
      await api.delete(`/api/content/${currentUser._id}/articles/${id}`);
      showToast("success", "İçerik silindi.");
      fetchArticles();
    } catch (e) {
      console.error(e);
      showToast("error", "Silme işlemi başarısız oldu.");
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        rhfHandleSubmit(onSubmit)();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rhfHandleSubmit, onSubmit]);

  const contentHtml = watch("content");
  const watchImage = watch("image");

  const wordCount = useMemo(() => {
    const text = DOMPurify.sanitize(contentHtml || "", { ALLOWED_TAGS: [] })
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return 0;
    return text.split(" ").length;
  }, [contentHtml]);

  if (!editor) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <PencilLine className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Yeni İçerik Ekle
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Başlık ve görsel ekleyin; açıklamayı editörde yazın.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meta fields */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Başlık <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Makale başlığı"
              {...register("title", { required: true, maxLength: 180 })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-[#d93559]"
            />
            {errors.title?.type === "required" && (
              <p className="mt-1 text-xs text-red-500">Başlık zorunludur.</p>
            )}
            {errors.title?.type === "maxLength" && (
              <p className="mt-1 text-xs text-red-500">
                Başlık 180 karakteri geçmemelidir.
              </p>
            )}
          </div>

          {/* Image URL + Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Görsel (URL veya Yükleme)
            </label>

            {/* URL input */}
            <input
              type="url"
              placeholder="https://… (URL girilebilir)"
              {...register("image")}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-[#d93559]"
            />

            {/* File upload */}
            <div className="mt-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setSelectedFile(file || null);
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                En fazla 5MB. Desteklenen türler: JPG, PNG, WEBP, GIF.
              </p>
            </div>

            {/* Preview */}
            <div className="mt-3">
              {selectedFile ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-36 object-cover"
                  />
                </div>
              ) : watchImage ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img
                    src={watchImage}
                    alt="Preview"
                    className="w-full h-36 object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              ) : (
                <div className="h-36 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 text-sm">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    URL girin veya dosya seçin
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-t border-gray-200 dark:border-gray-800">
          <div className="p-3 flex flex-wrap gap-2">
            <ToolbarButton
              title="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              Bold
            </ToolbarButton>
            <ToolbarButton
              title="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              Italic
            </ToolbarButton>
            <ToolbarButton
              title="Strike"
              active={editor.isActive("strike")}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              Strike
            </ToolbarButton>
            <span className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            <ToolbarButton
              title="Paragraf"
              active={editor.isActive("paragraph")}
              onClick={() => editor.chain().focus().setParagraph().run()}
            >
              P
            </ToolbarButton>
            <ToolbarButton
              title="Başlık H2"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              H2
            </ToolbarButton>
            <ToolbarButton
              title="Başlık H3"
              active={editor.isActive("heading", { level: 3 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
            >
              H3
            </ToolbarButton>
            <span className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            <ToolbarButton
              title="Madde işaretli liste"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              • List
            </ToolbarButton>
            <ToolbarButton
              title="Numaralı liste"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              1. List
            </ToolbarButton>
            <ToolbarButton
              title="Alıntı"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              “ Quote
            </ToolbarButton>
            <ToolbarButton
              title="Kod Bloğu"
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              {"</>"}
            </ToolbarButton>
            <span className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            <ToolbarButton
              title="Bağlantı ekle"
              active={editor.isActive("link")}
              onClick={() => {
                const url = window.prompt("Link URL:");
                if (!url) return;
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: url })
                  .run();
              }}
            >
              Link
            </ToolbarButton>
            <ToolbarButton
              title="Bağlantıyı kaldır"
              onClick={() => editor.chain().focus().unsetLink().run()}
            >
              Unlink
            </ToolbarButton>
            <ToolbarButton
              title="Görsel ekle"
              onClick={() => {
                const url = window.prompt("Görsel URL:");
                if (!url) return;
                editor.chain().focus().setImage({ src: url }).run();
              }}
            >
              Image
            </ToolbarButton>
            <span className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            <ToolbarButton
              title="Tüm biçimlendirmeyi temizle"
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
            >
              Clear
            </ToolbarButton>

            <div className="ml-auto flex gap-2">
              <ToolbarButton
                title="Geri al"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
              >
                Undo
              </ToolbarButton>
              <ToolbarButton
                title="İleri al"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
              >
                Redo
              </ToolbarButton>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="px-5 py-4">
          <div className="rounded-xl border-2 border-[#d93559] bg-white dark:bg-gray-900 p-4 min-h-[320px]">
            <EditorContent editor={editor} />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Kelime sayısı: {wordCount}</span>
            <span className="hidden sm:block">
              Kısayol: <kbd className="px-1 py-0.5 rounded border">Ctrl</kbd> +{" "}
              <kbd className="px-1 py-0.5 rounded border">S</kbd> (veya{" "}
              <kbd className="px-1 py-0.5 rounded border">⌘</kbd> +{" "}
              <kbd className="px-1 py-0.5 rounded border">S</kbd>) ile kaydet
            </span>
          </div>
        </div>

        {/* Save */}
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end">
          <button
            onClick={rhfHandleSubmit(onSubmit)}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white text-sm font-medium transition
              ${
                isSaving
                  ? "bg-[#d93559]/70 cursor-not-allowed"
                  : "bg-[#d93559] hover:bg-[#c12d4d]"
              }`}
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
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
                Kaydediliyor…
              </>
            ) : (
              "İçeriği Kaydet"
            )}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Mevcut İçerikler
        </h3>

        {loadingList ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-sm text-gray-500 dark:text-gray-400">
            Yükleniyor…
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Henüz içerik yok.
          </div>
        ) : (
          <ul className="space-y-3">
            {articles.map((a) => (
              <li
                key={a._id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  {a.image ? (
                    <img
                      src={a.image}
                      alt={a.title || "image"}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {a.title && (
                      <h4 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">
                        {a.title}
                      </h4>
                    )}
                    <div
                      className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-100"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(a.html || ""),
                      }}
                    />
                  </div>

                  <div className="shrink-0 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Load existing content into the form (creates a new copy on save)
                        setValue("title", a.title || "");
                        setValue("image", a.image || "");
                        editor.commands.setContent(a.html || "<p></p>");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="h-9 px-3 rounded-lg border text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      title="Düzenleyiciye yükle (yeni içerik olarak kaydedilir)"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a._id)}
                      className="h-9 px-3 rounded-lg text-sm bg-gray-900 text-white hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
