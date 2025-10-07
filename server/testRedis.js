import { getMessagesFromRedis } from './redis.js';

(async () => {
  try {
    const room = "1"; // или название нужной комнаты
    const messages = await getMessagesFromRedis(room);

    console.log(`Messages in room "${room}":`);
    messages.forEach(msg => {
      console.log(`[${msg.timestamp}] ${msg.user.name}: ${msg.text}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error("Error reading messages:", err);
    process.exit(1);
  }
})();
