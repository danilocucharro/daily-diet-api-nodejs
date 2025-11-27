import type { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";

export async function matchParamAndSessionId(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const getTotalMealsParamsSchema = z.object({
    user_id: z.uuid(),
  });

  const { user_id } = getTotalMealsParamsSchema.parse(request.params);
  const { sessionId } = request.cookies;

  if (user_id !== sessionId) {
    reply.status(401).send({
      error: "Unauthorized.",
    });
  }
}
