import React, { createContext, useState, useContext, useEffect } from "react";
import {
  login,
  register,
  logout,
  getCurrentUser,
  studentLogin,
} from "../services/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    console.log(currentUser);
    const token = localStorage.getItem("token");
    if (token) {
      getCurrentUser()
        .then((data) => {
          setCurrentUser(data);
          setUserProfile(data);
        })
        .catch((error) => {
          console.error("Error fetching user profile:", error);
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (email, password, role) => {
    const res = await login(email, password, role);
    setCurrentUser(res);
    setUserProfile(res);
    return res;
  };

  const handleRegister = async (userData) => {
    const data = await register(userData);
    setCurrentUser(data.user);
    setUserProfile(data.user);
    return data;
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const value = {
    currentUser,
    userProfile,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
