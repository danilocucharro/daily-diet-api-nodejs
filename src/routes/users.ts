import type { FastifyInstance } from "fastify";
import z from "zod";
import { knexDb } from "../database.js";
import { randomUUID } from "node:crypto";

export async function usersRoutes(app: FastifyInstance) {
  // POST create user
  app.post("/", async (request, reply) => {
    const createUserRequestSchema = z.object({
      name: z.string(),
      password: z.string(),
    });

    // Analisa se os dados estao validos de acordo com o schema da requisicao
    const { name, password } = createUserRequestSchema.parse(request.body);

    await knexDb("users").insert({
      id: randomUUID(),
      name,
      password,
    });

    return reply.status(201).send();
  });
}
