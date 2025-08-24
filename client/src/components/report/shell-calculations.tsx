import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Save, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const shellCalculationSchema = z.object({
  fillHeight: z.string().optional(),
  specificGravity: z.string().optional(),
  jointEfficiency: z.string().optional(),
  courses: z.array(z.object({
    courseNumber: z.number(),
    courseHeight: z.string().optional(),
    material: z.string().optional(),
    stressValue: z.string().optional(),
    alternateStress: z.string().optional(),
    originalThickness: z.string().optional(),
    actualThickness: z.string().optional(),
    alternateTmin: z.string().optional(),
    age: z.string().optional(),
    tMin: z.string().optional(),
    corrosionRate: z.string().optional(),
    remainingLife: z.string().optional(),
    H: z.string().optional(),
  })),
  notes: z.string().optional(),
});

type ShellCalculationData = z.infer<typeof shellCalculationSchema>;

interface ShellCalculationsFormProps {
  reportId: string;
}

const materials = [
  { value: "A283-C", label: "A283 Grade C", stress: "23600" },
  { value: "A285-C", label: "A285 Grade C", stress: "24900" },
  { value: "A36", label: "A36", stress: "26700" },
  { value: "A516-60", label: "A516 Grade 60", stress: "26700" },
  { value: "A516-70", label: "A516 Grade 70", stress: "30000" },
  { value: "A537-1", label: "A537 Class 1", stress: "35000" },
  { value: "OTHER", label: "Other (Enter Stress Value)", stress: "" },
];

const jointEfficiencies = [
  { value: "1.0", label: "1.00 - Fully Radiographed" },
  { value: "0.85", label: "0.85 - Spot Radiographed" },
  { value: "0.7", label: "0.70 - No Radiography" },
];

