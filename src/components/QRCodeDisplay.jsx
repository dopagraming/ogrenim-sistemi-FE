import { QRCodeCanvas } from "qrcode.react";

function QRCodeDisplay({ teacherId, size = 200 }) {
  const appUrl = `${window.location.origin}/teacher/${teacherId}`;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <QRCodeCanvas
          id="qr-code-canvas"
          value={appUrl}
          size={size}
          includeMargin={true}
          level="H"
        />
      </div>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Scan to view your booking page
      </p>
    </div>
  );
}

export default QRCodeDisplay;
