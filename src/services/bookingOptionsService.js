import api from "../lib/axios";

export const getBookingMajors = async (teacherId, level) => {
    const { data } = await api.get(`/api/teachers/${teacherId}/booking-options`, {
        params: { level },
    });
    return data?.data || [];
};

export const updateBookingMajors = async (teacherId, payload) => {
    const { data } = await api.put(`/api/teachers/${teacherId}/booking-options`, payload);
    return data;
};
