// socketTest.js
const { io } = require("socket.io-client");

const s1 = io("http://localhost:3000", { auth: { userId: 1 } });
const s2 = io("http://localhost:3000", { auth: { userId: 2 } });

s1.on("match_found", (d) => console.log("P1:", d));
s2.on("match_found", (d) => console.log("P2:", d));

setTimeout(() => {
  s1.emit("join_queue");
  s2.emit("join_queue");
}, 1000);
