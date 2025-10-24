import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import TeacherInfoForm from "../../components/TeacherInfoForm";
import { User } from "lucide-react";

function TeacherProfile() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-red-500/10 to-rose-500/10 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600/20 flex items-center justify-center">
              <User className="h-5 w-5 text-red-700 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Teacher Information
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your personal details, photo, and Google Scholar info.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || "Profile"}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23f3f4f6' width='100%25' height='100%25'/%3E%3Ctext x='50%25' y='52%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial' font-size='12'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  <User className="h-7 w-7" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TeacherInfoForm teacherData={userProfile} />
    </div>
  );
}

export default TeacherProfile;
