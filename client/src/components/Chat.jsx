import React, { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import EmojiPicler from 'emoji-picker-react';

import icon from "../images/emoji.svg";
import styles from "../styles/Chat.module.css";
import { Messages } from './Messages';

const socket = io.connect("http://localhost:5000");

const Chat = () => {
  const [state, setState] = useState([]);
  const { search } = useLocation();
  const [params, setParams] = useState({ room: "", user: "" });
  const [message, setMessage] = useState("");
  const [isOpen, setOpen] = useState(false);
  const [users, setUsers] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = Object.fromEntries(new URLSearchParams(search));
    setParams(searchParams);
    socket.emit("join", searchParams);

  }, [search]);

  useEffect(() => {
    socket.on("message", ({ data }) => {
      setState((_state) => ([..._state, data]));
    });
  }, []);

  useEffect(() => {
    socket.on("room", ({ data: { users } }) => {
      setUsers(users.length);
    });
  }, []);

  const leftRoom = () => { 
    socket.emit("leftRoom", {params});
    navigate("/");
  };

  const handleChange = ({ target: { value } }) => setMessage(value);
  const onEmojiClick = (emojiData) => {
    setMessage(prevMessage => `${prevMessage}${emojiData.emoji}`);
  };
  const handleSumbit = (e) => {
    e.preventDefault();

    if (!message) return;

    socket.emit('sendMessage', { message, params });

    setMessage("");
  };


  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>
          {params.room}
        </div>
        <div className={styles.users}>В комнате сейчас - {users}</div>
        <button className={styles.left} onClick={leftRoom}>
          Покинуть чат
        </button>
      </div>

      <div className={styles.messages}>
        <Messages messages={state} name={params.name} />
      </div>

      <form className={styles.form} onSubmit={handleSumbit}>
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
              <EmojiPicler onEmojiClick={onEmojiClick} />
            </div>
          )}
        </div>

        <div className={styles.button}>
          <input type='submit' onSubmit={handleSumbit} value="Отправить" />
        </div>
      </form>
    </div>
  )
}

export default Chat