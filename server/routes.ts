import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertReportSchema, insertAppendixSchema, insertCmlRecordSchema, 
  insertNozzleCmlRecordSchema, insertPracticalTminSchema, insertWriteupSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      hasDatabase: !!process.env.DATABASE_URL,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      hasReplId: !!process.env.REPL_ID,
      hasDomains: !!process.env.REPLIT_DOMAINS,
    });
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Report routes - all protected with authentication
  app.get("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reports = await storage.getUserReports(userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertReportSchema.parse({
        ...req.body,
        ownerId: req.user.claims.sub // Get user ID from authentication
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

  app.put("/api/reports/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/reports/:id", isAuthenticated, async (req, res) => {
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
  app.post("/api/reports/:id/save", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      console.log("[BASE DATA SAVE] Received save request for report:", id);
      console.log("[BASE DATA SAVE] Data received:", JSON.stringify(updateData, null, 2));
      
      // The date comes from the client as "YYYY-MM-DD" string format
      // We'll pass it as-is to storage, which will handle the conversion
      if (updateData.inspectionDate) {
        console.log("[BASE DATA SAVE] Inspection date received:", updateData.inspectionDate);
      }
      
      // Ensure numeric fields are stored as strings (as per schema)
      // The schema expects these as text fields, not numbers
      if (updateData.nominalDiameter !== undefined) {
        updateData.nominalDiameter = String(updateData.nominalDiameter);
      }
      if (updateData.shellHeight !== undefined) {
        updateData.shellHeight = String(updateData.shellHeight);
      }
      if (updateData.designPressure !== undefined) {
        updateData.designPressure = String(updateData.designPressure);
      }
      if (updateData.originalThickness !== undefined) {
        updateData.originalThickness = String(updateData.originalThickness);
      }
      // Age is stored as integer
      if (updateData.age !== undefined && updateData.age !== null) {
        updateData.age = parseInt(updateData.age, 10) || null;
      }
      
      // Actually update the report with the data from the request body
      console.log("[BASE DATA SAVE] Calling storage.updateReport with processed data");
      const updatedReport = await storage.updateReport(id, updateData);
      console.log("[BASE DATA SAVE] Update successful, report updated");
      
      // Then fetch the complete report with details
      const report = await storage.getReportWithDetails(id);
      console.log("[BASE DATA SAVE] Successfully saved base data for report:", id);
      res.json({ success: true, report });
    } catch (error: any) {
      console.error("[BASE DATA SAVE] Error saving report:", error);
      console.error("[BASE DATA SAVE] Error stack:", error.stack);
      res.status(500).json({ error: "Failed to save report", details: error.message });
    }
  });

  // Appendix routes
  app.get("/api/reports/:reportId/appendices", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const appendices = await storage.getReportAppendices(reportId);
      res.json(appendices);
    } catch (error) {
      console.error("Error fetching appendices:", error);
      res.status(500).json({ error: "Failed to fetch appendices" });
    }
  });

  app.post("/api/reports/:reportId/appendices", isAuthenticated, async (req, res) => {
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

  app.put("/api/appendices/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/reports/:reportId/cml-records", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const cmlRecords = await storage.getReportCmlRecords(reportId);
      res.json(cmlRecords);
    } catch (error) {
      console.error("Error fetching CML records:", error);
      res.status(500).json({ error: "Failed to fetch CML records" });
    }
  });

  app.post("/api/reports/:reportId/cml-records", isAuthenticated, async (req, res) => {
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

  app.put("/api/cml-records/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/cml-records/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/reports/:reportId/nozzle-cml-records", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const nozzleCmlRecords = await storage.getReportNozzleCmlRecords(reportId);
      res.json(nozzleCmlRecords);
    } catch (error) {
      console.error("Error fetching nozzle CML records:", error);
      res.status(500).json({ error: "Failed to fetch nozzle CML records" });
    }
  });

  app.post("/api/reports/:reportId/nozzle-cml-records", isAuthenticated, async (req, res) => {
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
  app.get("/api/reports/:reportId/practical-tmins", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const practicalTmins = await storage.getReportPracticalTmins(reportId);
      res.json(practicalTmins);
    } catch (error) {
      console.error("Error fetching practical tmins:", error);
      res.status(500).json({ error: "Failed to fetch practical tmins" });
    }
  });

  app.post("/api/reports/:reportId/practical-tmins", isAuthenticated, async (req, res) => {
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

  app.put("/api/practical-tmins/:id", isAuthenticated, async (req, res) => {
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

  app.delete("/api/practical-tmins/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/reports/:reportId/shell-calculations", isAuthenticated, async (req, res) => {
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

  app.put("/api/reports/:reportId/shell-calculations", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const shellCalcsData = req.body;
      
      console.log("[SHELL CALC] Saving shell calculations for report:", reportId);
      console.log("[SHELL CALC] Data to save:", JSON.stringify(shellCalcsData, null, 2));
      
      const report = await storage.getReport(reportId);
      if (!report) {
        console.error("[SHELL CALC] Report not found:", reportId);
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Ensure customFields is an object
      const currentCustomFields = typeof report.customFields === 'object' && report.customFields !== null 
        ? report.customFields 
        : {};
      
      const updatedCustomFields = {
        ...currentCustomFields,
        shellCalculations: shellCalcsData
      };
      
      console.log("[SHELL CALC] Updating customFields with:", JSON.stringify(updatedCustomFields, null, 2));
      
      const updatedReport = await storage.updateReport(reportId, {
        customFields: updatedCustomFields
      });
      
      console.log("[SHELL CALC] Successfully saved shell calculations");
      
      // Verify the save by fetching again
      const verifyReport = await storage.getReport(reportId);
      console.log("[SHELL CALC] Verification - saved data:", verifyReport?.customFields?.shellCalculations ? "Present" : "Missing");
      
      res.json(shellCalcsData);
    } catch (error) {
      console.error("[SHELL CALC] Error updating shell calculations:", error);
      res.status(500).json({ error: "Failed to update shell calculations" });
    }
  });

  // Roof Calculations routes
  app.get("/api/reports/:reportId/roof-calculations", isAuthenticated, async (req, res) => {
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

  app.put("/api/reports/:reportId/roof-calculations", isAuthenticated, async (req, res) => {
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
  app.get("/api/reports/:reportId/floor-mrt-calculations", isAuthenticated, async (req, res) => {
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

  app.put("/api/reports/:reportId/floor-mrt-calculations", isAuthenticated, async (req, res) => {
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
  app.get("/api/reports/:reportId/tank-history", isAuthenticated, async (req, res) => {
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

  app.put("/api/reports/:reportId/tank-history", isAuthenticated, async (req, res) => {
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
  app.get("/api/reports/:reportId/writeup", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const writeup = await storage.getReportWriteup(reportId);
      res.json(writeup || {});
    } catch (error) {
      console.error("Error fetching writeup:", error);
      res.status(500).json({ error: "Failed to fetch writeup" });
    }
  });

  app.put("/api/reports/:reportId/writeup", isAuthenticated, async (req, res) => {
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
  app.get("/api/settlement-survey/:reportId", isAuthenticated, async (req, res) => {
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

  app.post("/api/settlement-survey", isAuthenticated, async (req, res) => {
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

  // Nozzle CML routes
  app.get("/api/nozzle-cml/:reportId", async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReport(reportId);
      const nozzleCMLData = report?.customFields?.nozzleCML || null;
      res.json(nozzleCMLData);
    } catch (error) {
      console.error("Error fetching nozzle CML:", error);
      res.status(500).json({ error: "Failed to fetch nozzle CML data" });
    }
  });

  app.post("/api/nozzle-cml", async (req, res) => {
    try {
      const nozzleData = req.body;
      const { reportId } = nozzleData;
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const updatedReport = await storage.updateReport(reportId, {
        customFields: {
          ...(report.customFields || {}),
          nozzleCML: nozzleData
        }
      });
      
      res.json(nozzleData);
    } catch (error) {
      console.error("Error saving nozzle CML:", error);
      res.status(500).json({ error: "Failed to save nozzle CML data" });
    }
  });

  app.patch("/api/nozzle-cml/:id", async (req, res) => {
    try {
      const nozzleData = req.body;
      const { reportId } = nozzleData;
      
      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      const updatedReport = await storage.updateReport(reportId, {
        customFields: {
          ...(report.customFields || {}),
          nozzleCML: nozzleData
        }
      });
      
      res.json(nozzleData);
    } catch (error) {
      console.error("Error updating nozzle CML:", error);
      res.status(500).json({ error: "Failed to update nozzle CML data" });
    }
  });


  // PDF Export endpoint
  app.get("/api/reports/:reportId/export/pdf", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReportWithDetails(reportId);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Generate PDF using jsPDF
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      
      const doc = new jsPDF();
      
      // Title Page
      doc.setFontSize(20);
      doc.text("API 653 Tank Inspection Report", 105, 30, { align: "center" });
      doc.setFontSize(14);
      doc.text(`Report Number: ${report.reportNumber || "N/A"}`, 20, 50);
      doc.text(`Tank ID: ${report.tankId || "N/A"}`, 20, 60);
      doc.text(`Inspection Date: ${report.inspectionDate ? new Date(report.inspectionDate).toLocaleDateString() : "N/A"}`, 20, 70);
      
      // Tank Information
      doc.setFontSize(16);
      doc.text("Tank Information", 20, 90);
      doc.setFontSize(12);
      doc.text(`Nominal Diameter: ${report.nominalDiameter || "N/A"} ft`, 20, 100);
      doc.text(`Shell Height: ${report.shellHeight || "N/A"} ft`, 20, 110);
      doc.text(`Service: ${report.service || "N/A"}`, 20, 120);
      doc.text(`Plate Specification: ${report.plateSpec || "N/A"}`, 20, 130);
      
      // Shell Calculations
      if (report.customFields?.shellCalculations?.courses) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Shell Calculations", 20, 20);
        
        const shellData = report.customFields.shellCalculations.courses.map((course: any) => [
          course.courseNumber,
          course.actualThickness || "-",
          course.tMin || "-",
          course.corrosionRate || "-",
          course.remainingLife || "-"
        ]);
        
        (doc as any).autoTable({
          head: [["Course", "Actual (in)", "t-min (in)", "CR (mpy)", "RL (yrs)"]],
          body: shellData,
          startY: 30
        });
      }
      
      // CML Records
      if (report.cmlRecords && report.cmlRecords.length > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text("CML Records", 20, 20);
        
        const cmlData = report.cmlRecords.map((cml: any) => [
          cml.cmlId || "-",
          cml.component || "-",
          cml.readingAvg || ((parseFloat(cml.reading1 || "0") + parseFloat(cml.reading2 || "0") + parseFloat(cml.reading3 || "0") + parseFloat(cml.reading4 || "0")) / 4).toFixed(3),
          cml.corrosionRate || "-",
          cml.remainingLife || "-"
        ]);
        
        (doc as any).autoTable({
          head: [["CML ID", "Component", "Avg Reading", "CR (mpy)", "RL (yrs)"]],
          body: cmlData,
          startY: 30
        });
      }
      
      // Findings and Recommendations
      if (report.findings || report.recommendations) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text("Findings and Recommendations", 20, 20);
        doc.setFontSize(12);
        
        if (report.findings) {
          doc.text("Findings:", 20, 35);
          const findings = doc.splitTextToSize(report.findings, 170);
          doc.text(findings, 20, 45);
        }
        
        if (report.recommendations) {
          doc.text("Recommendations:", 20, 90);
          const recommendations = doc.splitTextToSize(report.recommendations, 170);
          doc.text(recommendations, 20, 100);
        }
      }
      
      // Generate PDF buffer
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="API653-Report-${report.reportNumber || reportId}.pdf"`);
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ error: "Failed to generate PDF report" });
    }
  });
  
  // Word Export endpoint  
  app.get("/api/reports/:reportId/export/word", isAuthenticated, async (req, res) => {
    try {
      const { reportId } = req.params;
      const report = await storage.getReportWithDetails(reportId);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Generate Word document using docx
      const { Document, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } = await import("docx");
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: "API 653 Tank Inspection Report", size: 32, bold: true })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            new Paragraph({
              children: [new TextRun({ text: `Report Number: ${report.reportNumber || "N/A"}`, size: 24 })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Tank ID: ${report.tankId || "N/A"}`, size: 24 })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Inspection Date: ${report.inspectionDate ? new Date(report.inspectionDate).toLocaleDateString() : "N/A"}`, size: 24 })]
            }),
            new Paragraph({
              text: "Tank Information",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              children: [new TextRun({ text: `Nominal Diameter: ${report.nominalDiameter || "N/A"} ft` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Shell Height: ${report.shellHeight || "N/A"} ft` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Service: ${report.service || "N/A"}` })]
            }),
            new Paragraph({
              text: "Findings",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              children: [new TextRun({ text: report.findings || "No findings recorded." })]
            }),
            new Paragraph({
              text: "Recommendations",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              children: [new TextRun({ text: report.recommendations || "No recommendations recorded." })]
            })
          ]
        }]
      });
      
      const { Packer } = await import("docx");
      const buffer = await Packer.toBuffer(doc);
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="API653-Report-${report.reportNumber || reportId}.docx"`);
      res.send(buffer);
      
    } catch (error) {
      console.error("Error generating Word document:", error);
      res.status(500).json({ error: "Failed to generate Word report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
