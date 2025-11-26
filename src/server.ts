import fastify from "fastify";
import { env } from "./env/index.js";
import { usersRoutes } from "./routes/users.js";
import { mealsRoutes } from "./routes/meals.js";
import cookie from "@fastify/cookie";

const app = fastify();

app.register(cookie);

app.register(usersRoutes, {
  prefix: "/users",
});

app.register(mealsRoutes, {
  prefix: "/meals",
});

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log("🟢 HTTP Server is running!");
  });
