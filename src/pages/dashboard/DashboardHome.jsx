import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useAppointments } from "../../contexts/AppointmentContext";
import {
  Calendar,
  Clock,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  ArrowRight,
  User,
  CalendarClock,
} from "lucide-react";

function DashboardHome() {
  const { currentUser, userProfile } = useAuth();
  const { appointments } = useAppointments();

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    pending: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d)) return "-";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const total = appointments.length;
    const accepted = appointments.filter((a) => a.status === "accepted").length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const rejected = appointments.filter((a) => a.status === "rejected").length;

    setStats({ total, accepted, pending, rejected });

    const now = Date.now();
    const upcoming = appointments
      .filter(
        (a) =>
          a.status === "accepted" &&
          a.startTime &&
          new Date(a.startTime).getTime() >= now
      )
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 3);

    setUpcomingAppointments(upcoming);
    setLoading(false);
  }, [appointments]);

  if (loading) {
    return (
      <div className="h-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
      </div>
    );
  }

  const displayName =
    userProfile?.displayName || currentUser?.displayName || "Öğretmen";

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-red-600/10 via-rose-500/10 to-fuchsia-500/10">
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tekrar hoş geldiniz, {displayName}!
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Rezervasyonlarınız ve programınıza kısa bir genel bakış.
              </p>
            </div>
            <Link
              to="/dashboard/profile"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              Profili Görüntüle
            </Link>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-6 w-6 text-white" />}
          title="Toplam Rezervasyon"
          value={stats.total}
          accent="from-slate-500 to-slate-700"
        />
        <StatCard
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          title="Kabul Edilen"
          value={stats.accepted}
          accent="from-emerald-500 to-emerald-700"
        />
        <StatCard
          icon={<Bell className="h-6 w-6 text-white" />}
          title="Beklemede"
          value={stats.pending}
          accent="from-amber-500 to-amber-700"
        />
        <StatCard
          icon={<XCircle className="h-6 w-6 text-white" />}
          title="Reddedilen"
          value={stats.rejected}
          accent="from-rose-500 to-rose-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Yaklaşan Randevular
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Sıradaki onaylı görüşmeleriniz
                </p>
              </div>
              <Link
                to="/dashboard/appointments"
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 inline-flex items-center"
              >
                Tümünü Görüntüle
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700">
              {upcomingAppointments.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {upcomingAppointments.map((a) => (
                    <li key={a._id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <CalendarClock className="h-6 w-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {a.studentName} ile Görüşme
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row sm:items-center gap-1">
                              <span className="flex items-center">
                                <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                                {formatDate(a.startTime)}
                              </span>
                              <span className="sm:ml-3 flex items-center">
                                <Clock className="mr-1 h-4 w-4 text-gray-400" />
                                {formatTime(a.startTime)} –{" "}
                                {formatTime(a.endTime)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                          Onaylandı
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-6 py-10 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Yaklaşan randevu yok
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Şu anda planlanmış bir randevunuz yok.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/dashboard/availability"
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm transition"
                    >
                      <Clock className="h-4 w-4" />
                      Uygunlukları Yönet
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bekleyen Talepler
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                İlginizi gerektiren rezervasyon talepleri
              </p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              {appointments.filter((a) => a.status === "pending").length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {appointments
                    .filter((a) => a.status === "pending")
                    .sort(
                      (a, b) => new Date(a.startTime) - new Date(b.startTime)
                    )
                    .slice(0, 4)
                    .map((r) => (
                      <li key={r._id} className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Bell className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {r.studentName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(r.startTime)} •{" "}
                              {formatTime(r.startTime)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="px-6 py-10 text-center">
                  <CheckCircle className="mx-auto h-10 w-10 text-gray-400" />
                  <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Bekleyen talep yok
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Her şey güncel! 🎉
                  </p>
                </div>
              )}
              {appointments.filter((a) => a.status === "pending").length >
                0 && (
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 text-right">
                  <Link
                    to="/dashboard/appointments"
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 inline-flex items-center"
                  >
                    Tüm bekleyenleri görüntüle
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  accent = "from-gray-500 to-gray-700",
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center gap-4">
        <div
          className={`flex-shrink-0 rounded-lg p-3 bg-gradient-to-br ${accent} shadow-sm`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white mt-0.5">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
