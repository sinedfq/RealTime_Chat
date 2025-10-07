import redis from "redis";

const redisClient = redis.createClient({
  socket: {
    host: "localhost",
    port: 6379
  }
});

redisClient.connect()
  .then(() => console.log("Connected to Redis"))
  .catch(err => console.error("Redis connection error:", err));

export const saveMessageToRedis = async (message) => {
  try {
    // Кладём сообщение в список по ключу = имя комнаты
    const key = `room:${message.room}:messages`;
    await redisClient.rPush(key, JSON.stringify(message));
  } catch (err) {
    console.error("Error saving message to Redis:", err);
  }
};

export const getMessagesFromRedis = async (room, limit = 50) => {
  try {
    const key = `room:${room}:messages`;
    // получаем последние N сообщений (например, 50)
    const messages = await redisClient.lRange(key, -limit, -1);
    return messages.map(msg => JSON.parse(msg));
  } catch (err) {
    console.error("Error fetching messages from Redis:", err);
    return [];
  }
};