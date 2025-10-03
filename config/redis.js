const { createClient } = require("redis");

const redisClient = createClient({
  url: "redis://127.0.0.1:6379" // chỉnh lại nếu Redis không chạy local
});

redisClient.on("error", (err) => console.error("❌ Redis error:", err));

(async () => {
  await redisClient.connect();
  console.log("✅ Connected to Redis");
})();

module.exports = redisClient;
