import React from 'react'
import styles from "../styles/Chat.module.css";

export const Messages = ({ messages, name }) => {
    return (
        <div className={styles.messages}>
            {messages.map(({ user, text, timestamp }, i) => { // используем text
                const itsMe = user.name.trim().toLowerCase() === name.trim().toLowerCase();
                const className = itsMe ? styles.me : styles.user;

                const time = timestamp
                    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                return (
                    <div key={i} className={`${styles.message} ${className}`}>
                        <span className={styles.user}>{user.name}</span>
                        <div className={styles.text}>{text}</div>
                        <span className={styles.timestamp}>{time}</span>
                    </div>
                )
            })}
        </div>
    )
}
