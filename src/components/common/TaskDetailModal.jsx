import React, { useState, useRef } from "react";
import Modal from "../common/Modal";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";

const priorities = ["High", "Medium", "Low"];

const TaskDetailModal = ({ isOpen, onClose, task, mode }) => {
  const [title, setTitle] = useState(task?.title || "");
  const [priority, setPriority] = useState(task?.priority || "High");
  const [estimate, setEstimate] = useState(task?.estimate || "");
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  // Timer logic
  const startTimer = () => {
    if (!running) {
      setRunning(true);
      intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
  };
  const pauseTimer = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
  };
  const stopTimer = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setTimer(0);
  };

  // Format timer as HH:MM:SS
  const formatTime = (t) => {
    const h = String(Math.floor(t / 3600)).padStart(2, "0");
    const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
    const s = String(t % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Reset form on close
  const handleClose = () => {
    setTitle(task?.title || "");
    setPriority(task?.priority || "High");
    setEstimate(task?.estimate || "");
    stopTimer();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl">
        <div className="font-semibold text-lg mb-3">
          {mode === "update" ? "Update Task" : "Create New Task"}
        </div>
        <hr className="border-gray-700 mb-4" />
        <div className="mb-3">
          <label className="block text-sm mb-1">Task Title</label>
          <input
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100 focus:outline-none"
            placeholder="Enter task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex gap-2 mb-3">
          <div className="flex-1">
            <label className="block text-sm mb-1">Priority</label>
            <select
              className="w-full px-2 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {priorities.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm mb-1">Estimate</label>
            <input
              type="time"
              step="60"
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
              placeholder="2h 30m"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
            />
          </div>
        </div>
        <div className="bg-gray-800 rounded p-4 flex flex-col items-center mb-3">
          <span className="text-3xl font-mono text-green-400">{formatTime(timer)}</span>
          <div className="flex gap-3 mt-3">
            <button
              className="px-4 py-2 rounded flex items-center gap-2 text-white text-sm font-medium bg-blue-700 hover:bg-blue-800 active:bg-blue-900 focus:ring-2 focus:ring-blue-400 transition disabled:opacity-60 disabled:cursor-not-allowed shadow"
              onClick={startTimer}
              disabled={running}
            >
              <FaPlay className="text-base" />
              Start
            </button>
            <button
              className="px-4 py-2 rounded flex items-center gap-2 text-white text-sm font-medium bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 focus:ring-2 focus:ring-yellow-400 transition disabled:opacity-60 disabled:cursor-not-allowed shadow"
              onClick={pauseTimer}
              disabled={!running}
            >
              <FaPause className="text-base" />
              Pause
            </button>
            <button
              className="px-4 py-2 rounded flex items-center gap-2 text-white text-sm font-medium bg-red-700 hover:bg-red-800 active:bg-red-900 focus:ring-2 focus:ring-red-400 transition shadow"
              onClick={stopTimer}
            >
              <FaStop className="text-base" />
              Stop
            </button>
          </div>
        </div>
        {/* Add submit button or other controls as needed */}
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
