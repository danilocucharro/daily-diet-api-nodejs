import type { FastifyInstance } from "fastify";
import z from "zod";
import { knexDb } from "../database.js";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists.js";
import { matchParamAndSessionId } from "../middlewares/match-param-and-session-id.js";

export async function usersRoutes(app: FastifyInstance) {
  // POST create user
  app.post("/", async (request, reply) => {
    const createUserRequestSchema = z.object({
      name: z.string(),
      password: z.string(),
    });

    // Analisa se os dados estao validos de acordo com o schema da requisicao
    const { name, password } = createUserRequestSchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    await knexDb("users").insert({
      id: sessionId,
      name,
      password,
    });

    return reply.status(201).send();
  });

  // GET total of meals registered
  app.get(
    "/metrics/total-meals/:user_id",
    { preHandler: [checkSessionIdExists, matchParamAndSessionId] },
    async (request, reply) => {
      const getTotalMealsParamsSchema = z.object({
        user_id: z.uuid(),
      });

      const { user_id } = getTotalMealsParamsSchema.parse(request.params);

      const totalMeals = await knexDb("meals")
        .where({
          user_id: user_id!,
        })
        .count({ totalMeals: "*" });

      reply.status(200).send(totalMeals);
    }
  );
}
