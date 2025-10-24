import api from '../lib/axios';

const API_URL = '/api/appointments';

// Get all appointments for a teacher
export const getTeacherAppointments = async () => {
  try {
    const { data } = await api.get(`${API_URL}/teacher`);
    return data;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw error;
  }
};

// Get upcoming appointments for a teacher
export const getUpcomingAppointments = async (teacherId, limitCount = 5) => {
  try {
    const { data } = await api.get(`${API_URL}/teacher/upcoming`, {
      params: { limit: 5, teacherId },
    });
    return data;
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    throw error;
  }
};

// Update appointment status
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    const { data } = await api.put(
      `${API_URL}/${appointmentId}/status`,
      { status },
    );
    return data;
  } catch (error) {
    console.error(`Error updating appointment status to ${status}:`, error);
    throw error;
  }
};

export const moveAppointmentApi = async (appointmentId, toSlotId) => {
  const { data } = await api.put(`/api/appointments/${appointmentId}/move`, { toSlotId });
  return data;
};

export const moveDayAppointments = ({ fromDay, toDay, createMissingSlots = true }) => {
  return api.put(`/api/appointments/move-day`, {
    fromDay,
    toDay,
    createMissingSlots,
  });
};