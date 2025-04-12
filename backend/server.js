const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Initial tasks for demo purposes
let tasks = {
  requested: [],
  todo: [],
  inProgress: [],
  completed: [],
};

io.on("connection", (socket) => {
  console.log("A user connected");

  // Emit current tasks when a user connects
  socket.emit("tasks", tasks);

  // Add a new task
  socket.on("addTask", (task) => {
    if (!tasks[task.stage]) {
      tasks[task.stage] = []; // If the stage doesn't exist, initialize it
    }
    tasks[task.stage].push(task);
    io.emit("tasks", tasks); // Emit the updated task list to all clients
    console.log(`New Task Added: ${task.title}`);
  });

  // Update an existing task
  socket.on("updateTask", (updatedTask) => {
    let taskFound = false;
    Object.keys(tasks).forEach((stage) => {
      tasks[stage] = tasks[stage].map((task) => {
        if (task.id === updatedTask.id) {
          taskFound = true;
          return updatedTask; // Return the updated task
        }
        return task; // Return the task without any changes
      });
    });

    if (taskFound) {
      io.emit("tasks", tasks); // Emit the updated task list to all clients
      console.log(`Task updated: ${updatedTask.title}`);
    } else {
      console.log("Task not found for update");
    }
  });

  // Delete a task
  socket.on("deleteTask", (taskId) => {
    let taskFound = false;
    Object.keys(tasks).forEach((stage) => {
      tasks[stage] = tasks[stage].filter((task) => {
        if (task.id === taskId) {
          taskFound = true;
          return false; // Remove the task
        }
        return true; // Keep the task
      });
    });

    if (taskFound) {
      io.emit("tasks", tasks); // Emit the updated task list to all clients
      console.log(`Task deleted: ${taskId}`);
    } else {
      console.log("Task not found for deletion");
    }
  });

  // Handle user disconnecting
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
