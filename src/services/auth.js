import api from "../lib/axios"
const API_URL = '/api/auth';

// Login user
export const login = async (email, password, role) => {
    try {
        const { data } = await api.post(`${API_URL}/login`, { email, password, role });
        console.log("login data", data)
        if (data.token) {
            localStorage.setItem('token', data.token);
        }
        return data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

// Register user
export const register = async (userData) => {
    try {
        const { data } = await api.post(`${API_URL}/register`, userData);
        if (data.token) {
            localStorage.setItem('token', data.token);
        }
        return data;
    } catch (error) {
        console.error("Registration error:", error);
        throw error;
    }
};

// Logout user
export const logout = () => {
    localStorage.removeItem('token');
};

// Get current user profile
export const getCurrentUser = async () => {
    try {
        const { data } = await api.get(`${API_URL}/profile`);
        return data;
    } catch (error) {
        console.error("Error fetching current user:", error);
        throw error;
    }
};

// Update user profile
// export const updateProfile = async (userData) => {
//     console.log(userData)
//     try {
//         const { data } = await api.put(`${API_URL}/profile`, userData);
//         return data;
//     } catch (error) {
//         console.error("Error updating profile:", error);
//         throw error;
//     }
// };
