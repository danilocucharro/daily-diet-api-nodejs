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
    let sequenceOnDietMeals = request.cookies.sequenceOnDietMeals;

    if (!sessionId) {
      sessionId = randomUUID();
      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    if (sequenceOnDietMeals) {
      await knexDb("users").insert({
        id: sessionId,
        name,
        password,
        actual_on_diet_meals_sequence: Number(sequenceOnDietMeals),
        best_on_diet_meals_sequence: Number(sequenceOnDietMeals),
      });
    } else {
      await knexDb("users").insert({
        id: sessionId,
        name,
        password,
      });
    }

    return reply.status(201).send();
  });

  // GET total of meals registered
  app.get(
    "/metrics/total-meals/:user_id",
    { preHandler: [checkSessionIdExists, matchParamAndSessionId] },
    async (request, reply) => {
      const getTotalMealsParamSchema = z.object({
        user_id: z.uuid(),
      });

      const { user_id } = getTotalMealsParamSchema.parse(request.params);

      const totalMeals = await knexDb("meals")
        .where({
          user_id: user_id,
        })
        .count({ totalMeals: "*" });

      reply.status(200).send(totalMeals);
    }
  );

  // GET total of meals on diet registered
  app.get(
    "/metrics/total-on-diet/:user_id",
    { preHandler: [checkSessionIdExists, matchParamAndSessionId] },
    async (request, reply) => {
      const getTotalMealsOnDietParamSchema = z.object({
        user_id: z.uuid(),
      });

      const { user_id } = getTotalMealsOnDietParamSchema.parse(request.params);

      const totalOnDietMeals = await knexDb("meals")
        .where({
          user_id: user_id,
          on_diet: true,
        })
        .count({ totalMealsOnDiet: "*" });

      reply.status(200).send(totalOnDietMeals);
    }
  );

  // GET total of meals off diet registered
  app.get(
    "/metrics/total-off-diet/:user_id",
    { preHandler: [checkSessionIdExists, matchParamAndSessionId] },
    async (request, reply) => {
      const getTotalMealsOffDietParamSchema = z.object({
        user_id: z.uuid(),
      });

      const { user_id } = getTotalMealsOffDietParamSchema.parse(request.params);

      const totalOffDietMeals = await knexDb("meals")
        .where({
          user_id: user_id,
          on_diet: false,
        })
        .count({ totalMealsOffDiet: "*" });

      reply.status(200).send(totalOffDietMeals);
    }
  );

  // GET best sequence of meals on diet
  app.get(
    "/metrics/best-sequence/:user_id",
    { preHandler: [checkSessionIdExists, matchParamAndSessionId] },
    async (request, reply) => {
      const getBestSequenceParamSchema = z.object({
        user_id: z.uuid(),
      });

      const { user_id } = getBestSequenceParamSchema.parse(request.params);

      const bestSequence = await knexDb("users")
        .where({
          id: user_id,
        })
        .select("best_on_diet_meals_sequence");

      reply.status(200).send(bestSequence);
    }
  );
}
