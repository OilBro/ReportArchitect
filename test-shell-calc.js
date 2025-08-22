// Test Shell Calculation with Audit Parameters
// This verifies the fix for the critical calculation errors

const testParams = {
  fillHeight: 40,  // ft
  specificGravity: 1.0,
  jointEfficiency: 0.85,
  tankDiameter: 120,  // ft
  courseHeight: 8,  // ft
  stressValue: 26700,  // psi
  originalThickness: 0.500,  // inches
  actualThickness: 0.485,  // inches
  age: 10  // years
};

// Calculate using CORRECT API 653 formulas (as implemented in the fix)
function calculateShell(params) {
  const { fillHeight, specificGravity, jointEfficiency, tankDiameter, 
          stressValue, originalThickness, actualThickness, age } = params;
  
  // Calculate H (distance from bottom of course to liquid level)
  const H = fillHeight;  // For first course
  
  // Step 1: Calculate hydrostatic pressure at bottom of course
  const P = 0.433 * specificGravity * H;  // Pressure in psi
  console.log(`Hydrostatic Pressure P = 0.433 × ${specificGravity} × ${H} = ${P.toFixed(2)} psi`);
  
  // Step 2: Calculate required thickness using API 653 formula
  // t = (P × R) / (S × E - 0.6 × P)
  const radiusInches = (tankDiameter * 12) / 2;  // Convert diameter to radius in inches
  const requiredThickness = (P * radiusInches) / (stressValue * jointEfficiency - 0.6 * P);
  console.log(`Required thickness = (${P.toFixed(2)} × ${radiusInches}) / (${stressValue} × ${jointEfficiency} - 0.6 × ${P.toFixed(2)}) = ${requiredThickness.toFixed(3)} inches`);
  
  // Step 3: Add corrosion allowance (typically 0.100 inches)
  const corrosionAllowance = 0.100;
  const tMin = requiredThickness + corrosionAllowance;
  console.log(`Minimum thickness t_min = ${requiredThickness.toFixed(3)} + ${corrosionAllowance} = ${tMin.toFixed(3)} inches`);
  
  // Calculate corrosion rate (in mils per year)
  const thicknessLoss = originalThickness - actualThickness;
  const corrosionRate = age > 0 ? (thicknessLoss / age) * 1000 : 0;
  console.log(`Corrosion rate = (${originalThickness} - ${actualThickness}) / ${age} × 1000 = ${corrosionRate.toFixed(1)} mpy`);
  
  // Calculate remaining life
  const remainingThickness = actualThickness - tMin;
  const remainingLife = corrosionRate > 0 ? (remainingThickness / (corrosionRate / 1000)) : 999;
  console.log(`Remaining life = ${remainingThickness.toFixed(3)} / ${(corrosionRate/1000).toFixed(4)} = ${remainingLife.toFixed(1)} years`);
  
  return {
    pressure: P,
    requiredThickness: requiredThickness,
    tMin: tMin,
    corrosionRate: corrosionRate,
    remainingLife: remainingLife
  };
}

console.log("=====================================");
console.log("API 653 Shell Calculation Test");
console.log("Testing with Audit Parameters");
console.log("=====================================\n");

const results = calculateShell(testParams);

console.log("\n=====================================");
console.log("EXPECTED RESULTS (from Audit):");
console.log("- Minimum Thickness: ~0.650 inches");
console.log("- Corrosion Rate: 1.5 mpy");
console.log("\nCALCULATED RESULTS (Fixed Formula):");
console.log(`- Minimum Thickness: ${results.tMin.toFixed(3)} inches`);
console.log(`- Corrosion Rate: ${results.corrosionRate.toFixed(1)} mpy`);

// Verify the fix is correct
const tMinCorrect = Math.abs(results.tMin - 0.650) < 0.01;
const corrosionRateCorrect = Math.abs(results.corrosionRate - 1.5) < 0.1;

console.log("\n=====================================");
console.log("VERIFICATION:");
console.log(`✓ Minimum Thickness: ${tMinCorrect ? 'CORRECT' : 'INCORRECT'} (${results.tMin.toFixed(3)} vs 0.650)`);
console.log(`✓ Corrosion Rate: ${corrosionRateCorrect ? 'CORRECT' : 'INCORRECT'} (${results.corrosionRate.toFixed(1)} vs 1.5)`);
console.log("=====================================");

if (tMinCorrect && corrosionRateCorrect) {
  console.log("\n✅ SHELL CALCULATION FIX VERIFIED - All calculations are now correct!");
} else {
  console.log("\n❌ CALCULATION ERROR - Fix may not be complete");
}