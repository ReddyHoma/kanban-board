import { io } from "socket.io-client";

// Connect to the socket server (adjust URL if necessary)
const socket = io("http://localhost:5000");

export default socket;
