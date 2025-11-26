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

  app.get("/", async (request) => {
    const { sessionId } = request.cookies;

    const meals = await knexDb("meals").where("user_id", sessionId).select();
    return { meals };
  });
}
