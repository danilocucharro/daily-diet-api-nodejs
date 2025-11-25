import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary(),
    table.string('name').notNullable(),
    table.string('password').notNullable(),
    table.integer('actual_on_diet_meals_sequence').defaultTo(0),
    table.integer('best_on_diet_meals_sequence').defaultTo(0),
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}

