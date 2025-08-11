import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { SpellCheck, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Writeup } from "@/types/report";

interface WriteupFormProps {
  reportId?: string;
}

export function WriteupForm({ reportId }: WriteupFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: writeup, isLoading } = useQuery({
    queryKey: ["/api/reports", reportId, "writeup"],
    enabled: !!reportId,
  });

  const form = useForm<Writeup>({
    defaultValues: {
      summary: "",
      findings: "",
      recommendations: "",
      conclusions: "",
    },
  });

  useEffect(() => {
    if (writeup) {
      form.reset({
        summary: writeup.summary || "",
        findings: writeup.findings || "",
        recommendations: writeup.recommendations || "",
        conclusions: writeup.conclusions || "",
      });
    }
  }, [writeup, form]);

  const updateWriteupMutation = useMutation({
    mutationFn: async (data: Writeup) => {
      if (!reportId) throw new Error("No report ID");
      return apiRequest("PUT", `/api/reports/${reportId}/writeup`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "writeup"] });
      toast({ title: "Write-up saved successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error saving write-up", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: Writeup) => {
    updateWriteupMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Report Write-up</h2>
        <p className="text-sm text-gray-600 mt-1">Compose the narrative sections of your inspection report</p>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-900">Executive Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="This report summarizes the results of the API 653 out-of-service inspection..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-900">Inspection Findings</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Visual inspection of the tank shell revealed..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-900">Recommendations</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="1. Continue routine thickness monitoring at established CML locations..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conclusions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-900">Conclusions</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="The tank is suitable for continued service..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <Button type="button" variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
                  <SpellCheck className="h-4 w-4 mr-2" />
                  Spell Check
                </Button>
                <Button type="submit" disabled={updateWriteupMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateWriteupMutation.isPending ? "Saving..." : "Save Draft"}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Auto-save enabled</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
