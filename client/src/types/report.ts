export interface ReportFormData {
  reportNumber: string;
  tankId: string;
  inspectionDate: string;
  unitSet: 'US' | 'Metric' | 'Other';
  
  // Tank specifications
  nominalDiameter?: number;
  shellHeight?: number;
  designPressure?: number;
  originalThickness?: number;
  
  // Material and service
  plateSpec?: string;
  service?: string;
  age?: number;
  
  // Inspector information
  inspectorName?: string;
  inspectorRecord?: string;
  inspectorCertification?: string;
  
  // Cover text and additional data
  coverText?: string;
  customFields?: Record<string, string>;
}

export interface CMLRecord {
  id?: string;
  cmlId: string;
  component: string;
  location: string;
  reading1?: number;
  reading2?: number;
  reading3?: number;
  reading4?: number;
  reading5?: number;
  reading6?: number;
  currentReading?: number;
  previousReading?: number;
  corrosionRate?: number;
  remainingLife?: number;
}

export interface NozzleCMLRecord {
  id?: string;
  cmlId: string;
  compId: string;
  size?: number;
  location: string;
  nominalThickness?: number;
  reading1?: number;
  reading2?: number;
  reading3?: number;
  reading4?: number;
  currentReading?: number;
  corrosionRate?: number;
  remainingLife?: number;
}

export interface PracticalTmin {
  id?: string;
  component: string;
  size?: string;
  practicalTmin?: number;
}

export interface Appendix {
  id?: string;
  appendixLetter: string;
  isApplicable: boolean;
  subject?: string;
  content?: string;
  order: number;
}

export interface Writeup {
  id?: string;
  summary?: string;
  findings?: string;
  recommendations?: string;
  conclusions?: string;
}

export const MATERIAL_OPTIONS = [
  'A516 Grade 70',
  'A36',
  'A572 Grade 50',
  'A283 Grade C',
  'A537 Class 1',
];

export const SERVICE_OPTIONS = [
  'Crude Oil',
  'Gasoline',
  'Diesel',
  'Water',
  'Jet Fuel',
  'Heating Oil',
];

export const INSPECTOR_OPTIONS = [
  'John Smith, API 653',
  'Sarah Johnson, API 653',
  'Mike Wilson, API 653',
  'Lisa Brown, API 653',
];

export const COMPONENT_OPTIONS = [
  'Shell Crs 1',
  'Shell Crs 2',
  'Shell Crs 3',
  'Shell Crs 4',
  'Bottom Plate',
  'Roof',
  'Annular Plate',
];
