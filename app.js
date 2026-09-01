const { createServer } = require("http");

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});
process.on("unhandledRejection", (err) => {
  console.error("unhandledRejection:", err);
});

const next = require("next");

const port = process.env.PORT || 3000;
// Se fuerza `dir` porque Passenger puede spawnear el proceso con un cwd
// distinto a la carpeta de la app, y next() por defecto busca `.next`
// relativo a process.cwd().
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      handle(req, res);
    });
    server.on("error", (err) => {
      console.error("server error:", err);
    });
    server.listen(port, () => {
      console.log(`Aeromanten listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("app.prepare() failed:", err);
  });
