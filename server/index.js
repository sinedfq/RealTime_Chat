const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const app = express();

const route = require('./route');
const { addUser, findUser, getRoomUsers, removeUser, kickUser, findUserById } = require("./users");
const activeRooms = new Set();
const roomCreators = new Map();

/* Enabling CORS for all origins */
app.use(cors({ origin: "*" }));
app.use(route);

/* Creating HTTP server */
const server = http.createServer(app);

/* Creating Socket.IO server */
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

/* Function to trim and lowercase strings */
const trimStr = (str) => (str || "").trim().toLowerCase();

/*Handling new connections */
io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);

    socket.emit('roomsList', Array.from(activeRooms));

    /* Handling room joining */
    socket.on("join", ({ name, room }) => {
        const trimmedRoom = trimStr(room);
        const trimmedName = trimStr(name);

        // Joining the specified room
        socket.join(trimmedRoom);

        if (!activeRooms.has(trimmedRoom)) {
            activeRooms.add(trimmedRoom);
            roomCreators.set(trimmedRoom, trimmedName);
            console.log(`New room created: ${trimmedRoom} by ${trimmedName}`);
        }

        const { user, isExist } = addUser({
            socket,
            name: trimmedName,
            room: trimmedRoom
        });

        const userMessage = isExist ?
            `${user.name}, welcome back` :
            `Hello, ${user.name}`;

        socket.emit("message", {
            data: { user: { name: "Admin" }, message: userMessage }
        });

        // Notifying others in the room
        socket.broadcast.to(user.room).emit("message", {
            data: { user: { name: "Admin" }, message: `${user.name} has joined` }
        });

        // Sending updated room users list
        io.to(user.room).emit("room", {
            data: {
                users: getRoomUsers(user.room),
                creator: roomCreators.get(user.room)
            }
        });
    });

    /* Handling user kick */
    socket.on('kickUser', ({ userToKick, room }) => {
        const trimmedRoom = trimStr(room);
        const creator = roomCreators.get(trimmedRoom);
        const requester = findUserById(socket.id);

        console.log('Kick attempt:', {
            creator,
            requester: requester?.name,
            userToKick,
            room: trimmedRoom,
            users: getRoomUsers(trimmedRoom)
        });

        // Checking if requester is the creator
        if (requester && trimStr(requester.name) === trimStr(creator)) {
            const user = findUser({
                name: userToKick,
                room: trimmedRoom
            });

            if (user) {
                const kickedSocket = io.sockets.sockets.get(user.id);
                if (kickedSocket) {
                    kickedSocket.emit('kicked');
                    kickedSocket.leave(trimmedRoom);
                }

                removeUser({ id: user.id });

                io.to(trimmedRoom).emit('message', {
                    data: {
                        user: { name: "Admin" },
                        message: `${userToKick} был исключен`
                    }
                });
                io.to(trimmedRoom).emit("room", {
                    data: {
                        users: getRoomUsers(trimmedRoom),
                    }
                });
            }
        }
    });

    /* Handling message sending */
    socket.on('sendMessage', ({ message, params }) => {
        const user = findUser(params);
        if (user) {
            io.to(user.room).emit("message", {
                data: { user, message }
            });
        }
    });

    /* Handling user leaving the room */
    socket.on('leftRoom', ({ params }) => {
        // Removing user
        const user = removeUser(params);
        if (user) {
            io.to(user.room).emit('message', {
                data: {
                    user: { name: "Admin" },
                    message: `${user.name} has left`
                }
            });
            // Sending updated room users list
            io.to(user.room).emit("room", {
                data: {
                    users: getRoomUsers(user.room)
                }
            });
        }
    });

    /* Handling user disconnection */
    socket.on("disconnect", () => {
        const user = removeUser({ id: socket.id });
        if (user) {
            io.to(user.room).emit('message', {
                data: {
                    user: { name: "Admin" },
                    message: `${user.name} has disconnected`
                }
            });
            // Sending updated room users list
            io.to(user.room).emit("room", {
                data: {
                    users: getRoomUsers(user.room)
                }
            });
        }
        console.log(`Disconnected: ${socket.id}`);
    });
});

server.listen(5000, () => {
    console.log("Server is running on port 5000");
});