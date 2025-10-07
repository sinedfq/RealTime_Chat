import { trimStr  } from "./utils.js";
let users = [];

/* Function to kick user from room by admin */
export const kickUser = (params) => {
    let index;
    if (params.id) {
        index = users.findIndex(user => user.id === params.id);
    } else {
        index = users.findIndex(user => 
            user.room === params.room && 
            user.name === params.name
        );
    }
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
    return null;
};

/* Functions to find user by id or username at room */
export const findUserById = (id) => {
    return users.find(user => user.id === id);
};

export const findUser = ({name, room}) => {
    const userName = trimStr(name);
    const userRoom = trimStr(room);
    return users.find(u => 
        trimStr(u.name) === userName && 
        trimStr(u.room) === userRoom
    );
};

/* The function addUser is designed to add a new user to a specific room in a socket-based application */
export const addUser = ({socket, name, room}) => {
    const existingUser = findUser({name, room});
    if (existingUser) {
        return { user: existingUser, isExist: true };
    }
    
    const user = { id: socket.id, name, room };
    users.push(user);
    return { user, isExist: false };
};

/* A function to get all users out of a room */
export const getRoomUsers = (room) => {
    return users.filter(u => u.room === room);
};

/* Function to remove one user from the room */
export const removeUser = ({id, name, room}) => {
    const userToRemove = id ? 
        findUserById(id) : 
        findUser({name, room});
    
    if (userToRemove) {
        users = users.filter(user => user.id !== userToRemove.id);
    }
    return userToRemove;
};

/* Function for clear all users */
export const clearAllUsers = () => {
    users = [];
};
