export interface CorrosionCalculationParams {
  originalThickness: number;
  currentThickness: number;
  serviceYears: number;
  practicalTmin: number;
}

export interface CorrosionCalculationResult {
  metalLoss: number;
  corrosionRate: number; // mils per year
  remainingMetal: number;
  remainingLife: number; // years
}

export function calculateCorrosionRate(params: CorrosionCalculationParams): CorrosionCalculationResult {
  const { originalThickness, currentThickness, serviceYears, practicalTmin } = params;
  
  // Convert inches to mils for calculation
  const originalMils = originalThickness * 1000;
  const currentMils = currentThickness * 1000;
  const practicalTminMils = practicalTmin * 1000;
  
  // Calculate metal loss
  const metalLoss = originalMils - currentMils;
  
  // Calculate corrosion rate in mils per year
  const corrosionRate = serviceYears > 0 ? metalLoss / serviceYears : 0;
  
  // Calculate remaining metal above practical tmin
  const remainingMetal = currentMils - practicalTminMils;
  
  // Calculate remaining life in years
  const remainingLife = corrosionRate > 0 ? remainingMetal / corrosionRate : Infinity;
  
  return {
    metalLoss: metalLoss / 1000, // Convert back to inches
    corrosionRate,
    remainingMetal: remainingMetal / 1000, // Convert back to inches
    remainingLife: Math.max(0, remainingLife),
  };
}

export function calculateStatistics(corrosionRates: number[]): {
  average: number;
  maximum: number;
  percentile95: number;
} {
  if (corrosionRates.length === 0) {
    return { average: 0, maximum: 0, percentile95: 0 };
  }
  
  const sorted = [...corrosionRates].sort((a, b) => a - b);
  const average = corrosionRates.reduce((sum, rate) => sum + rate, 0) / corrosionRates.length;
  const maximum = Math.max(...corrosionRates);
  
  // Calculate 95th percentile
  const index95 = Math.floor(0.95 * sorted.length);
  const percentile95 = sorted[Math.min(index95, sorted.length - 1)];
  
  return {
    average: Number(average.toFixed(2)),
    maximum: Number(maximum.toFixed(2)),
    percentile95: Number(percentile95.toFixed(2)),
  };
}

export function generateAutoTminValue(component: string, size?: string): number {
  const defaultTmins: Record<string, number> = {
    'Shell Nozzle': 0.125,
    'Roof Nozzle': 0.188,
    'Bottom Nozzle': 0.125,
    'Manway': 0.250,
    'Shell Course': 0.100,
    'Bottom Plate': 0.050,
    'Roof': 0.063,
  };
  
  // Base tmin on component type
  let baseTmin = defaultTmins[component] || 0.125;
  
  // Adjust based on size if provided
  if (size) {
    const sizeNum = parseFloat(size);
    if (sizeNum >= 12) baseTmin += 0.063; // Larger nozzles need more thickness
    if (sizeNum >= 24) baseTmin += 0.125; // Very large nozzles
  }
  
  return Number(baseTmin.toFixed(3));
}

export function formatThickness(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  return value.toFixed(3);
}

export function formatCorrosionRate(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  return value.toFixed(2);
}

export function formatRemainingLife(value: number | undefined): string {
  if (value === undefined || value === null) return '';
  if (value === Infinity) return '∞';
  return value.toFixed(1);
}

export function getRemainingLifeColor(years: number): string {
  if (years === Infinity) return 'text-success-600';
  if (years > 15) return 'text-success-600';
  if (years > 5) return 'text-warning-600';
  return 'text-error-600';
}

export function getRemainingLifeBadgeColor(years: number): string {
  if (years === Infinity) return 'bg-success-100 text-success-800';
  if (years > 15) return 'bg-success-100 text-success-800';
  if (years > 5) return 'bg-warning-100 text-warning-800';
  return 'bg-error-100 text-error-800';
}
