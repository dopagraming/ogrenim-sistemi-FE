import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

// This component can be used globally to display notifications
const Toast = () => {
  const [toast, setToast] = useState(null);

  // Listen for custom events that will trigger toasts
  useEffect(() => {
    const showToast = (e) => {
      setToast(e.detail);

      if (e.detail.autoClose !== false) {
        setTimeout(() => {
          setToast(null);
        }, e.detail.duration || 5000);
      }
    };

    window.addEventListener("showToast", showToast);

    return () => {
      window.removeEventListener("showToast", showToast);
    };
  }, []);

  if (!toast) return null;

  const { type, message } = toast;

  // Define styles based on toast type
  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-500",
          textColor: "text-green-800 dark:text-green-200",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        };
      case "error":
        return {
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-500",
          textColor: "text-red-800 dark:text-red-200",
          icon: <XCircle className="h-5 w-5 text-red-500" />,
        };
      case "warning":
        return {
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-500",
          textColor: "text-yellow-800 dark:text-yellow-200",
          icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
        };
      default:
        return {
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-500",
          textColor: "text-blue-800 dark:text-blue-200",
          icon: <AlertCircle className="h-5 w-5 text-blue-500" />,
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-fade-in">
      <div
        className={`rounded-md shadow-md border-l-4 ${styles.borderColor} ${styles.bgColor} p-4 flex items-start`}
      >
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className={`ml-3 ${styles.textColor}`}>
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setToast(null)}
            className={`inline-flex rounded-md p-1.5 ${styles.textColor} hover:bg-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to display toast from anywhere
export const showToast = (type, message, options = {}) => {
  window.dispatchEvent(
    new CustomEvent("showToast", {
      detail: {
        type,
        message,
        ...options,
      },
    })
  );
};

export default Toast;
