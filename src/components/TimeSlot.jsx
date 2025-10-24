import React from "react";
import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";

function TimeSlot({ slot, teacherId }) {
  return (
    <div
      className={`
        border rounded-lg p-4 mb-3 transition-all duration-200 
        ${
          slot.isBooked
            ? "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
            : "border-blue-200 hover:border-red-400 dark:border-red-900 dark:hover:border-red-700 hover:shadow-md bg-white dark:bg-gray-900"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="h-4 w-4 mr-2 text-primary dark:text-primary" />
            <span className="text-sm font-medium">{slot.dayOfWeek}</span>
          </div>
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Clock className="h-4 w-4 mr-2 text-primary dark:text-primary" />
            <span className="text-sm">
              {slot.startTime} - {slot.endTime}
            </span>
          </div>
        </div>

        {!slot.isBooked && (
          <Link
            to={`/book/${teacherId}/${slot._id}`}
            className="px-3 py-1.5 bg-primary text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm font-medium transition-colors duration-150"
          >
            Book Now
          </Link>
        )}

        {slot.isBooked && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            Booked
          </span>
        )}
      </div>
    </div>
  );
}

export default TimeSlot;
