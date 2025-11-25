import fastify from "fastify";
import { knexDb } from "./database.js";
import { env } from "./env/index.js";

const app = fastify()

app.get('/hello', () => {
  const tables = knexDb('sqlite_schema').select('*')
  
  return tables
})

app.listen({
  port: env.PORT,
  path: "http://localhost"
}).then(() => {
  console.log('HTTP Server is running!')
})