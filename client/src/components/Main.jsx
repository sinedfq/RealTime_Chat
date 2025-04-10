import React, { useState, useEffect } from 'react';
import styles from "../styles/Main.module.css";
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

const FIELDS = {
    USERNAME: "username",
    ROOM: "room",
};

const socket = io.connect("http://localhost:5000");

const Main = () => {
    const { USERNAME, ROOM } = FIELDS;
    const [values, setValues] = useState({ [USERNAME]: "", [ROOM]: "" });
    const [existingRooms, setExistingRooms] = useState([]);
    const [showNewRoomInput, setShowNewRoomInput] = useState(false);

    /* Getting a list of all existing rooms */
    useEffect(() => {
        socket.emit('getRooms');
        socket.on('roomsList', (rooms) => {
            setExistingRooms(rooms);
        });

        return () => {
            socket.off('roomsList');
        };
    }, []);

    /* Updates the state with the new value for the corresponding input field */
    const handleChange = ({ target: { value, name } }) => {
        setValues({ ...values, [name]: value });
    };

    /* Updates the room value in the state and hides the input for creating a new room */
    const handleRoomSelect = (e) => {
        setValues({ ...values, [ROOM]: e.target.value });
        setShowNewRoomInput(false);
    };

    /* Clears the room value in the state and shows the input for creating a new room */
    const handleNewRoomClick = () => {
        setValues({ ...values, [ROOM]: "" });
        setShowNewRoomInput(true);
    };

    /* Checks if the required fields (USERNAME and ROOM) are filled */
    const handleClick = (e) => {
        const isDisabled = !values[USERNAME] || !values[ROOM];
        // If the fields are not filled, prevents the default action
        if (isDisabled) e.preventDefault();
    };

    return (
        <div className={styles.wrap}>
            <div className={styles.container}>
                <h1 className={styles.heading}>Выбрать чат</h1>

                <form className={styles.form}>
                    <div className={styles.group}>
                        <input
                            type='text'
                            name='username'
                            value={values[USERNAME]}
                            placeholder='Никнейм'
                            className={styles.input}
                            onChange={handleChange}
                            autoComplete='off'
                            required
                        />
                    </div>

                    <div className={styles.group}>
                        {!showNewRoomInput ? (
                            <>
                                <select
                                    name='room'
                                    value={values[ROOM]}
                                    onChange={handleRoomSelect}
                                    className={styles.input}
                                    required
                                >
                                    <option value="">-- Выберите комнату --</option>
                                    {existingRooms.map((room, index) => (
                                        <option key={index} value={room}>
                                            {room}
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    type="button" 
                                    className={styles.newRoomButton}
                                    onClick={handleNewRoomClick}
                                >
                                    Создать новую комнату
                                </button>
                            </>
                        ) : (
                            <input
                                type='text'
                                name='room'
                                value={values[ROOM]}
                                placeholder='Название новой комнаты'
                                className={styles.input}
                                onChange={handleChange}
                                autoComplete='off'
                                required
                            />
                        )}
                    </div>

                    <Link 
                        to={`/chat?name=${values[USERNAME]}&room=${values[ROOM]}`} 
                        className={styles.group} 
                        onClick={handleClick}
                    >
                        <button type='submit' className={styles.button}>
                            {showNewRoomInput ? 'Создать комнату' : 'Войти'}
                        </button>
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default Main;