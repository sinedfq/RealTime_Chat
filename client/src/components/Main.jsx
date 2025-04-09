import React, { useState } from 'react';
import styles from "../styles/Main.module.css"
import { Link } from 'react-router-dom';

const FIELDS = {
    USERNAME: "username",
    ROOM: "room",
};

const Main = () => {

    const { USERNAME, ROOM } = FIELDS;

    const [values, setValues] = useState({ [USERNAME]: "", [ROOM]: ""});

    const handleChange = ({target: {value, name}}) => {
        setValues({ ...values, [name]: value});
    };

    const handleClick = (e) => {
        const isDisabled = Object.values(values).some((value) => !value);

        if (isDisabled) e.preventDefault();
    }

    return (
        <div className={styles.wrap}>
            <div className={styles.container}>
                <h1 className={styles.heading}>Join</h1>

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
                        <input
                            type='text'
                            name='room'
                            value={values[ROOM]}
                            placeholder='Комната'
                            className={styles.input}
                            onChange={handleChange}
                            autoComplete='off'
                            required />
                    </div>

                    <Link to={`/chat?name=${values[USERNAME]}&room=${values[ROOM]}`} className={styles.group} onClick={handleClick}>
                        <button type='submit' className={styles.button}>
                            Войти
                        </button>
                    </Link>
                </form>
            </div>
        </div>
    )
}

export default Main