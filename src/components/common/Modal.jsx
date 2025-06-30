import React from "react";
import { IoMdClose } from "react-icons/io";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-800 bg-opacity-40 flex items-center justify-center z-50">
      <div className="relative bg-white dark:bg-gray-900 p-6 rounded shadow-lg min-w-[320px] sm:min-w-[400px] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
        <button
          className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <IoMdClose size={28} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;