import api from '../lib/axios';

const API_URL = '/api/appointments';

// Create a new booking
export const createBooking = async (bookingData) => {
  try {
    const { data } = await api.post(API_URL, {
      ...bookingData
    });
    return data;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

// Get booking count statistics for a teacher
export const getBookingCountStats = async (teacherId) => {
  try {
    const { data } = await api.get(`${API_URL}/stats`, {
      params: { teacherId }
    });
    return data;
  } catch (error) {
    console.error("Error getting booking stats:", error);
    throw error;
  }
};