import React, { useCallback, useRef, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from "lucide-react";

const ACCEPTED = [".ris", ".bib", ".pdf"];
const MAX_MB = 10;

function readFileText(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsText(file);
  });
}

/** ---------- RIS PARSER ---------- */
function parseRIS(text) {
  // Simple RIS lines: TAG  - value
  // Common tags:
  // TI/T1 = Title, AU = Author, PY = Year, JO/T2 = Journal, VL = Volume, IS = Number, AB = Abstract
  const lines = text.split(/\r?\n/);
  const out = {
    name: "",
    author: "",
    year: "",
    journal: "",
    volume: "",
    number: "",
    abstract: "",
  };
  const authors = [];
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9]{2})\s*-\s*(.*)$/);
    if (!m) continue;
    const tag = m[1].trim();
    const val = m[2].trim();

    switch (tag) {
      case "TI":
      case "T1":
        if (!out.name) out.name = val;
        break;
      case "AU":
        if (val) authors.push(val);
        break;
      case "PY":
        if (!out.year) out.year = (val.match(/\d{4}/) || [""[0]])[0] || val;
        break;
      case "JO":
      case "T2":
        if (!out.journal) out.journal = val;
        break;
      case "VL":
        if (!out.volume) out.volume = val;
        break;
      case "IS":
        if (!out.number) out.number = val;
        break;
      case "AB":
        if (!out.abstract) out.abstract = val;
        break;
      default:
        break;
    }
  }
  if (authors.length) out.author = authors.join(", ");
  return out;
}

/** ---------- BIBTEX PARSER ---------- */
function parseBibTeX(text) {
  // naive parse for first entry
  // extracts: title, author, year, journal, volume, number, abstract
  const out = {
    name: "",
    author: "",
    year: "",
    journal: "",
    volume: "",
    number: "",
    abstract: "",
  };

  const getField = (key) => {
    const re = new RegExp(`\\b${key}\\s*=\\s*[{"]([^"}]+)[}"]`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };

  out.name = getField("title");
  out.author = getField("author").replace(/\s+and\s+/gi, ", ");
  out.year = getField("year");
  out.journal = getField("journal");
  out.volume = getField("volume");
  out.number = getField("number");
  out.abstract = getField("abstract");

  return out;
}

/** ---------- PDF (fallback) ---------- */
async function parsePDFFallback(file) {
  // For production-quality PDF parsing, integrate pdf.js:
  // - npm i pdfjs-dist
  // - import { getDocument } from "pdfjs-dist";
  // Here we fallback to filename as the title (name).
  const base = file.name.replace(/\.[^.]+$/, "");
  return {
    name: base,
    author: "",
    year: "",
    journal: "",
    volume: "",
    number: "",
    abstract: "",
  };
}

function mergeAndNormalize(raw) {
  // Normalize fields to your backend names
  const clean = (s) => (s == null ? "" : String(s).trim());
  return {
    name: clean(raw.name) || clean(raw.title),
    abstract: clean(raw.abstract),
    author: clean(raw.author),
    year: clean(raw.year).match(/\d{4}/)?.[0] || clean(raw.year),
    journal: clean(raw.journal),
    volume: clean(raw.volume),
    number: clean(raw.number),
    address: clean(raw.address), // rarely present; harmless
  };
}

export default function FileUploadForm({ onChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      return `Desteklenmeyen dosya tipi: ${ext}. İzin verilenler: ${ACCEPTED.join(
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

  const parseFile = async (file) => {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

    try {
      if (ext === ".ris") {
        const text = await readFileText(file);
        return mergeAndNormalize(parseRIS(text));
      }
      if (ext === ".bib") {
        const text = await readFileText(file);
        return mergeAndNormalize(parseBibTeX(text));
      }
      if (ext === ".pdf") {
        // Fallback: title from filename
        return mergeAndNormalize(await parsePDFFallback(file));
      }
      return null;
    } catch (e) {
      console.error("Parse error:", e);
      throw new Error("Dosya okunamadı veya çözümlenemedi.");
    }
  };

  const handleFiles = useCallback(
    async (files) => {
      const file = files?.[0];
      if (!file) return;
      const vErr = validateFile(file);
      if (vErr) {
        setError(vErr);
        return;
      }

      setBusy(true);
      setError("");
      setPreview(null);

      try {
        const parsed = await parseFile(file);
        if (!parsed || !parsed.name) {
          setError(
            "Geçerli bir başlık bulunamadı. Lütfen bilgileri elle tamamlayın."
          );
        }
        setPreview({ fileName: file.name, ...parsed });
        // push to parent (AddArticle) as articleData
        onChange?.(parsed);
      } catch (e) {
        setError(e.message || "Dosya işlenemedi.");
      } finally {
        setBusy(false);
      }
    },
    [onChange]
  );

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    await handleFiles(e.dataTransfer.files);
  };

  const onBrowse = async (e) => {
    await handleFiles(e.target.files);
    e.target.value = ""; // reset
  };

  return (
    <div>
      {/* Info row */}
      <div className="mb-3 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
        <Info className="h-4 w-4 mt-0.5" />
        <p>
          Bu mod, yüklediğiniz dosyadan (RIS / BibTeX / PDF) otomatik olarak
          başlık, yazar, yıl, dergi vb. bilgileri çıkarır. Gerekirse sonradan
          düzenleyebilirsiniz.
        </p>
      </div>

      {/* Dropzone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition ${
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
            Dosyanızı buraya sürükleyin veya{" "}
            <button
              type="button"
              className="text-red-600 font-medium hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              göz atın
            </button>
            .
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            İzin verilen: {ACCEPTED.join(", ")} • En fazla {MAX_MB} MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            onChange={onBrowse}
            className="hidden"
          />
        </div>
      </div>

      {/* Status */}
      <div className="min-h-[24px] mt-3">
        {busy && (
          <div className="inline-flex items-center gap-2 text-red-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Dosya işleniyor…</span>
          </div>
        )}
        {error && (
          <div className="inline-flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" />
            <span className="font-medium">{error}</span>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="mt-4 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
            <h4 className="text-emerald-800 dark:text-emerald-200 font-semibold">
              Özet (düzenlenebilir alana aktarıldı)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <PreviewRow label="Dosya" value={preview.fileName} />
            <PreviewRow label="Başlık" value={preview.name} />
            <PreviewRow label="Yazar(lar)" value={preview.author} />
            <PreviewRow label="Yıl" value={preview.year} />
            <PreviewRow label="Dergi" value={preview.journal} />
            <PreviewRow label="Cilt" value={preview.volume} />
            <PreviewRow label="Sayı" value={preview.number} />
            <div className="md:col-span-2">
              <span className="block text-gray-600 dark:text-gray-300">
                Özet
              </span>
              <p className="mt-0.5 text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {preview.abstract || "—"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-gray-600 dark:text-gray-300">{label}</span>
      <span className="text-gray-900 dark:text-gray-100 font-medium">:</span>
      <span className="text-gray-900 dark:text-gray-100 truncate">
        {value || "—"}
      </span>
    </div>
  );
}
