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
  userEmail: text("user_email"),
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

export const reminderDeliveries = sqliteTable("reminder_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  matchId: text("match_id").notNull(),
  trigger: text("trigger", { enum: ["24h", "15m"] }).notNull(),
  channel: text("channel", { enum: ["in_app", "email"] }).notNull(),
  sentAt: text("sent_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_reminder_delivery_unique").on(table.userId, table.matchId, table.trigger, table.channel)]);

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  matchId: text("match_id").notNull(),
  trigger: text("trigger", { enum: ["24h", "15m"] }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_notifications_unique").on(table.userId, table.matchId, table.trigger)]);
