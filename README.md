<h1>Real-Time Chat</h1>

<h3>Задание: </h3>

```
Написать real-time чат, который позволит пользователям в общем канале оправлять и получать
сообщения друг друга.

Функционал
— Переписка должна осуществляться в реальном времени;
— Пользователи могут создать свой канал для общения или подключиться к существующему;
— В каждом канале должны отображаться участники переписки;
— Необходимо реализовать поиск юзеров;
— У приложения должен быть приятный UI;
— Создатель канала должен иметь возможность удалять пользователей из канала.

ТРЕБОВАНИЯ К ТЕХНОЛОГИЯМ
Стандартный стек: HTML + JS + CSS
Выбор библиотек и фреймворков: по желанию кандидата, но приветствуется использование react.js/
vue.js
```

-----

<h3>Использованные технологии:</h3>

1. HTML/CSS
2. JavaScript
3. React JS
4. Socket IO
5. Node.JS

-----

<h3>Инструкция по запуску:</h3>

1. Перейти в папку сервера
```bash
cd server/
```
2. Запустить сервер
```bash
npm run dev
```
3. Открыть вторую консоль и перейти в папку клиента
```bash
cd client/
```
4. Запустить код клиента
```bash
npm start
```
5. После успешного запуска клиента откроется окно браузера с проектом
5.1. В случае если окно браузера не открылось ссылка на проект отобразиться в консоли
   
   ![image](https://github.com/user-attachments/assets/ab806442-cf2f-4b26-876c-c982ce2d0b9b)

----

<h3>Внешний вид проекта:</h3>

Страница входа в комнату с возможностью выбора уже существующей комнаты или создание новой комнаты, указание имени пользователя:
![image](https://github.com/user-attachments/assets/5121038f-61d8-484e-9dcf-6c9d4ceb145b)

Страница основного приложения Real-Time чат:
![image](https://github.com/user-attachments/assets/2aac7e28-4459-484a-be93-1a5c07cf9093)


Уведомление об отключении пользователя администратором (список участников обновляется автоматически)
![image](https://github.com/user-attachments/assets/f94885b1-63ee-41a0-a9ae-2f7b411ab48f)

![image](https://github.com/user-attachments/assets/888c57f3-04b1-468a-a540-6c2c7862f0ff)

Переписка (сообщения отправленные самим пользователем выделы)
![image](https://github.com/user-attachments/assets/7b4bce03-a8e7-4279-a2cb-ef75ac89d869)


----

<h3>Техническое описание:</h3>

index.js
```javascript
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
            `${user.name}, с возвращением` :
            `Привет, ${user.name}`;

        socket.emit("message", {
            data: { user: { name: "Admin" }, message: userMessage }
        });

        // Notifying others in the room
        socket.broadcast.to(user.room).emit("message", {
            data: { user: { name: "Admin" }, message: `${user.name} подключился` }
        });
```
Данный участок кода отвечает за обработку подключения пользователей к комнате. В случае если комнаты раньше не существовало, то первый зашедший в комнату пользователь будет считаться её создателем и будет записан в массив в функции addUser, которая расположена в файле users.js
```javascript
let users = [];

/* Другие функции */

/* The function addUser is designed to add a new user to a specific room in a socket-based application */
const addUser = ({socket, name, room}) => {
    const existingUser = findUser({name, room});
    if (existingUser) {
        return { user: existingUser, isExist: true };
    }
    
    const user = { id: socket.id, name, room };
    users.push(user);
    return { user, isExist: false };
};
```

```javascript
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
```
Функция исключения пользователя получает индификатор пользователя, который её создал, и пользователя, которого хотят исключить. В случае если все условия выполнены, то пользователя отключает и удаляет его из списка подключенных пользователей через функцию removeUser от текущей комнаты и список usersList обновляется.

```javascript
/* Function to kick user from the room */
  const handleKick = (userToKick) => {
    socket.emit('kickUser', { userToKick, room: params.room });
  };

  /* Function to leave user from the room */
  const leftRoom = () => {
    socket.emit("leftRoom", { params });
    navigate("/");
  };

  /* Tracking changes at input field */
  const handleChange = ({ target: { value } }) => setMessage(value);

  /* Tracking click on emoji icon */
  const onEmojiClick = (emojiData) => {
    setMessage(prevMessage => `${prevMessage}${emojiData.emoji}`);
  };

  /* Function for send message from user to chat */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message) return;
    socket.emit('sendMessage', { message, params });
    setMessage("");
  };

  /* Search funtion */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
```
Данный участок кода из файла ```chat.jsx``` отвечает за коррекную работу чата, обработку действий пользователя, таких как: написания сообщения в поле ```input```, вызов окна с эмодзи, покидание комнаты и так далее. Функция ```navigate``` используется для переадресации пользователя на страницу входа в комнату.

```javascript
const AppRoutes = () => {
    return (
        <Routes>
            <Route path = "/" element = {<Main />} />
            <Route path = "/chat" element = {<Chat />} />
        </Routes>
    )
}
```
Данный участок кода из файла ```Approutes.jsx``` отвечает за навигацию по проекту:
1. Первый роут ``` "/" ``` отвечает за страницу, где пользователь выбирает зайти в комнату или создать её.
2. Второй роут ``` "/chat" ``` отвечает за страницу чата

```javascript 
    const handleRoomSelect = (e) => {
        setValues({ ...values, [ROOM]: e.target.value });
        setShowNewRoomInput(false);
    };

    /* Clears the room value in the state and shows the input for creating a new room */
    const handleNewRoomClick = () => {
        setValues({ ...values, [ROOM]: "" });
        setShowNewRoomInput(true);
    };
```
Данный участок кода из файла ```main.jsx``` отвечает за обработку подключения пользователя: создание новой комнаты или подключение к существующей.

```javascript
    /* Checks if the required fields (USERNAME and ROOM) are filled */
    const handleClick = (e) => {
        const isDisabled = !values[USERNAME] || !values[ROOM];
        // If the fields are not filled, prevents the default action
        if (isDisabled) e.preventDefault();
    };
```
Проверка, что все поля заполнены, в случае если какое-то из полей пустое выводить ошибку

