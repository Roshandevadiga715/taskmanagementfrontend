import React from "react";
import { IoMdClose } from "react-icons/io";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-gray-900/40  flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 p-6 rounded shadow-lg min-w-[320px] sm:min-w-[400px] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
        onClick={(e) => {
          // Prevent clicks inside the modal from closing it
          e.stopPropagation();
        }}
      >
        <button
          className="absolute top-2 right-2 flex items-center justify-center cursor-pointer text-gray-400 hover:text-black dark:hover:text-white bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          style={{
            width: 44,
            height: 44,
            padding: 0,
            border: "none",
            borderRadius: "50%",
            background: "transparent",
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent overlay click when clicking close
            onClose();
          }}
          aria-label="Close"
          tabIndex={0}
        >
          <span className="flex items-center justify-center w-full h-full">
            <IoMdClose size={28} style={{ pointerEvents: "none" }} />
          </span>
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;