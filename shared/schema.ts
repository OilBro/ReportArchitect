import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  certification: text("certification"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: text("report_number").notNull().unique(),
  tankId: text("tank_id").notNull(),
  inspectionDate: timestamp("inspection_date"),
  ownerId: varchar("owner_id").notNull(),
  unitSet: text("unit_set").notNull().default("US"),
  status: text("status").notNull().default("draft"),
  
  // Tank specifications
  nominalDiameter: decimal("nominal_diameter"),
  shellHeight: decimal("shell_height"),
  designPressure: decimal("design_pressure"),
  originalThickness: decimal("original_thickness", { precision: 6, scale: 3 }),
  
  // Material and service
  plateSpec: text("plate_spec"),
  service: text("service"),
  age: integer("age"),
  
  // Inspector information
  inspectorName: text("inspector_name"),
  inspectorRecord: text("inspector_record"),
  inspectorCertification: text("inspector_certification"),
  
  // Cover text and additional data
  coverText: text("cover_text"),
  customFields: jsonb("custom_fields").$type<Record<string, string>>(),
  
  // File uploads
  logoUrl: text("logo_url"),
  signatureUrl: text("signature_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appendices = pgTable("appendices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull(),
  appendixLetter: text("appendix_letter").notNull(), // A, B, C, etc.
  isApplicable: boolean("is_applicable").default(true),
  subject: text("subject"),
  content: text("content"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cmlRecords = pgTable("cml_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull(),
  cmlId: text("cml_id").notNull(),
  component: text("component").notNull(),
  location: text("location").notNull(),
  
  // Thickness measurements (up to 6 points)
  reading1: decimal("reading1", { precision: 6, scale: 3 }),
  reading2: decimal("reading2", { precision: 6, scale: 3 }),
  reading3: decimal("reading3", { precision: 6, scale: 3 }),
  reading4: decimal("reading4", { precision: 6, scale: 3 }),
  reading5: decimal("reading5", { precision: 6, scale: 3 }),
  reading6: decimal("reading6", { precision: 6, scale: 3 }),
  
  // Calculated values
  currentReading: decimal("current_reading", { precision: 6, scale: 3 }),
  previousReading: decimal("previous_reading", { precision: 6, scale: 3 }),
  corrosionRate: decimal("corrosion_rate", { precision: 6, scale: 3 }),
  remainingLife: decimal("remaining_life", { precision: 6, scale: 1 }),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const nozzleCmlRecords = pgTable("nozzle_cml_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull(),
  cmlId: text("cml_id").notNull(),
  compId: text("comp_id").notNull(),
  size: decimal("size"),
  location: text("location").notNull(),
  nominalThickness: decimal("nominal_thickness", { precision: 6, scale: 3 }),
  
  // Thickness measurements (up to 4 points for nozzles)
  reading1: decimal("reading1", { precision: 6, scale: 3 }),
  reading2: decimal("reading2", { precision: 6, scale: 3 }),
  reading3: decimal("reading3", { precision: 6, scale: 3 }),
  reading4: decimal("reading4", { precision: 6, scale: 3 }),
  
  currentReading: decimal("current_reading", { precision: 6, scale: 3 }),
  corrosionRate: decimal("corrosion_rate", { precision: 6, scale: 3 }),
  remainingLife: decimal("remaining_life", { precision: 6, scale: 1 }),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const practicalTmins = pgTable("practical_tmins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull(),
  component: text("component").notNull(),
  size: text("size"),
  practicalTmin: decimal("practical_tmin", { precision: 6, scale: 3 }),
});

export const writeups = pgTable("writeups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull(),
  summary: text("summary"),
  findings: text("findings"),
  recommendations: text("recommendations"),
  conclusions: text("conclusions"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const reportsRelations = relations(reports, ({ one, many }) => ({
  owner: one(users, {
    fields: [reports.ownerId],
    references: [users.id],
  }),
  appendices: many(appendices),
  cmlRecords: many(cmlRecords),
  nozzleCmlRecords: many(nozzleCmlRecords),
  practicalTmins: many(practicalTmins),
  writeup: one(writeups),
}));

export const appendicesRelations = relations(appendices, ({ one }) => ({
  report: one(reports, {
    fields: [appendices.reportId],
    references: [reports.id],
  }),
}));

export const cmlRecordsRelations = relations(cmlRecords, ({ one }) => ({
  report: one(reports, {
    fields: [cmlRecords.reportId],
    references: [reports.id],
  }),
}));

export const nozzleCmlRecordsRelations = relations(nozzleCmlRecords, ({ one }) => ({
  report: one(reports, {
    fields: [nozzleCmlRecords.reportId],
    references: [reports.id],
  }),
}));

export const practicalTminsRelations = relations(practicalTmins, ({ one }) => ({
  report: one(reports, {
    fields: [practicalTmins.reportId],
    references: [reports.id],
  }),
}));

export const writeupsRelations = relations(writeups, ({ one }) => ({
  report: one(reports, {
    fields: [writeups.reportId],
    references: [reports.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppendixSchema = createInsertSchema(appendices).omit({
  id: true,
  createdAt: true,
});

export const insertCmlRecordSchema = createInsertSchema(cmlRecords).omit({
  id: true,
  createdAt: true,
});

export const insertNozzleCmlRecordSchema = createInsertSchema(nozzleCmlRecords).omit({
  id: true,
  createdAt: true,
});

export const insertPracticalTminSchema = createInsertSchema(practicalTmins).omit({
  id: true,
});

export const insertWriteupSchema = createInsertSchema(writeups).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertAppendix = z.infer<typeof insertAppendixSchema>;
export type Appendix = typeof appendices.$inferSelect;

export type InsertCmlRecord = z.infer<typeof insertCmlRecordSchema>;
export type CmlRecord = typeof cmlRecords.$inferSelect;

export type InsertNozzleCmlRecord = z.infer<typeof insertNozzleCmlRecordSchema>;
export type NozzleCmlRecord = typeof nozzleCmlRecords.$inferSelect;

export type InsertPracticalTmin = z.infer<typeof insertPracticalTminSchema>;
export type PracticalTmin = typeof practicalTmins.$inferSelect;

export type InsertWriteup = z.infer<typeof insertWriteupSchema>;
export type Writeup = typeof writeups.$inferSelect;
