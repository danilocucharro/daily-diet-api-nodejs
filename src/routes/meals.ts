import type { FastifyInstance } from "fastify";
import z from "zod";
import { knexDb } from "../database.js";
import { randomUUID } from "node:crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists.js";

export function mealsRoutes(app: FastifyInstance) {
  // POST create a meal
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

    if (sessionId) {
      // Verifying if exists an user with this sessionId
      const userExists =
        (await knexDb("users").where("id", sessionId)).length > 0;

      if (on_diet && userExists) {
        const sequenceOnDietMeals = request.cookies.sequenceOnDietMeals;
        const newSequenceCookieValue = Number(sequenceOnDietMeals) + 1;
        reply.setCookie("sequenceOnDietMeals", String(newSequenceCookieValue), {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        const user = await knexDb("users").where("id", sessionId).select("*");

        const isNewSequencehigher =
          Number(newSequenceCookieValue) >
          user[0]?.best_on_diet_meals_sequence!;

        await knexDb("users")
          .where("id", sessionId)
          .update(
            {
              actual_on_diet_meals_sequence: Number(newSequenceCookieValue),
              best_on_diet_meals_sequence: isNewSequencehigher
                ? Number(newSequenceCookieValue)
                : user[0]?.best_on_diet_meals_sequence!,
            },
            ["actual_on_diet_meals_sequence", "best_on_diet_meals_sequence"]
          );
      } else if (on_diet && !userExists) {
        reply.setCookie(
          "sequenceOnDietMeals",
          String(Number(request.cookies.sequenceOnDietMeals) + 1),
          {
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
          }
        );
      } else if (!on_diet) {
        reply.setCookie("sequenceOnDietMeals", "0", {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        await knexDb("users").where("id", sessionId).update(
          {
            actual_on_diet_meals_sequence: 0,
          },
          ["actual_on_diet_meals_sequence"]
        );
      }
    }

    // If dont have a session yet
    if (!sessionId) {
      sessionId = randomUUID();

      reply.setCookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      if (!on_diet) {
        reply.setCookie("sequenceOnDietMeals", "0", {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      } else {
        reply.setCookie("sequenceOnDietMeals", "1", {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    await knexDb("meals").insert({
      id: randomUUID(),
      name,
      description,
      on_diet,
      user_id: sessionId!,
    });

    reply.status(201).send({
      success: "meal created successfully.",
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

  // PUT update a meal info
  app.put(
    "/",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const updateMealRequestSchema = z.object({
        id: z.uuid(),
        name: z.string(),
        description: z.string(),
        on_diet: z.boolean(),
      });

      const { id, name, description, on_diet } = updateMealRequestSchema.parse(
        request.body
      );

      const { sessionId } = request.cookies;

      await knexDb("meals")
        .where({
          id,
          user_id: sessionId!,
        })
        .update({
          name,
          description,
          on_diet,
        });

      reply.status(200).send({
        success: "meal updated successfully.",
      });
    }
  );

  // DELETE remove a meal
  app.delete(
    "/:id",
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const deleteMealParamsSchema = z.object({
        id: z.uuid(),
      });

      const { id } = deleteMealParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      await knexDb("meals")
        .where({
          id,
          user_id: sessionId!,
        })
        .del();

      reply.status(204);
    }
  );
}
