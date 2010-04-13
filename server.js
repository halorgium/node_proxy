process.paths.push(".");

var sys = require("sys");
var buftok = require("buftok");

var port = process.argv[2];
if (!port) {
  sys.puts("No port specified");
  process.exit(1);
}

var tcp = require('tcp');
var server = tcp.createServer(function (socket) {
  var tokn = buftok.build();

  socket.setEncoding("utf8");
  socket.addListener("connect", function () {
    socket.write("hello\r\n");
  });
  socket.addListener("data", function (data) {
    tokn.extract(data).forEach(function (line) {
      if (line == "quit") {
        socket.close();
      }
      else {
        socket.write(data);
      }
    });
  });
  socket.addListener("end", function () {
    if (socket.readyState == "writeOnly" || socket.readyState == "open") {
      socket.write("goodbye\r\n");
    }
    socket.close();
  });
});

sys.puts("Listening on port " + port);
server.listen(port, "localhost");
