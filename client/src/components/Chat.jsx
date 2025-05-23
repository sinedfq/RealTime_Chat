import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

import icon from "../images/emoji.svg";
import styles from "../styles/Chat.module.css";
import { Messages } from './Messages';

const socket = io.connect("http://localhost:5000");
const trimStr = (str) => (str || "").trim().toLowerCase();

const Chat = () => {
  const [state, setState] = useState([]);
  const { search } = useLocation();
  const [params, setParams] = useState({ room: "", name: "" });
  const [message, setMessage] = useState("");
  const [isOpen, setOpen] = useState(false);
  const [users, setUsers] = useState(0);
  const [userList, setUserList] = useState([]);
  const [creator, setCreator] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = Object.fromEntries(new URLSearchParams(search));
    setParams(searchParams);
    socket.emit("join", searchParams);
  }, [search]);

  useEffect(() => {
    socket.on("message", ({ data }) => {
      setState((_state) => [..._state, data]);
    });

    socket.on("room", ({ data: { users, creator } }) => {
      setUsers(users.length);
      const names = users.map(user => user.name);
      setUserList(names);
      setCreator(creator || "");
    });

    socket.on('kicked', () => {
      alert('Вы были исключены из чата.');
      socket.disconnect();
      navigate("/");
    });

    return () => {
      socket.off("message");
      socket.off("room");
      socket.off('kicked');
    };
  }, [navigate]);

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

  const filteredUsers = userList.filter(user =>
    user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>{params.room}</div>
        <div className={styles.users}>В комнате сейчас - {users}</div>
        <button className={styles.left} onClick={leftRoom}>
          Покинуть чат
        </button>
      </div>

      <div className={styles.messages}>
        <Messages messages={state} name={params.name} />
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.input}>
          <input
            type='text'
            name='message'
            placeholder='Ваше сообщение'
            value={message}
            onChange={handleChange}
            autoComplete='off'
            required
          />
        </div>
        <div className={styles.emoji}>
          <img src={icon} alt="" onClick={() => setOpen(!isOpen)} />
          {isOpen && (
            <div className={styles.emojis}>
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>
        <div className={styles.button}>
          <input type='submit' value="Отправить" />
        </div>
      </form>

      <div className={styles.userList}>
        <h3>Участники:</h3>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        <ul>
          {filteredUsers.map((user, index) => (
            <li key={index}>
              {user}
              {params.name && creator &&
                trimStr(params.name) === trimStr(creator) &&
                trimStr(user) !== trimStr(params.name) && (
                  <button
                    onClick={() => handleKick(user)}
                    className={styles.kickButton}
                  >
                    Исключить
                  </button>
                )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Chat;