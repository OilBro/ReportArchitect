import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Save, FileText, AlertCircle, ClipboardList, StickyNote } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReportContentFormProps {
  reportId?: string;
  currentReport?: any;
}

interface ReportContentData {
  findings: string;
  reportWriteUp: string;
  recommendations: string;
  notes: string;
}

export function ReportContentForm({ reportId, currentReport }: ReportContentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReportContentData>({
    defaultValues: {
      findings: "",
      reportWriteUp: "",
      recommendations: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (currentReport) {
      form.reset({
        findings: currentReport.findings || "",
        reportWriteUp: currentReport.reportWriteUp || "",
        recommendations: currentReport.recommendations || "",
        notes: currentReport.notes || "",
      });
    }
  }, [currentReport, form]);

  const updateReportMutation = useMutation({
    mutationFn: async (data: ReportContentData) => {
      if (!reportId) throw new Error("No report ID");
      return apiRequest("POST", `/api/reports/${reportId}/save`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId] });
      toast({ title: "Report content saved successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error saving report content", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: ReportContentData) => {
    updateReportMutation.mutate(data);
  };

  if (!reportId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          Please select or create a report to add content
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Report Content</h2>
        <p className="text-sm text-gray-600 mt-1">
          Add detailed findings, write-ups, recommendations, and notes for your inspection report
        </p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Findings Field */}
            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-900 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Inspection Findings
                  </FormLabel>
                  <FormDescription>
                    Document all significant findings from the inspection, including defects, areas of concern, and observed conditions
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      rows={8}
                      placeholder="During the inspection, the following findings were observed:
• Shell Course 1: Minor surface corrosion noted at the 90° position
• Roof: Coating deterioration observed on approximately 15% of the surface area
• Foundation: No significant settlement or cracking detected
• Nozzles: All nozzles in good condition with no visible defects..."
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Report Write-up Field */}
            <FormField
              control={form.control}
              name="reportWriteUp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-900 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Detailed Report Write-up
                  </FormLabel>
                  <FormDescription>
                    Provide a comprehensive narrative of the inspection process, methodologies used, and detailed observations
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      rows={10}
                      placeholder="INSPECTION OVERVIEW:
The inspection was conducted in accordance with API 653 standards. The tank was taken out of service and prepared for internal inspection...

INSPECTION METHODOLOGY:
Visual inspection was performed on all accessible areas. Ultrasonic thickness measurements were taken at designated CML locations...

DETAILED OBSERVATIONS:
The tank shell showed good overall condition with minimal corrosion. Thickness readings indicate adequate remaining life..."
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Recommendations Field */}
            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-900 flex items-center">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Recommendations
                  </FormLabel>
                  <FormDescription>
                    List all recommended actions, repairs, and future inspection intervals based on the findings
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      rows={8}
                      placeholder="Based on the inspection findings, the following recommendations are provided:

1. IMMEDIATE ACTIONS:
   • None required - tank is suitable for continued service

2. SHORT-TERM (Within 6 months):
   • Repair coating on roof areas showing deterioration
   • Clean and repaint areas with surface corrosion

3. LONG-TERM MONITORING:
   • Continue thickness monitoring at established CML locations
   • Schedule next internal inspection in 10 years per API 653

4. MAINTENANCE RECOMMENDATIONS:
   • Implement quarterly external visual inspections
   • Maintain cathodic protection system..."
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-900 flex items-center">
                    <StickyNote className="h-4 w-4 mr-2" />
                    Additional Notes
                  </FormLabel>
                  <FormDescription>
                    Add any additional notes, observations, or information not covered in other sections
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Additional notes and observations:
• Weather conditions during inspection: Clear, 75°F, low humidity
• Tank was last in service containing crude oil
• Owner representative present during inspection: John Smith
• Photos taken and stored in Appendix B
• All safety protocols were followed..."
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={updateReportMutation.isPending}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateReportMutation.isPending ? "Saving..." : "Save Report Content"}
              </Button>
              
              <div className="text-sm text-gray-500">
                All content is automatically saved to the report
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}