const express = require("express")
const http = require("http")
const app = express()
const server = http.createServer(app)
const io = require("socket.io")(server, {
	cors: {
		origin: "https://wemeat.onrender.com",
		methods: [ "GET", "POST" ]
	}
})

const activeCalls = {}; // A map to store active calls by ID

io.on("connection", (socket) => {
    socket.emit("me", socket.id);

    socket.on("disconnect", () => {
        // Handle disconnection and remove from active calls
        for (const callId in activeCalls) {
            if (activeCalls[callId].includes(socket.id)) {
                activeCalls[callId] = activeCalls[callId].filter(id => id !== socket.id);
                if (activeCalls[callId].length === 0) {
                    delete activeCalls[callId];
                }
                break;
            }
        }
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", (data) => {
        // Update the logic to handle multiple users per call ID
        if (!activeCalls[data.userToCall]) {
            activeCalls[data.userToCall] = [];
        }
        activeCalls[data.userToCall].push(socket.id);

        for (const id of activeCalls[data.userToCall]) {
            io.to(id).emit("callUser", { signal: data.signalData, from: data.from, name: data.name });
        }
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });
});

server.listen(5000, () => console.log("Server is running on port 5000"));