export function ShellCalculationsForm({ reportId }: ShellCalculationsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<ShellCalculationData>({
    resolver: zodResolver(shellCalculationSchema),
    defaultValues: {
      fillHeight: "",
      specificGravity: "1.0",
      jointEfficiency: "0.85",
      courses: [
        { courseNumber: 1, courseHeight: "8", material: "A36", stressValue: "26700", age: "10" },
        { courseNumber: 2, courseHeight: "8", material: "A36", stressValue: "26700", age: "10" },
        { courseNumber: 3, courseHeight: "8", material: "A36", stressValue: "26700", age: "10" },
        { courseNumber: 4, courseHeight: "8", material: "A36", stressValue: "26700", age: "10" },
        { courseNumber: 5, courseHeight: "8", material: "A36", stressValue: "26700", age: "10" },
      ],
      notes: "",
    },
  });

  // Load report base data to get tank diameter
  const { data: reportData } = useQuery<any>({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });

  // Load existing shell calculations data
  const { data: savedData } = useQuery({
    queryKey: [`/api/reports/${reportId}/shell-calculations`],
    enabled: !!reportId,
  });

  useEffect(() => {
    if (savedData) {
      form.reset(savedData);
    }
  }, [savedData, form]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ShellCalculationData) => {
      return apiRequest(`/api/reports/${reportId}/shell-calculations`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/reports/${reportId}/shell-calculations`] });
      toast({
        title: "Success",
        description: "Shell calculations saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save shell calculations",
        variant: "destructive",
      });
    },
  });

  const calculateShell = () => {
    setIsCalculating(true);
    const values = form.getValues();
    const fillHeight = parseFloat(values.fillHeight || "0");
    const specificGravity = parseFloat(values.specificGravity || "1.0");
    const jointEfficiency = parseFloat(values.jointEfficiency || "0.85");
    // Get tank diameter from report base data
    const tankDiameter = reportData?.nominalDiameter ? parseFloat(reportData.nominalDiameter) : 120;

    const updatedCourses = values.courses.map((course, index) => {
      const courseHeight = parseFloat(course.courseHeight || "8");
      const stressValue = parseFloat(course.stressValue || "26700");
      const originalThickness = parseFloat(course.originalThickness || "0.5");
      const actualThickness = parseFloat(course.actualThickness || "0.45");
      const age = parseFloat(course.age || "10");

      // Calculate H (distance from bottom of course to liquid level)
      let H = fillHeight;
      for (let i = 0; i < index; i++) {
        H -= parseFloat(values.courses[i].courseHeight || "8");
      }
      H = Math.max(0, H);

      // Calculate using CORRECT API 653 formula
      // Step 1: Calculate hydrostatic pressure at bottom of course
      const P = 0.433 * specificGravity * H; // Pressure in psi
      
      // Step 2: Calculate required thickness using API 653 formula
      // t = (P * R) / (S * E - 0.6 * P)
      const radiusInches = (tankDiameter * 12) / 2; // Convert diameter to radius in inches
      
      // Ensure denominator is not negative or zero
      const denominator = stressValue * jointEfficiency - 0.6 * P;
      const requiredThickness = denominator > 0 ? (P * radiusInches) / denominator : 0;
      
      // Step 3: For API 653, minimum thickness should not include future corrosion allowance
      // The calculated thickness IS the minimum required thickness
      const tMin = requiredThickness;
      const tMinRounded = Math.max(0.050, Math.round(tMin * 1000) / 1000);

      // Calculate corrosion rate (in mils per year)
      const thicknessLoss = originalThickness - actualThickness;
      const corrosionRate = age > 0 ? (thicknessLoss / age) * 1000 : 0;
      const corrosionRateRounded = Math.round(corrosionRate * 100) / 100;

      // Calculate remaining life
      const remainingThickness = actualThickness - tMinRounded;
      const remainingLife = corrosionRate > 0 ? (remainingThickness / (corrosionRate / 1000)) : 999;
      const remainingLifeRounded = Math.max(0, Math.min(999, Math.round(remainingLife)));

      return {
        ...course,
        H: H.toFixed(1),
        tMin: tMinRounded.toFixed(3),
        corrosionRate: corrosionRateRounded.toFixed(2),
        remainingLife: remainingLifeRounded.toString(),
      };
    });

    form.setValue("courses", updatedCourses);
    setIsCalculating(false);
    toast({
      title: "Calculations Complete",
      description: "Shell calculations have been updated",
    });
  };

  const onSubmit = (data: ShellCalculationData) => {
    saveMutation.mutate(data);
  };

  const addCourse = () => {
    const courses = form.getValues("courses");
    form.setValue("courses", [
      ...courses,
      { 
        courseNumber: courses.length + 1, 
        courseHeight: "8", 
        material: "A36", 
        stressValue: "26700" 
      },
    ]);
  };

  const removeCourse = (index: number) => {
    const courses = form.getValues("courses");
    if (courses.length > 1) {
      form.setValue("courses", courses.filter((_, i) => i !== index));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Shell Calculations (API 653)</span>
          <div className="flex gap-2">
            <Button onClick={calculateShell} disabled={isCalculating} variant="outline">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate
            </Button>
            <Button onClick={() => onSubmit(form.getValues())} disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* General Parameters */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fillHeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fill Height (ft)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter fill height" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="specificGravity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specific Gravity</FormLabel>
                    <FormControl>
                      <Input placeholder="1.0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jointEfficiency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joint Efficiency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select efficiency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jointEfficiencies.map((eff) => (
                          <SelectItem key={eff.value} value={eff.value}>
                            {eff.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Course Data Table */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Shell Course Data</h3>
                <Button type="button" onClick={addCourse} size="sm">
                  Add Course
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Height (ft)</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Stress (psi)</TableHead>
                      <TableHead>t Original</TableHead>
                      <TableHead>t Actual</TableHead>
                      <TableHead>Age (yrs)</TableHead>
                      <TableHead>t Min</TableHead>
                      <TableHead>CR (mpy)</TableHead>
                      <TableHead>RL (yrs)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.watch("courses").map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>{course.courseNumber}</TableCell>
                        <TableCell>
                          <Input
                            value={course.courseHeight}
                            onChange={(e) => {
                              const courses = form.getValues("courses");
                              courses[index].courseHeight = e.target.value;
                              form.setValue("courses", courses);
                            }}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={course.material}
                            onValueChange={(value) => {
                              const courses = form.getValues("courses");
                              courses[index].material = value;
                              const material = materials.find(m => m.value === value);
                              if (material && material.stress) {
                                courses[index].stressValue = material.stress;
                              }
                              form.setValue("courses", courses);
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((mat) => (
                                <SelectItem key={mat.value} value={mat.value}>
                                  {mat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={course.stressValue}
                            onChange={(e) => {
                              const courses = form.getValues("courses");
                              courses[index].stressValue = e.target.value;
                              form.setValue("courses", courses);
                            }}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={course.originalThickness}
                            onChange={(e) => {
                              const courses = form.getValues("courses");
                              courses[index].originalThickness = e.target.value;
                              form.setValue("courses", courses);
                            }}
                            placeholder="0.500"
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={course.actualThickness}
                            onChange={(e) => {
                              const courses = form.getValues("courses");
                              courses[index].actualThickness = e.target.value;
                              form.setValue("courses", courses);
                            }}
                            placeholder="0.450"
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={course.age}
                            onChange={(e) => {
                              const courses = form.getValues("courses");
                              courses[index].age = e.target.value;
                              form.setValue("courses", courses);
                            }}
                            placeholder="10"
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>{course.tMin || "-"}</TableCell>
                        <TableCell>{course.corrosionRate || "-"}</TableCell>
                        <TableCell>{course.remainingLife || "-"}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCourse(index)}
                            disabled={form.watch("courses").length <= 1}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional notes or observations..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reference Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Joint Efficiency Reference (API 653 Table 4-2)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Joint Type</TableHead>
                      <TableHead>Efficiency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Fully radiographed butt joints</TableCell>
                      <TableCell>1.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Spot radiographed butt joints</TableCell>
                      <TableCell>0.85</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Non-radiographed butt joints</TableCell>
                      <TableCell>0.70</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}