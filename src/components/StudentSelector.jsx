import React, { useEffect, useState } from "react";
import api from "../lib/axios";

export default function StudentSelector({ selected, onChange }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      let res = await api.get("/api/students/masterstudents");
      setStudents(res.data.data);
    };
    fetchData();
  }, []);

  const toggleSelect = (id) => {
    const updated = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(updated);
  };

  return (
    <div>
      <h4 className="font-semibold mb-2">Öğrenciler</h4>
      {students.map((student) => (
        <label key={student.id} className="block">
          <input
            type="checkbox"
            checked={selected.includes(student._id)}
            onChange={() => toggleSelect(student._id)}
          />
          <span className="ml-2">{student.name}</span>
        </label>
      ))}
    </div>
  );
}
