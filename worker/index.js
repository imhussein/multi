const redis = require("redis");
const { REDIS_URL, REDIS_PORT } = require("./keys");

const redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT,
  retry_strategy: () => 1000
});

const redisSubscriber = redisClient.duplicate();

function fib(index) {
  if (index < 2) {
    return 1;
  }
  return fib(index - 1) + fib(index - 2);
}

redisSubscriber.on("message", (channel, message) => {
  redisClient.hset("values", message, fib(parseInt(message)));
});

redisSubscriber.subscribe("insert");
