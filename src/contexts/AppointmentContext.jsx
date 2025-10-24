import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  getTeacherAppointments,
  moveAppointmentApi,
  updateAppointmentStatus,
} from "../services/appointmentService";

const AppointmentContext = createContext();

export function useAppointments() {
  return useContext(AppointmentContext);
}

export function AppointmentProvider({ children }) {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!currentUser) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const teacherAppointments = await getTeacherAppointments(
          currentUser._id
        );
        setAppointments(teacherAppointments);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [currentUser]);

  const acceptAppointment = async (appointmentId) => {
    try {
      const updatedAppointment = await updateAppointmentStatus(
        appointmentId,
        "accepted"
      );
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === appointmentId ? updatedAppointment : appointment
        )
      );
      return true;
    } catch (error) {
      console.error("Error accepting appointment:", error);
      return false;
    }
  };

  const rejectAppointment = async (appointmentId) => {
    try {
      const updatedAppointment = await updateAppointmentStatus(
        appointmentId,
        "rejected"
      );
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === appointmentId ? updatedAppointment : appointment
        )
      );
      return true;
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      return false;
    }
  };

  const moveAppointment = async (appointmentId, toSlotId) => {
    try {
      const updated = await moveAppointmentApi(appointmentId, toSlotId);
      setAppointments((prev) =>
        prev.map((a) => (a._id === appointmentId ? updated : a))
      );
      return { ok: true, updated };
    } catch (error) {
      console.error("Error moving appointment:", error);
      return {
        ok: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to move appointment",
      };
    }
  };

  const value = {
    appointments,
    loading,
    acceptAppointment,
    rejectAppointment,
    moveAppointment,
    refreshAppointments: async () => {
      if (currentUser) {
        setLoading(true);
        const teacherAppointments = await getTeacherAppointments(
          currentUser._id
        );
        setAppointments(teacherAppointments);
        setLoading(false);
      }
    },
  };

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}
