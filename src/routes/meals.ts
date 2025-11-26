import type { FastifyInstance } from "fastify";
import z from "zod";
import { knexDb } from "../database.js";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists.js";

export function mealsRoutes(app: FastifyInstance) {
  app.post("/", async (request, reply) => {
    const createMealRequestSchema = z.object({
      name: z.string(),
      description: z.string(),
      on_diet: z.boolean(),
    });

    const { name, description, on_diet } = createMealRequestSchema.parse(
      request.body
    );

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    await knexDb("meals").insert({
      id: randomUUID(),
      name,
      description,
      on_diet,
      user_id: sessionId!,
    });

    reply.status(201).send({
      success: "meal created successfully",
    });
  });

  // GET List meals
  app.get("/", async (request, reply) => {
    const { sessionId } = request.cookies;

    const meals = await knexDb("meals").where("user_id", sessionId).select();

    reply.status(200).send({ meals });
  });

  // GET show a specific meal
  app.get(
    "/:id",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.uuid(),
      });

      const { id } = getMealParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      const meal = await knexDb("meals")
        .where({
          id: id,
          user_id: sessionId!,
        })
        .first();

      reply.status(200).send({ meal });
    }
  );
}
