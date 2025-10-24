import React, { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  User,
  Calendar,
  Clock,
  QrCode,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronDown,
  Menu,
  X,
  File,
  PencilLine,
  FilePlus,
  GraduationCap,
  ClipboardCheck,
  FileSignature,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Dashboard sections
import DashboardHome from "./dashboard/DashboardHome";
import AppointmentsList from "./dashboard/AppointmentsList";
import ManageAvailability from "./dashboard/ManageAvailability";
import TeacherProfile from "./dashboard/TeacherProfile";
import TeacherQRCode from "./dashboard/TeacherQRCode";
import TeacherSettings from "./dashboard/TeacherSettings";
import UploadFile from "./dashboard/UploadFile";
import ContentEditor from "./dashboard/ContentEditor";
import AddArticle from "./dashboard/AddArticle";
import AddMasterStudent from "./dashboard/AddMasterStudent";
import TeacherReviewArticles from "./dashboard/TeacherReviewArticles";
import TeacherArticleProposals from "./dashboard/TeacherArticleProposals";
import TeacherPublications from "./dashboard/TeacherPublications";

function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      current: location.pathname === "/dashboard",
    },
    {
      name: "Appointments",
      href: "/dashboard/appointments",
      icon: Calendar,
      current: location.pathname === "/dashboard/appointments",
    },
    {
      name: "Availability",
      href: "/dashboard/availability",
      icon: Clock,
      current: location.pathname === "/dashboard/availability",
    },
    {
      name: "Upload File",
      href: "/dashboard/uploadFile",
      icon: File,
      current: location.pathname === "/dashboard/uploadFile",
    },
    {
      name: "Content Editor",
      href: "/dashboard/contentEditor",
      icon: PencilLine,
      current: location.pathname === "/dashboard/contentEditor",
    },
    {
      name: "Add Article",
      href: "/dashboard/addArticle",
      icon: FilePlus,
      current: location.pathname === "/dashboard/addArticle",
    },
    {
      name: "Add Master Student",
      href: "/dashboard/addMasterStudent",
      icon: GraduationCap,
      current: location.pathname === "/dashboard/addMasterStudent",
    },
    {
      name: "Teacher Review Articles",
      href: "/dashboard/teacher-review-articles",
      icon: ClipboardCheck,
      current: location.pathname === "/dashboard/teacher-review-articles",
    },
    {
      name: "Teacher Article Proposals",
      href: "/dashboard/teacher-article-proposals",
      icon: FileSignature,
      current: location.pathname === "/dashboard/teacher-article-proposals",
    },
    {
      name: "Teacher Publications",
      href: "/dashboard/teacher-publications",
      icon: BookOpen,
      current: location.pathname === "/dashboard/teacher-publications",
    },
    {
      name: "QR Code",
      href: "/dashboard/qrcode",
      icon: QrCode,
      current: location.pathname === "/dashboard/qrcode",
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      current: location.pathname === "/dashboard/profile",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      current: location.pathname === "/dashboard/settings",
    },
  ];

  return (
    <div className="h-full">
      <div className="flex h-full">
        {/* Mobile sidebar overlay */}
        <div
          className={`fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity ease-linear duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Mobile sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 transform transition ease-in-out duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:hidden`}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-md text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-2 space-y-1 flex-1 overflow-y-auto">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${
                      item.current
                        ? "bg-gray-100 text-primary dark:bg-gray-800 dark:text-blue-400"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`
                      mr-3 h-5 w-5 
                      ${
                        item.current
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                      }
                    `}
                  />
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 relative">
                  {userProfile?.photoURL ? (
                    <img
                      className="h-10 w-10 rounded-full object-cover"
                      src={userProfile.photoURL}
                      alt=""
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userProfile?.displayName || currentUser?.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="mt-4 w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="mr-3 h-5 w-5 text-red-500" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="h-0 flex-1 flex flex-col overflow-y-auto">
              <nav className="px-2 py-4 flex-1 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${
                        item.current
                          ? "bg-gray-100 text-primary dark:bg-gray-800 dark:text-blue-400"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-5 w-5 
                        ${
                          item.current
                            ? "text-primary dark:text-blue-400"
                            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                        }
                      `}
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>

              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 relative">
                    {userProfile?.photoURL ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={userProfile.photoURL}
                        alt=""
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {userProfile?.displayName || currentUser?.displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <button
                      className="flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      aria-label="User menu"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="mt-4 w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut className="mr-3 h-5 w-5 text-red-500" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <div className="lg:hidden flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" />
              </button>
              <span className="ml-2 text-lg font-medium text-gray-900 dark:text-white">
                {navigation.find((item) => item.current)?.name || "Dashboard"}
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {userProfile?.photoURL ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={userProfile.photoURL}
                  alt=""
                />
              ) : (
                <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </div>

          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/appointments" element={<AppointmentsList />} />
                <Route path="/availability" element={<ManageAvailability />} />
                <Route path="/profile" element={<TeacherProfile />} />
                <Route path="/qrcode" element={<TeacherQRCode />} />
                <Route path="/settings" element={<TeacherSettings />} />
                <Route path="/uploadFile" element={<UploadFile />} />
                <Route path="/contentEditor" element={<ContentEditor />} />
                <Route path="/addArticle" element={<AddArticle />} />
                <Route
                  path="/addMasterStudent"
                  element={<AddMasterStudent />}
                />
                <Route
                  path="/teacher-review-articles"
                  element={<TeacherReviewArticles />}
                />
                <Route
                  path="/teacher-article-proposals"
                  element={<TeacherArticleProposals />}
                />
                <Route
                  path="/teacher-publications"
                  element={<TeacherPublications />}
                />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
