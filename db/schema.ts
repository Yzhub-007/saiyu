import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const userFollows = sqliteTable("user_follows", {
  userId: text("user_id").notNull(),
  entityType: text("entity_type", { enum: ["game", "tournament", "team"] }).notNull(),
  entityId: text("entity_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.userId, table.entityType, table.entityId] })]);

export const notificationPreferences = sqliteTable("notification_preferences", {
  userId: text("user_id").primaryKey(),
  inAppEnabled: integer("in_app_enabled", { mode: "boolean" }).notNull().default(true),
  emailEnabled: integer("email_enabled", { mode: "boolean" }).notNull().default(true),
  reminder24h: integer("reminder_24h", { mode: "boolean" }).notNull().default(true),
  reminder15m: integer("reminder_15m", { mode: "boolean" }).notNull().default(true),
  timezone: text("timezone").notNull().default("Asia/Shanghai"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const calendarTokens = sqliteTable("calendar_tokens", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_calendar_tokens_user_id").on(table.userId)]);

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorUserId: text("actor_user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  reason: text("reason").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
