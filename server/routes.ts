import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertReportSchema, insertAppendixSchema, insertCmlRecordSchema, 
  insertNozzleCmlRecordSchema, insertPracticalTminSchema, insertWriteupSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Report routes
  app.get("/api/reports", async (req, res) => {
    try {
      // For now, using a mock user ID - in production this would come from auth
      const userId = "mock-user-id";
      const reports = await storage.getUserReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const report = await storage.getReportWithDetails(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const validatedData = insertReportSchema.parse({
        ...req.body,
        ownerId: "mock-user-id" // In production, get from auth
      });
      const report = await storage.createReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  app.put("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const report = await storage.updateReport(id, updateData);
      res.json(report);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ error: "Failed to update report" });
    }
  });

  app.delete("/api/reports/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReport(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // Save report endpoint
  app.post("/api/reports/:id/save", async (req, res) => {
    try {
      const report = await storage.getReportWithDetails(req.params.id);
      res.json({ success: true, report });
    } catch (error) {
      console.error("Error saving report:", error);
      res.status(500).json({ error: "Failed to save report" });
    }
  });

  // Appendix routes
  app.get("/api/reports/:reportId/appendices", async (req, res) => {
    try {
      const { reportId } = req.params;
      const appendices = await storage.getReportAppendices(reportId);
      res.json(appendices);
    } catch (error) {
      console.error("Error fetching appendices:", error);
      res.status(500).json({ error: "Failed to fetch appendices" });
    }
  });

  app.post("/api/reports/:reportId/appendices", async (req, res) => {
    try {
      const { reportId } = req.params;
      const validatedData = insertAppendixSchema.parse({
        ...req.body,
        reportId
      });
      const appendix = await storage.createAppendix(validatedData);
      res.status(201).json(appendix);
    } catch (error) {
      console.error("Error creating appendix:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create appendix" });
    }
  });

  app.put("/api/appendices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const appendix = await storage.updateAppendix(id, updateData);
      res.json(appendix);
    } catch (error) {
      console.error("Error updating appendix:", error);
      res.status(500).json({ error: "Failed to update appendix" });
    }
  });

  // CML Record routes
  app.get("/api/reports/:reportId/cml-records", async (req, res) => {
    try {
      const { reportId } = req.params;
      const cmlRecords = await storage.getReportCmlRecords(reportId);
      res.json(cmlRecords);
    } catch (error) {
      console.error("Error fetching CML records:", error);
      res.status(500).json({ error: "Failed to fetch CML records" });
    }
  });

  app.post("/api/reports/:reportId/cml-records", async (req, res) => {
    try {
      const { reportId } = req.params;
      const validatedData = insertCmlRecordSchema.parse({
        ...req.body,
        reportId
      });
      const cmlRecord = await storage.createCmlRecord(validatedData);
      res.status(201).json(cmlRecord);
    } catch (error) {
      console.error("Error creating CML record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create CML record" });
    }
  });

  app.put("/api/cml-records/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const cmlRecord = await storage.updateCmlRecord(id, updateData);
      res.json(cmlRecord);
    } catch (error) {
      console.error("Error updating CML record:", error);
      res.status(500).json({ error: "Failed to update CML record" });
    }
  });

  app.delete("/api/cml-records/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCmlRecord(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting CML record:", error);
      res.status(500).json({ error: "Failed to delete CML record" });
    }
  });

  // Nozzle CML Record routes
  app.get("/api/reports/:reportId/nozzle-cml-records", async (req, res) => {
    try {
      const { reportId } = req.params;
      const nozzleCmlRecords = await storage.getReportNozzleCmlRecords(reportId);
      res.json(nozzleCmlRecords);
    } catch (error) {
      console.error("Error fetching nozzle CML records:", error);
      res.status(500).json({ error: "Failed to fetch nozzle CML records" });
    }
  });

  app.post("/api/reports/:reportId/nozzle-cml-records", async (req, res) => {
    try {
      const { reportId } = req.params;
      const validatedData = insertNozzleCmlRecordSchema.parse({
        ...req.body,
        reportId
      });
      const nozzleCmlRecord = await storage.createNozzleCmlRecord(validatedData);
      res.status(201).json(nozzleCmlRecord);
    } catch (error) {
      console.error("Error creating nozzle CML record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create nozzle CML record" });
    }
  });

  // Practical Tmin routes
  app.get("/api/reports/:reportId/practical-tmins", async (req, res) => {
    try {
      const { reportId } = req.params;
      const practicalTmins = await storage.getReportPracticalTmins(reportId);
      res.json(practicalTmins);
    } catch (error) {
      console.error("Error fetching practical tmins:", error);
      res.status(500).json({ error: "Failed to fetch practical tmins" });
    }
  });

  app.post("/api/reports/:reportId/practical-tmins", async (req, res) => {
    try {
      const { reportId } = req.params;
      const validatedData = insertPracticalTminSchema.parse({
        ...req.body,
        reportId
      });
      const practicalTmin = await storage.createPracticalTmin(validatedData);
      res.status(201).json(practicalTmin);
    } catch (error) {
      console.error("Error creating practical tmin:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create practical tmin" });
    }
  });

  app.put("/api/practical-tmins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const practicalTmin = await storage.updatePracticalTmin(id, updateData);
      res.json(practicalTmin);
    } catch (error) {
      console.error("Error updating practical tmin:", error);
      res.status(500).json({ error: "Failed to update practical tmin" });
    }
  });

  app.delete("/api/practical-tmins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePracticalTmin(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting practical tmin:", error);
      res.status(500).json({ error: "Failed to delete practical tmin" });
    }
  });

  // Shell Calculations routes
  app.get("/api/reports/:reportId/shell-calculations", async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReport(reportId);
      const shellCalcs = report?.customFields?.shellCalculations || {};
      res.json(shellCalcs);
    } catch (error) {
      console.error("Error fetching shell calculations:", error);
      res.status(500).json({ error: "Failed to fetch shell calculations" });
    }
  });

  app.put("/api/reports/:reportId/shell-calculations", async (req, res) => {
    try {
      const { reportId } = req.params;
      const shellCalcsData = req.body;
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const updatedReport = await storage.updateReport(reportId, {
        customFields: {
          ...(report.customFields || {}),
          shellCalculations: shellCalcsData
        }
      });
      
      res.json(shellCalcsData);
    } catch (error) {
      console.error("Error updating shell calculations:", error);
      res.status(500).json({ error: "Failed to update shell calculations" });
    }
  });

  // Roof Calculations routes
  app.get("/api/reports/:reportId/roof-calculations", async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReport(reportId);
      const roofCalcs = report?.customFields?.roofCalculations || {};
      res.json(roofCalcs);
    } catch (error) {
      console.error("Error fetching roof calculations:", error);
      res.status(500).json({ error: "Failed to fetch roof calculations" });
    }
  });

  app.put("/api/reports/:reportId/roof-calculations", async (req, res) => {
    try {
      const { reportId } = req.params;
      const roofCalcsData = req.body;
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const updatedReport = await storage.updateReport(reportId, {
        customFields: {
          ...(report.customFields || {}),
          roofCalculations: roofCalcsData
        }
      });
      
      res.json(roofCalcsData);
    } catch (error) {
      console.error("Error updating roof calculations:", error);
      res.status(500).json({ error: "Failed to update roof calculations" });
    }
  });

  // Floor MRT Calculations routes
  app.get("/api/reports/:reportId/floor-mrt-calculations", async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReport(reportId);
      const floorCalcs = report?.customFields?.floorMRTCalculations || {};
      res.json(floorCalcs);
    } catch (error) {
      console.error("Error fetching floor MRT calculations:", error);
      res.status(500).json({ error: "Failed to fetch floor MRT calculations" });
    }
  });

  app.put("/api/reports/:reportId/floor-mrt-calculations", async (req, res) => {
    try {
      const { reportId } = req.params;
      const floorCalcsData = req.body;
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const updatedReport = await storage.updateReport(reportId, {
        customFields: {
          ...(report.customFields || {}),
          floorMRTCalculations: floorCalcsData
        }
      });
      
      res.json(floorCalcsData);
    } catch (error) {
      console.error("Error updating floor MRT calculations:", error);
      res.status(500).json({ error: "Failed to update floor MRT calculations" });
    }
  });

  // Tank History routes
  app.get("/api/reports/:reportId/tank-history", async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReport(reportId);
      // Return tank history data from report's customFields field
      const tankHistory = report?.customFields?.tankHistory || {};
      res.json(tankHistory);
    } catch (error) {
      console.error("Error fetching tank history:", error);
      res.status(500).json({ error: "Failed to fetch tank history" });
    }
  });

  app.put("/api/reports/:reportId/tank-history", async (req, res) => {
    try {
      const { reportId } = req.params;
      const tankHistoryData = req.body;
      
      // Get existing report
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Update customFields with tank history
      const updatedReport = await storage.updateReport(reportId, {
        customFields: {
          ...(report.customFields || {}),
          tankHistory: tankHistoryData
        }
      });
      
      res.json(tankHistoryData);
    } catch (error) {
      console.error("Error updating tank history:", error);
      res.status(500).json({ error: "Failed to update tank history" });
    }
  });

  // Writeup routes
  app.get("/api/reports/:reportId/writeup", async (req, res) => {
    try {
      const { reportId } = req.params;
      const writeup = await storage.getReportWriteup(reportId);
      res.json(writeup || {});
    } catch (error) {
      console.error("Error fetching writeup:", error);
      res.status(500).json({ error: "Failed to fetch writeup" });
    }
  });

  app.put("/api/reports/:reportId/writeup", async (req, res) => {
    try {
      const { reportId } = req.params;
      const validatedData = insertWriteupSchema.parse({
        ...req.body,
        reportId
      });
      const writeup = await storage.createOrUpdateWriteup(validatedData);
      res.json(writeup);
    } catch (error) {
      console.error("Error updating writeup:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update writeup" });
    }
  });

  // Settlement Survey routes
  app.get("/api/settlement-survey/:reportId", async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReport(reportId);
      const settlementData = report?.customFields?.settlementSurvey || null;
      res.json(settlementData);
    } catch (error) {
      console.error("Error fetching settlement survey:", error);
      res.status(500).json({ error: "Failed to fetch settlement survey" });
    }
  });

  app.post("/api/settlement-survey", async (req, res) => {
    try {
      const settlementData = req.body;
      const { reportId } = settlementData;
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const updatedReport = await storage.updateReport(reportId, {
        customFields: {
          ...(report.customFields || {}),
          settlementSurvey: settlementData
        }
      });
      
      res.json(settlementData);
    } catch (error) {
      console.error("Error saving settlement survey:", error);
      res.status(500).json({ error: "Failed to save settlement survey" });
    }
  });

  app.patch("/api/settlement-survey/:id", async (req, res) => {
    try {
      const settlementData = req.body;
      const { reportId } = settlementData;
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const updatedReport = await storage.updateReport(reportId, {
        customFields: {
          ...(report.customFields || {}),
          settlementSurvey: settlementData
        }
      });
      
      res.json(settlementData);
    } catch (error) {
      console.error("Error updating settlement survey:", error);
      res.status(500).json({ error: "Failed to update settlement survey" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
