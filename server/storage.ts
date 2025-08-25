import { 
  users, reports, appendices, cmlRecords, nozzleCmlRecords, practicalTmins, writeups,
  type User, type UpsertUser, type Report, type InsertReport, type InsertAppendix,
  type InsertCmlRecord, type InsertNozzleCmlRecord, type InsertPracticalTmin, type InsertWriteup,
  type Appendix, type CmlRecord, type NozzleCmlRecord, type PracticalTmin, type Writeup
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Report methods
  getReport(id: string): Promise<Report | undefined>;
  getReportWithDetails(id: string): Promise<any>;
  getUserReports(userId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report>;
  deleteReport(id: string): Promise<void>;

  // Appendix methods
  getReportAppendices(reportId: string): Promise<Appendix[]>;
  createAppendix(appendix: InsertAppendix): Promise<Appendix>;
  updateAppendix(id: string, appendix: Partial<InsertAppendix>): Promise<Appendix>;
  deleteAppendix(id: string): Promise<void>;

  // CML methods
  getReportCmlRecords(reportId: string): Promise<CmlRecord[]>;
  createCmlRecord(cml: InsertCmlRecord): Promise<CmlRecord>;
  updateCmlRecord(id: string, cml: Partial<InsertCmlRecord>): Promise<CmlRecord>;
  deleteCmlRecord(id: string): Promise<void>;

  // Nozzle CML methods
  getReportNozzleCmlRecords(reportId: string): Promise<NozzleCmlRecord[]>;
  createNozzleCmlRecord(nozzleCml: InsertNozzleCmlRecord): Promise<NozzleCmlRecord>;
  updateNozzleCmlRecord(id: string, nozzleCml: Partial<InsertNozzleCmlRecord>): Promise<NozzleCmlRecord>;
  deleteNozzleCmlRecord(id: string): Promise<void>;

  // Practical Tmin methods
  getReportPracticalTmins(reportId: string): Promise<PracticalTmin[]>;
  createPracticalTmin(practicalTmin: InsertPracticalTmin): Promise<PracticalTmin>;
  updatePracticalTmin(id: string, practicalTmin: Partial<InsertPracticalTmin>): Promise<PracticalTmin>;
  deletePracticalTmin(id: string): Promise<void>;

  // Writeup methods
  getReportWriteup(reportId: string): Promise<Writeup | undefined>;
  createOrUpdateWriteup(writeup: InsertWriteup): Promise<Writeup>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportWithDetails(id: string): Promise<any> {
    const report = await this.getReport(id);
    if (!report) return undefined;

    const [appendicesData, cmlData, nozzleCmlData, practicalTminsData, writeupData] = await Promise.all([
      this.getReportAppendices(id),
      this.getReportCmlRecords(id),
      this.getReportNozzleCmlRecords(id),
      this.getReportPracticalTmins(id),
      this.getReportWriteup(id),
    ]);

    return {
      ...report,
      appendices: appendicesData,
      cmlRecords: cmlData,
      nozzleCmlRecords: nozzleCmlData,
      practicalTmins: practicalTminsData,
      writeup: writeupData,
    };
  }

  async getUserReports(userId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.ownerId, userId)).orderBy(desc(reports.updatedAt));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  async updateReport(id: string, updateData: Partial<InsertReport>): Promise<Report> {
    // Handle date conversion - if inspectionDate is a string, convert to Date
    if (updateData.inspectionDate && typeof updateData.inspectionDate === 'string') {
      updateData.inspectionDate = new Date(updateData.inspectionDate);
    }
    
    const [report] = await db
      .update(reports)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  async deleteReport(id: string): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  async getReportAppendices(reportId: string): Promise<Appendix[]> {
    return await db.select().from(appendices).where(eq(appendices.reportId, reportId));
  }

  async createAppendix(insertAppendix: InsertAppendix): Promise<Appendix> {
    const [appendix] = await db
      .insert(appendices)
      .values(insertAppendix)
      .returning();
    return appendix;
  }

  async updateAppendix(id: string, updateData: Partial<InsertAppendix>): Promise<Appendix> {
    const [appendix] = await db
      .update(appendices)
      .set(updateData)
      .where(eq(appendices.id, id))
      .returning();
    return appendix;
  }

  async deleteAppendix(id: string): Promise<void> {
    await db.delete(appendices).where(eq(appendices.id, id));
  }

  async getReportCmlRecords(reportId: string): Promise<CmlRecord[]> {
    return await db.select().from(cmlRecords).where(eq(cmlRecords.reportId, reportId));
  }

  async createCmlRecord(insertCml: InsertCmlRecord): Promise<CmlRecord> {
    const [cml] = await db
      .insert(cmlRecords)
      .values(insertCml)
      .returning();
    return cml;
  }

  async updateCmlRecord(id: string, updateData: Partial<InsertCmlRecord>): Promise<CmlRecord> {
    const [cml] = await db
      .update(cmlRecords)
      .set(updateData)
      .where(eq(cmlRecords.id, id))
      .returning();
    return cml;
  }

  async deleteCmlRecord(id: string): Promise<void> {
    await db.delete(cmlRecords).where(eq(cmlRecords.id, id));
  }

  async getReportNozzleCmlRecords(reportId: string): Promise<NozzleCmlRecord[]> {
    return await db.select().from(nozzleCmlRecords).where(eq(nozzleCmlRecords.reportId, reportId));
  }

  async createNozzleCmlRecord(insertNozzleCml: InsertNozzleCmlRecord): Promise<NozzleCmlRecord> {
    const [nozzleCml] = await db
      .insert(nozzleCmlRecords)
      .values(insertNozzleCml)
      .returning();
    return nozzleCml;
  }

  async updateNozzleCmlRecord(id: string, updateData: Partial<InsertNozzleCmlRecord>): Promise<NozzleCmlRecord> {
    const [nozzleCml] = await db
      .update(nozzleCmlRecords)
      .set(updateData)
      .where(eq(nozzleCmlRecords.id, id))
      .returning();
    return nozzleCml;
  }

  async deleteNozzleCmlRecord(id: string): Promise<void> {
    await db.delete(nozzleCmlRecords).where(eq(nozzleCmlRecords.id, id));
  }

  async getReportPracticalTmins(reportId: string): Promise<PracticalTmin[]> {
    return await db.select().from(practicalTmins).where(eq(practicalTmins.reportId, reportId));
  }

  async createPracticalTmin(insertPracticalTmin: InsertPracticalTmin): Promise<PracticalTmin> {
    const [practicalTmin] = await db
      .insert(practicalTmins)
      .values(insertPracticalTmin)
      .returning();
    return practicalTmin;
  }

  async updatePracticalTmin(id: string, updateData: Partial<InsertPracticalTmin>): Promise<PracticalTmin> {
    const [practicalTmin] = await db
      .update(practicalTmins)
      .set(updateData)
      .where(eq(practicalTmins.id, id))
      .returning();
    return practicalTmin;
  }

  async deletePracticalTmin(id: string): Promise<void> {
    await db.delete(practicalTmins).where(eq(practicalTmins.id, id));
  }

  async getReportWriteup(reportId: string): Promise<Writeup | undefined> {
    const [writeup] = await db.select().from(writeups).where(eq(writeups.reportId, reportId));
    return writeup || undefined;
  }

  async createOrUpdateWriteup(insertWriteup: InsertWriteup): Promise<Writeup> {
    const existing = await this.getReportWriteup(insertWriteup.reportId);
    
    if (existing) {
      const [writeup] = await db
        .update(writeups)
        .set({ ...insertWriteup, updatedAt: new Date() })
        .where(eq(writeups.reportId, insertWriteup.reportId))
        .returning();
      return writeup;
    } else {
      const [writeup] = await db
        .insert(writeups)
        .values(insertWriteup)
        .returning();
      return writeup;
    }
  }
}

export const storage = new DatabaseStorage();
