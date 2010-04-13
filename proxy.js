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
  var proxying = false;
  var port;
  var client;
  var tokn = buftok.build();

  socket.setEncoding("utf8");
  socket.addListener("connect", function () {
    socket.write("hello\r\n");
  });
  var listener = socket.addListener("data", function (data) {
    tokn.extract(data).forEach(function (line) {
      sys.puts("got line: " + line);
      if (client) {
        if (line == "disconnect") {
          socket.write("disconnecting from " + port + "\r\n");
          client.close();
        }
        else {
          if (proxying) {
            sys.puts("proxying: " + line);
            client.write(data);
          }
          else {
            socket.write("not yet ready to proxy to " + port + "\r\n");
          }
        }
        return;
      }

      var matches = line.match(/^connect (\d+)$/);
      sys.p(matches);
      if (matches && matches[1]) {
        port = matches[1];
        sys.puts("connecting to port " + port);
        client = tcp.createConnection(port, "localhost");
        client.addListener("connect", function () {
          proxying = true;
        });
        client.addListener("data", function (data) {
          socket.write(data);
        });
        client.addListener("end", function () {
          if (socket.readyState == "writeOnly" || socket.readyState == "open") {
            socket.write("goodbye from " + port + "\r\n");
          }
          proxying = false;
          client = undefined;
        });
        return;
      }

      sys.puts("unknown command: " + line);
      socket.write("unknown command: " + line + "\r\n");
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
