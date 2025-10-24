import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import QRCodeDisplay from "../../components/QRCodeDisplay";
import { Share2, Download, ExternalLink, User, QrCode } from "lucide-react";

function TeacherQRCode() {
  const { currentUser } = useAuth();

  const profileUrl = `${window.location.origin}/teacher/${currentUser._id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    window.dispatchEvent(
      new CustomEvent("showToast", {
        detail: {
          type: "success",
          message: "Bağlantı panoya kopyalandı",
        },
      })
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Benimle randevu oluştur",
          text: "Benimle randevu oluşturmak için bu bağlantıyı kullanın",
          url: profileUrl,
        });
      } catch (error) {
        console.error("Paylaşım hatası:", error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      // Google Charts API yöntemi kullanılıyorsa
      const img = document.querySelector("#qr-code-img");
      if (img) {
        const link = document.createElement("a");
        link.href = img.src;
        link.download = "randevu-qr-kodu.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      // Canvas tabanlı bir QR kütüphanesi kullanılıyorsa
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "randevu-qr-kodu.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Randevu sayfanızı paylaşın
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Öğrenciler bu QR kodu tarayarak sizinle randevu alabilir.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-8 sm:px-6 flex flex-col items-center">
          <div className="mb-8">
            <QRCodeDisplay teacherId={currentUser._id} size={250} />
          </div>

          <div className="mt-4 w-full max-w-md">
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 rounded-md px-3 py-2 mb-4">
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate mr-2">
                {profileUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
              >
                Kopyala
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={handleCopyLink}
                className="inline-flex flex-1 justify-center items-center px-3 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <ExternalLink className="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                Bağlantıyı Kopyala
              </button>

              <button
                onClick={handleShare}
                className="inline-flex flex-1 justify-center items-center px-3 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Share2 className="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                Paylaş
              </button>

              <button
                onClick={handleDownloadQR}
                className="inline-flex flex-1 justify-center items-center px-3 py-2 border border-gray-300 dark:border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Download className="mr-1.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                İndir
              </button>
            </div>
          </div>

          <div className="mt-8 max-w-md text-center">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              QR kodunuzu nasıl kullanabilirsiniz?
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 text-left list-disc pl-5">
              <li>
                Bu QR kodu yazdırıp ofis kapınıza ya da derslikte görünür bir
                yere asın
              </li>
              <li>E-posta imzanıza veya ders materyallerinize ekleyin</li>
              <li>
                Derste paylaşarak öğrencilerin hızlıca randevu oluşturmasını
                kolaylaştırın
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherQRCode;
