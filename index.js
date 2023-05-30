const http = require("http");
const serverFunction = require('./backEnd/index.js');
const server = http.createServer(serverFunction);

server.listen(3000, "127.0.0.1", () => {
  console.log(`Server running...`);
});
