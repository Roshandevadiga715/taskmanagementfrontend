import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <-- import the default export
import { getAllTasks } from '../api/taskRequest';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

const priorityColors = {
  High: "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100",
  Medium: "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100",
  Low: "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100",
};

function TaskHistory() {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filterType, setFilterType] = useState('none'); // 'none', 'date', 'time'
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    getAllTasks().then((tasks) => {
      const completed = tasks.filter(
        (t) => (t.status || '').toLowerCase() === 'completed'
      );
      setCompletedTasks(completed);
      setFilteredTasks(completed);
    });
  }, []);

  useEffect(() => {
    let filtered = completedTasks;
    if (filterType === 'date' && filterValue) {
      filtered = completedTasks.filter((t) => {
        const d = new Date(t.updatedAt || t.completedAt || t.createdAt);
        return d.toISOString().slice(0, 10) === filterValue;
      });
    }
    if (filterType === 'time' && filterValue) {
      filtered = completedTasks.filter((t) => {
        const d = new Date(t.updatedAt || t.completedAt || t.createdAt);
        return d.toLocaleTimeString().startsWith(filterValue);
      });
    }
    setFilteredTasks(filtered);
  }, [filterType, filterValue, completedTasks]);

  const handleDownloadPDF = () => {
    // Debug: check if function is called
    console.log("Download PDF clicked", filteredTasks);
    const doc = new jsPDF();
    doc.text("Completed Tasks History", 14, 16);
    autoTable(doc, { // <-- use autoTable(doc, { ... })
      startY: 22,
      head: [['Title', 'Priority', 'Estimate', 'Completed At']],
      body: filteredTasks.map((t) => [
        t.title,
        t.priority,
        t.estimate,
        formatDate(t.updatedAt || t.completedAt || t.createdAt),
      ]),
    });
    doc.save('completed_tasks.pdf');
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex gap-2 items-center">
          <label className="font-medium text-gray-700 dark:text-gray-200">Filter by:</label>
          <select
            className="rounded border px-2 py-1 dark:bg-gray-800 dark:text-gray-100"
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setFilterValue(''); }}
          >
            <option value="none">None</option>
            <option value="date">Date</option>
            <option value="time">Time</option>
          </select>
          {filterType === 'date' && (
            <input
              type="date"
              className="rounded border px-2 py-1 dark:bg-gray-800 dark:text-gray-100"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          )}
          {filterType === 'time' && (
            <input
              type="text"
              placeholder="HH:MM"
              className="rounded border px-2 py-1 dark:bg-gray-800 dark:text-gray-100"
              value={filterValue}
              onChange={e => setFilterValue(e.target.value)}
            />
          )}
        </div>
        <button
          onClick={handleDownloadPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-800 dark:hover:bg-blue-900 transition"
        >
          Download as PDF
        </button>
      </div>
      <div className="overflow-x-auto rounded shadow bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Title</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Priority</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Estimate</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase">Completed At</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                  No completed tasks found.
                </td>
              </tr>
            )}
            {filteredTasks.map((task) => (
              <tr key={task._id || task.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <td className="px-4 py-2">{task.title}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[task.priority] || ''}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-2">{task.estimate}</td>
                <td className="px-4 py-2">{formatDate(task.updatedAt || task.completedAt || task.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TaskHistory;
