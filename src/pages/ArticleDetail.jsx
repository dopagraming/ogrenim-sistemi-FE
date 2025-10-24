import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import api from "../lib/axios";

const IconBack = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19l-7-7 7-7"
    />
  </svg>
);
const IconShare = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7"
    />
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 6l-4-4-4 4"
    />
    <path
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2v13"
    />
  </svg>
);

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await api(`/api/content/${id}`);
        setArticle(res.data);
        if (res.data?.title) document.title = `${res.data.title} — Duyuru`;
      } catch (err) {
        console.error("Makale yüklenemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchArticle();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const el = contentRef.current;
      const rect = el.getBoundingClientRect();
      const visibleHeight =
        Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
      const totalHeight = el.scrollHeight;
      const scrolled = Math.min(
        Math.max(window.scrollY - (el.offsetTop - 80), 0),
        totalHeight
      );
      const pct =
        totalHeight > 0 ? Math.round((scrolled / totalHeight) * 100) : 0;
      const fallback = Math.round(
        ((window.innerHeight - rect.top) / (rect.height || 1)) * 100
      );
      setProgress(
        Math.max(
          0,
          Math.min(100, Number.isFinite(pct) && pct >= 0 ? pct : fallback)
        )
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [article]);

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link kopyalandı!");
    } catch {
      prompt("Kopyalamak için linki kopyalayın:", url);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("tr-TR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="h-1 bg-gray-200 rounded-full mb-6 animate-pulse" />
        <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm p-6 animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3" />
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Makale bulunamadı.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-pink-500 to-yellow-400"
          style={{ width: `${progress}%`, transition: "width 200ms linear" }}
        />
      </div>

      <article className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden">
        {article.image ? (
          <div className="relative h-72 sm:h-96">
            <img
              src={article.image}
              alt={article.title || "duyuru"}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute left-6 bottom-6 right-6 flex items-center justify-between">
              <div>
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm px-3 py-2 rounded-md text-sm"
                  aria-label="Geri"
                >
                  <IconBack /> Geri
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-md text-sm"
                  aria-label="Paylaş"
                >
                  <IconShare /> Paylaş
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md text-sm"
            >
              <IconBack /> Geri
            </button>
          </div>
        )}

        <div className="px-6 py-8">
          <header className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {article.title}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  {article.author && (
                    <span>
                      Yazar:{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {article.author}
                      </span>
                    </span>
                  )}
                  <span>{formatDate(article.createdAt)}</span>
                  {article.readingTime && (
                    <span>• {article.readingTime} dk okuma</span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(article.tags || []).slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <div
            ref={contentRef}
            className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 break-words"
            style={
              {
                // nice drop cap for first letter
                // tailwind first-letter support would require plugin; use inline style
                // this gives a subtle drop cap effect
              }
            }
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(article.html || ""),
            }}
          />

          <footer className="mt-10 border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <button
                  onClick={copyLink}
                  className="px-4 py-2 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 text-sm"
                >
                  Linki Kopyala
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              {article.updatedAt
                ? `Güncellendi: ${formatDate(article.updatedAt)}`
                : ""}
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}

export default ArticleDetail;
