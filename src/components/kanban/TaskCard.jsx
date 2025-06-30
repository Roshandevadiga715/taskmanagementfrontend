import React from "react";

const priorityColors = {
  High: "bg-red-600 text-white",
  Medium: "bg-yellow-500 text-white",
  Low: "bg-cyan-600 text-white",
};

const TaskCard = ({ title, priority, estimate }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-2 sm:p-3 rounded shadow cursor-pointer text-gray-900 dark:text-gray-100 transition flex flex-col gap-1 sm:gap-2">
    <div className="font-semibold text-sm sm:text-base">{title}</div>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 sm:gap-0">
      <span className={`px-2 py-0.5 rounded ${priorityColors[priority] || "bg-gray-500"}`}>
        {priority}
      </span>
      <span className="text-gray-500 dark:text-gray-400">{estimate}</span>
    </div>
  </div>
);

export default TaskCard;
