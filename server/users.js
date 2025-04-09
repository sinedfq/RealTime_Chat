const { trimStr } = require("./utils")
let users = [];

const kickUser = (params) => {
    let index;
    if (params.id) {
        index = users.findIndex((user) => user.id === params.id);
    } else {
        index = users.findIndex((user) => user.room === params.room && user.name === params.name);
    }
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
};


const findUserById = (id) => {
    return users.find(user => user.id === id);
};

const findUser = (user) => {
    const userName = trimStr(user.name);
    const userRoom = trimStr(user.room);

    return users.find(
        (u) => trimStr(u.name) === userName && trimStr(u.room) === userRoom
    );
}

const addUser = ({socket, name, room }) => {
    const existingUser = users.find(user => user.room === room && user.name === name);
    
    if (existingUser) {
        return { user: existingUser, isExist: true };
    }
    
    const user = { id: socket.id, name, room };
    users.push(user);
    return { user, isExist: false };
};

const getRoomUsers = (room) => users.filter((u) => u.room === room);

const removeUser = (user) => {
    const found = findUser(user);
    if (found) {
        users = users.filter(
            ({ room, name }) => room === found.room && name !== found.name);
    }

    return found;
}

module.exports = { addUser, findUser, getRoomUsers, removeUser, kickUser, findUserById };