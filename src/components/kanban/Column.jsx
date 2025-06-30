import React from "react";
import TaskCard from "./TaskCard";
import { Draggable } from "@hello-pangea/dnd";
import { useKanbanStore } from "../../store/kanbanStore";

const Column = ({ title, columnId, onCardClick }) => {
  const tasks = useKanbanStore((s) => s.tasks[columnId] || []);
  const editTaskTitle = useKanbanStore((s) => s.editTaskTitle);

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 sm:p-4 min-w-[200px] sm:min-w-[250px] text-gray-900 dark:text-gray-100 transition border border-gray-200 dark:border-gray-700 flex-1 max-w-full">
      <div className="flex items-center mb-4">
        <span className="font-extrabold text-lg sm:text-xl tracking-wide text-blue-700 dark:text-blue-300">
          {title}
        </span>
        {/* Optionally add icon here */}
      </div>
      <div className="h-1 w-full mb-2 rounded bg-blue-700 dark:bg-blue-400" />
      <div className="space-y-2">
        {tasks.map((task, idx) => (
          <Draggable draggableId={task.id} index={idx} key={task.id}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                <TaskCard
                  id={task.id}
                  title={task.title}
                  priority={task.priority}
                  estimate={task.estimate}
                  assignee={task.assignee}
                  dueDate={task.dueDate}
                  onClick={() => onCardClick && onCardClick(task)}
                  onTitleEdit={(newTitle) =>
                    editTaskTitle(task.id, columnId, newTitle)
                  }
                />
              </div>
            )}
          </Draggable>
        ))}
      </div>
    </div>
  );
};

export default Column;
