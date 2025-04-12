import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import socket from "../socket"; // Assuming you have a socket instance

const KanbanBoard = () => {
  const [tasks, setTasks] = useState({
    requested: [],
    todo: [],
    inProgress: [],
    completed: [],
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    stage: "Requested", // Default stage
  });
  const [showModal, setShowModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null); // For editing tasks

  useEffect(() => {
    // Listen for the tasks from the server
    socket.on("tasks", (tasksData) => {
      if (tasksData && tasksData.data) {
        setTasks({
          requested: tasksData.data.requested || [],
          todo: tasksData.data.todo || [],
          inProgress: tasksData.data.inProgress || [],
          completed: tasksData.data.completed || [],
        });
      } else {
        console.error("Received invalid task data:", tasksData);
      }
    });
  
    // Cleanup listener on component unmount
    return () => {
      socket.off("tasks");
    };
  }, []);
  

  const addTask = () => {
    if (newTask.title.trim() === "") {
      return; // Don't add empty tasks
    }

    // Emit the 'addTask' event to the server
    socket.emit("addTask", newTask);

    // Clear the form input after emitting the task
    setNewTask({
      title: "",
      description: "",
      stage: "Requested",
    });
    setShowModal(false); // Close the modal after adding the task
  };

  const editTask = (task) => {
    setCurrentTask(task); // Set the task to be edited
    setNewTask({
      title: task.title,
      description: task.description,
      stage: task.stage,
    });
    setShowModal(true); // Show the modal for editing
  };

  const updateTask = () => {
    // Emit the 'updateTask' event to the server with the updated task
    socket.emit("updateTask", currentTask);

    // Close the modal after updating the task
    setShowModal(false);
  };

  const deleteTask = (taskId) => {
    // Emit the 'deleteTask' event to the server
    socket.emit("deleteTask", taskId);
  };

  const onDragEnd = (result) => {
    const { destination, source } = result;

    if (!destination) return; // If there's no destination, do nothing

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const movedTask = tasks[sourceCol][source.index];

    if (!movedTask) return;

    // Create a deep copy of tasks
    const newTasks = {
      requested: "Requested",
      todo: "To Do",
      inProgress: "In Progress",
      completed: "Completed",
    }[destCol];

    newTasks[sourceCol].splice(source.index, 1);
    newTasks[destCol].splice(destination.index, 0, movedTask);

    // Emit the updated task list to the server
    socket.emit("updateTask", movedTask);

    setTasks(newTasks); // Update state with the new task order
  };

  return (
    <div className="p-6">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(tasks).map(([colId, taskList]) => (
            <Droppable key={colId} droppableId={colId} isCombineEnabled={false} isDropDisabled={false} ignoreContainerClipping={false}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-gray-100 p-4 rounded-lg shadow-md min-h-[300px] border border-gray-200"
                >
                  <h2 className="text-lg font-bold capitalize mb-2 text-gray-800">{colId}</h2>
                  <div className="mt-2">
                    {taskList.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mt-2 p-4 bg-white shadow-md rounded-md flex justify-between items-center transition ${snapshot.isDragging ? "ring-2 ring-blue-400" : ""
                              }`}
                          >
                            <div>
                              <h3 className="font-semibold text-gray-800">{task.title}</h3>
                              <p className="text-sm text-gray-500">{task.description}</p>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => editTask(task)}
                                className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {/* Add/Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-xl font-bold mb-4">{currentTask ? "Edit Task" : "Add Task"}</h3>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Task Title"
              className="mb-2 p-2 border rounded w-full"
            />
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              placeholder="Task Description"
              className="mb-2 p-2 border rounded w-full"
            />
            <select
              value={newTask.stage}
              onChange={(e) => setNewTask({ ...newTask, stage: e.target.value })}
              className="mb-2 p-2 border rounded w-full"
            >
              <option value="Requested">Requested</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={currentTask ? updateTask : addTask}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {currentTask ? "Update Task" : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
