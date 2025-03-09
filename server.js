const app = require("./app");
const events = require("events");

events.EventEmitter.defaultMaxListeners = 20;

const SERVER = process.env.SERVER;

app.listen(SERVER, () => {
  console.log(`SERVER IS ACTIVE AT http://localhost:${SERVER}`);
});
