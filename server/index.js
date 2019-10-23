const express = require("express");
const redis = require("redis");
const { Pool } = require("pg");
const cors = require("cors");
const bodyParser = require("body-parser");
const {
  PG_DATABASE,
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  REDIS_PORT,
  REDIS_URL
} = require("./keys");
const redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT,
  retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();
const conn = new Pool({
  port: PG_PORT,
  user: PG_USER,
  password: PG_PASSWORD,
  database: PG_DATABASE,
  host: PG_HOST
});
conn.on("error", function() {
  console.log(`Failed To Connect TO POSTGRES`);
});
conn.query("CREATE TABLE IF NOT EXISTS values (Number INT)").catch(err => {
  console.log(err);
});
const app = express();
app.use(cors());
app.use(express.json());
app.get("/", function(req, res) {
  res.send("success");
});

app.get("/values/all", async (req, res) => {
  const values = await conn.query("SELECT * FROM values");
  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const { index } = req.body;
  if (parseInt(index) > 40) {
    return res.status(422).send("VALUES IS HIGH");
  }
  redisClient.hset("values", index, "NOT YET");
  redisPublisher.publish("insert", index);
  conn.query("INSERT INTO values (Number) VALUES($1)", [index]);
  res.send({ working: true });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server Connected On PORT ${port}`);
});
