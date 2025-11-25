import type { Knex } from "knex";

declare module "knex/types/tables.js" {
  interface Tables {
    users: {
      id: string;
      name: string;
      password: string;
      actual_on_diet_meals_sequence?: number;
      best_on_diet_meals_sequence?: number;
      created_at?: string;
    };

    meals: {
      id: string;
      user_id?: string;
      name: string;
      description: string;
      created_at: string;
      on_diet: boolean;
    };
  }
}
