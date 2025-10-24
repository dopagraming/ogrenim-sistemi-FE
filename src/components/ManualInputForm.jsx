import { memo, useCallback } from "react";

function ManualInputForm({ value, onChange }) {
  const handle = useCallback(
    (e) => {
      const { name, value } = e.target;
      onChange({ [name]: value });
    },
    [onChange]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Makale Adı
        </label>
        <input
          name="name"
          value={value?.name || ""}
          onChange={handle}
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
          placeholder="Örn: Fast methods for SPEED analysis"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Yazar(lar)
        </label>
        <input
          name="author"
          value={value?.author || ""}
          onChange={handle}
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
          placeholder="Örn: Abdelrahman Zourob"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Yıl
        </label>
        <input
          name="year"
          value={value?.year || ""}
          onChange={handle}
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
          placeholder="2025"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Dergi
        </label>
        <input
          name="journal"
          value={value?.journal || ""}
          onChange={handle}
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
          placeholder="Örn: Journal of Palestine"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Cilt
        </label>
        <input
          name="volume"
          value={value?.volume || ""}
          onChange={handle}
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
          placeholder="Örn: 12"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Sayı
        </label>
        <input
          name="number"
          value={value?.number || ""}
          onChange={handle}
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
          placeholder="Örn: 3"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Özet
        </label>
        <textarea
          name="abstract"
          value={value?.abstract || ""}
          onChange={handle}
          rows={5}
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
          placeholder="Kısa özet..."
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Adres (opsiyonel)
        </label>
        <input
          name="address"
          value={value?.address || ""}
          onChange={handle}
          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
          placeholder="—"
        />
      </div>
    </div>
  );
}

export default memo(ManualInputForm);
