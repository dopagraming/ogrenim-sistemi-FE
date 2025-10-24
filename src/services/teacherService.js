import api from '../lib/axios';

const API_URL = '/api/teachers';

// Create a new teacher profile
export const createTeacherProfile = async (teacherId, teacherData) => {
    try {
        const { data } = await api.post(API_URL, teacherData);
        return data;
    } catch (error) {
        console.error("Error creating teacher profile:", error);
        throw error;
    }
};

// Get a teacher by ID
export const getTeacherById = async (teacherId) => {
    try {
        const { data } = await api.get(`${API_URL}/${teacherId}`);
        return data;
    } catch (error) {
        console.error("Error fetching teacher:", error);
        throw error;
    }
};

// Update teacher profile
export const updateTeacherProfile = async (teacherId, teacherData) => {
    try {
        const { data } = await api.put(`${API_URL}/profile`, teacherData);
        return data;
    } catch (error) {
        console.error("Error updating teacher profile:", error);
        throw error;
    }
};