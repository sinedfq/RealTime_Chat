const { trimStr } = require("./utils");
let users = [];

const kickUser = (params) => {
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
    return null; // Явное возвращение null если пользователь не найден
};

const findUserById = (id) => {
    return users.find(user => user.id === id);
};

const findUser = ({name, room}) => {
    const userName = trimStr(name);
    const userRoom = trimStr(room);
    return users.find(u => 
        trimStr(u.name) === userName && 
        trimStr(u.room) === userRoom
    );
};

const addUser = ({socket, name, room}) => {
    const existingUser = findUser({name, room});
    if (existingUser) {
        return { user: existingUser, isExist: true };
    }
    
    const user = { id: socket.id, name, room };
    users.push(user);
    return { user, isExist: false };
};

const getRoomUsers = (room) => {
    return users.filter(u => u.room === room);
};

const removeUser = ({id, name, room}) => {
    const userToRemove = id ? 
        findUserById(id) : 
        findUser({name, room});
    
    if (userToRemove) {
        users = users.filter(user => user.id !== userToRemove.id);
    }
    return userToRemove;
};

// Новая функция для очистки всех пользователей
const clearAllUsers = () => {
    users = [];
};

module.exports = { 
    addUser, 
    findUser, 
    getRoomUsers, 
    removeUser, 
    kickUser, 
    findUserById,
    clearAllUsers // Добавляем новую функцию
};