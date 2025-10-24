import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppointmentProvider } from "./contexts/AppointmentContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherProfile from "./pages/TeacherProfile";
import BookingForm from "./pages/BookingForm";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import CreatePassword from "./pages/CreatePassword";
import StudentArticles from "./pages/StudentArticles";
import ArticleDetail from "./pages/ArticleDetail"

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import Toast from "./components/Toast";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppointmentProvider>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen bg-gray-50">
              <Toast />
              <Header />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  {/* <Route path="/register" element={<Register />} />  REMOVED */}

                  {/* Public */}
                  <Route path="/teacher/:id" element={<TeacherProfile />} />
                  <Route path="/book/:teacherId/:slotId" element={<BookingForm />} />
                  <Route path="/create-password" element={<CreatePassword />} />

                  {/* Authed (non-admin) */}
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard/*"
                    element={
                      <ProtectedRoute>
                        <TeacherDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/student-articles"
                    element={
                      <ProtectedRoute>
                        <StudentArticles />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/articles/:id"
                    element={
                      <ArticleDetail />
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </AppointmentProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
