import { addUser, findUser, getRoomUsers, removeUser, findUserById } from "./users.js";
import { saveMessageToRedis, getMessagesFromRedis } from "./redis.js";
import { allowedOrgins } from "./constants.js";
import { Server } from "socket.io";
import route from "./route.js";
import express from "express";
import http from "http";
import cors from "cors";

const app = express();
const activeRooms = new Set();
const roomCreators = new Map();

app.use(cors({ origin: allowedOrgins, credentials: true }));
app.use(route);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: allowedOrgins, methods: ["GET", "POST"] },
});

/* Funtcion for system messages */
const makeSystemMessage = (text) => ({
    id: Date.now(),
    text,
    user: { name: "Admin" },
    timestamp: new Date().toISOString()
});

const trimStr = (str) => (str || "").trim().toLowerCase();
io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);
    socket.emit('roomsList', Array.from(activeRooms));

    socket.on("typing", ({ room, user }) => {
        socket.broadcast.to(room).emit("typing", { user });
    });

    socket.on("stopTyping", ({ room, user }) => {
        socket.broadcast.to(room).emit("stopTyping", { user });
    });


    socket.on("join", async ({ name, room }) => {
        try {
            const trimmedRoom = trimStr(room);
            const trimmedName = trimStr(name);

            socket.join(trimmedRoom);

            if (!activeRooms.has(trimmedRoom)) {
                activeRooms.add(trimmedRoom);
                roomCreators.set(trimmedRoom, trimmedName);
            }

            const { user, isExist } = addUser({ socket, name: trimmedName, room: trimmedRoom });

            socket.emit("message", { data: makeSystemMessage(isExist ? `${user.name}, с возвращением` : `Привет, ${user.name}`) });
            const history = await getMessagesFromRedis(trimmedRoom);
            if (history.length > 0) {
                socket.emit("messageHistory", history);
            }

            socket.broadcast.to(user.room).emit("message", { data: makeSystemMessage(`${user.name} подключился`) });

            io.to(user.room).emit("room", { data: { users: getRoomUsers(user.room), creator: roomCreators.get(user.room) } });
        } catch (err) {
            console.error("Error sending message:", err);
            socket.emit('messageError', { error: 'Failed to send message' });
        }
    });

    socket.on('sendMessage', async ({ message, params }) => {
        try {
            const user = findUser(params);
            if (!user) return;

            const messageData = {
                id: Date.now(),
                text: message,
                user: { id: user.id, name: user.name },
                room: user.room,
                timestamp: new Date().toISOString()
            };

            await saveMessageToRedis(messageData);

            io.to(user.room).emit("message", { data: messageData });
        } catch (err) {
            console.error("Error sending message:", err);
            socket.emit('messageError', { error: 'Failed to send message' });
        }
    });

    socket.on('leftRoom', ({ params }) => {
        const user = removeUser(params);
        if (!user) return;

        io.to(user.room).emit("message", { data: makeSystemMessage(`${user.name} покинул комнату`) });
        io.to(user.room).emit("room", { data: { users: getRoomUsers(user.room) } });
    });

    socket.on('kickUser', ({ userToKick, room }) => {
        const trimmedRoom = trimStr(room);
        const creator = roomCreators.get(trimmedRoom);
        const requester = findUserById(socket.id);

        if (requester && trimStr(requester.name) === trimStr(creator)) {
            const user = findUser({ name: userToKick, room: trimmedRoom });
            if (!user) return;

            const kickedSocket = io.sockets.sockets.get(user.id);
            if (kickedSocket) {
                kickedSocket.emit('kicked');
                kickedSocket.leave(trimmedRoom);
            }

            removeUser({ id: user.id });

            io.to(trimmedRoom).emit("message", { data: makeSystemMessage(`${userToKick} был исключен`) });
            io.to(trimmedRoom).emit("room", { data: { users: getRoomUsers(trimmedRoom) } });
        }
    });

    socket.on("disconnect", () => {
        const user = removeUser({ id: socket.id });
        if (!user) return;

        io.to(user.room).emit("message", { data: makeSystemMessage(`${user.name} отключился`) });
        io.to(user.room).emit("room", { data: { users: getRoomUsers(user.room) } });

        console.log(`Disconnected: ${socket.id}`);
    });
});

server.listen(5000, () => console.log("Server is running on port 5000"));
