import api from '../lib/axios';

const API_URL = '/api/teachers';

// Add a new time slot
export const addTimeSlot = async (teacherId, slotData) => {
    try {
        const { data } = await api.post(`${API_URL}/${teacherId}/timeslots`, slotData);
        return data;
    } catch (error) {
        console.error("Error adding time slot:", error);
        throw error;
    }
};

// Get all time slots for a teacher
export const getTeacherTimeSlots = async (teacherId) => {
    try {
        const { data } = await api.get(`${API_URL}/${teacherId}/timeslots`);
        return data;
    } catch (error) {
        console.error("Error fetching time slots:", error);
        throw error;
    }
};

// Get only available time slots for a teacher
export const getTeacherAvailableSlots = async (teacherId) => {
    try {
        console.log(teacherId)
        const { data } = await api.get(`${API_URL}/${teacherId}/timeslots/available`);
        return data;
    } catch (error) {
        console.error("Error fetching available time slots:", error);
        throw error;
    }
};

// Get a specific time slot
export const getTimeSlotById = async (teacherId, slotId) => {
    try {
        const { data } = await api.get(`${API_URL}/${teacherId}/timeslots/${slotId}`);
        return data;
    } catch (error) {
        console.error("Error fetching time slot:", error);
        throw error;
    }
};

// Update a time slot
export const updateTimeSlot = async (teacherId, slotData) => {
    try {
        const { id, ...data } = slotData;
        const { data: response } = await api.put(
            `${API_URL}/${teacherId}/timeslots/${id}`,
            data
        );
        return response;
    } catch (error) {
        console.error("Error updating time slot:", error);
        throw error;
    }
};

// Mark a time slot as booked
export const markTimeSlotAsBooked = async (teacherId, slotId) => {
    try {
        const { data } = await api.put(
            `${API_URL}/${teacherId}/timeslots/${slotId}/book`,
            {}
        );
        return data;
    } catch (error) {
        console.error("Error marking time slot as booked:", error);
        throw error;
    }
};

// Delete a time slot
export const deleteTimeSlot = async (teacherId, slotId) => {
    try {
        await api.delete(`${API_URL}/${teacherId}/timeslots/${slotId}`);
        return true;
    } catch (error) {
        console.error("Error deleting time slot:", error);
        throw error;
    }
};
