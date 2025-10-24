// src/pages/teacher/StudentUploader.jsx
import React, { useCallback, useRef, useState } from "react";
import api from "../../lib/axios";
import {
  Upload,
  FileSpreadsheet,
  Info,
  CheckCircle2,
  XCircle,
  Download,
  Loader2,
  RefreshCcw,
  User,
  File,
} from "lucide-react";

const ACCEPTED = [".xlsx", ".xls", ".csv"];
const MAX_MB = 10;

export default function StudentUploader() {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null); // { added: string[], skipped: string[] }
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const resetState = () => {
    setResult(null);
    setError("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateFile = (file) => {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      return `Desteklenmeyen dosya türü: ${ext}. İzin verilenler: ${ACCEPTED.join(
        ", "
      )}`;
    }
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_MB) {
      return `Dosya çok büyük (${sizeMB.toFixed(
        1
      )} MB). En fazla ${MAX_MB} MB.`;
    }
    return null;
  };

  const sendFile = async (file) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/api/teachers/upload", formData);
      setResult(data);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          "Yükleme başarısız. Lütfen tekrar deneyin."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDrop = useCallback(
    async (e) => {
      e.preventDefault();
      setDragOver(false);
      if (!e.dataTransfer.files?.length) return;
      await sendFile(e.dataTransfer.files[0]);
    },
    [] // eslint-disable-line
  );

  const onBrowseChange = async (e) => {
    if (!e.target.files?.[0]) return;
    await sendFile(e.target.files[0]);
  };

  const handleDownloadSample = () => {
    // Başlıklara göre: Gerekli başlıklar: name, number (büyük/küçük harf duyarsız).
    const rows = [
      ["name", "number"],
      ["abdelrahman zourob", "222523537"],
      ["ahmet mohammed", "222222222"],
    ];
    const csv = rows
      .map((r) =>
        r.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <File className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Öğrenci Bilgilerini Yükleyin
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Öğrenciler sizinle randevu alabilir
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info + Example */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Instructions */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-red-600/10 flex items-center justify-center">
              <Info className="h-4 w-4 text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Dosyanızın görünümü nasıl olmalı
            </h2>
          </div>

          <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
            <li>
              İlk satıra <b>bir başlık satırı</b> ekleyin.
            </li>
            <li>
              Gerekli başlıklar (büyük/küçük harf duyarsız): <b>name</b> ve{" "}
              <b>number</b>.
            </li>
            <li>Kabul edilen eşadlar (büyük/küçük harf duyarsız):</li>
          </ol>
          <ul className="mt-1 ml-6 text-sm text-gray-600 dark:text-gray-400 list-disc">
            <li>
              <b>name</b>: “name”, “student name”, “full name”, “full_name”,
              “studentname”
            </li>
            <li>
              <b>number</b>: “number”, “student number”, “id”, “student id”,
              “student_id”
            </li>
          </ul>

          <button
            onClick={handleDownloadSample}
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
          >
            <Download className="h-4 w-4" />
            Örnek indir (.csv)
          </button>
        </div>

        {/* Example preview */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-600/10 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Örnek satırlar
            </h2>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 text-xs font-medium bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-300">
              <div className="px-3 py-2">name</div>
              <div className="px-3 py-2">number</div>
            </div>
            {[
              ["abdelrahman zourob", "222523537"],
              ["ahmet mohammed", "222222222"],
            ].map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-2 border-t border-gray-200 dark:border-gray-700"
              >
                {row.map((cell, j) => (
                  <div
                    key={j}
                    className="px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Backend, sütunları harf konumuna göre değil, başlık adına
            (büyük/küçük harf duyarsız) göre eşleştirir.
          </p>
        </div>
      </div>

      {/* Upload Card */}
      <div className="rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        {/* Dropzone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition
            ${
              dragOver
                ? "border-red-500 bg-red-50/50 dark:bg-red-900/10"
                : "border-gray-300 dark:border-gray-700"
            }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-red-600/10 flex items-center justify-center mb-3">
              <Upload className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Dosyanızı buraya sürükleyip bırakın veya{" "}
              <button
                className="text-red-600 font-medium hover:underline"
                onClick={() => fileInputRef.current?.click()}
              >
                göz atın
              </button>
              .
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              İzin verilenler: {ACCEPTED.join(", ")} • En fazla {MAX_MB} MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              onChange={onBrowseChange}
              disabled={uploading}
              className="hidden"
            />
          </div>
        </div>

        {/* Selected file */}
        {fileName && (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            Seçilen: <span className="font-medium">{fileName}</span>
          </div>
        )}

        {/* Status */}
        <div className="mt-4 min-h-[24px]">
          {uploading && (
            <div className="inline-flex items-center gap-2 text-red-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">Yükleniyor…</span>
            </div>
          )}
          {error && (
            <div className="inline-flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultPanel
              tone="success"
              title={`Eklendi: ${result.added?.length || 0}`}
              items={result.added || []}
              prefix="Eklendi"
            />
            <ResultPanel
              tone="warn"
              title={`Atlandı (zaten mevcut): ${result.skipped?.length || 0}`}
              items={result.skipped || []}
              prefix="Zaten mevcut"
            />
          </div>
        )}

        {(result || error) && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={resetState}
              className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Sıfırla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Small presentational panel for results */
function ResultPanel({ tone = "success", title, items, prefix }) {
  const toneMap = {
    success: {
      border: "border-emerald-200 dark:border-emerald-900/40",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      text: "text-emerald-800 dark:text-emerald-200",
      iconColor: "text-emerald-700 dark:text-emerald-300",
      Icon: CheckCircle2,
    },
    warn: {
      border: "border-amber-200 dark:border-amber-900/40",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-800 dark:text-amber-200",
      iconColor: "text-amber-700 dark:text-amber-300",
      Icon: XCircle,
    },
  };

  const t = toneMap[tone] || toneMap.success;
  const Icon = t.Icon;

  return (
    <div className={`rounded-lg border ${t.border} ${t.bg} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-5 w-5 ${t.iconColor}`} />
        <h3 className={`${t.text} font-semibold`}>{title}</h3>
      </div>
      {items.length ? (
        <ul className="list-disc list-inside text-sm text-gray-900 dark:text-gray-100 max-h-40 overflow-auto">
          {items.map((num, i) => (
            <li key={`${num}-${i}`}>
              {prefix}: {num}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300">Yok</p>
      )}
    </div>
  );
}
