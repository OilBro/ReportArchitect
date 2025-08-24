// Direct test of Shell calculation logic
// Testing with exact audit parameters

const testData = {
  fillHeight: "40",
  specificGravity: "1.0", 
  jointEfficiency: "0.85",
  courses: [{
    courseNumber: 1,
    courseHeight: "8",
    material: "A36",
    stressValue: "26700",
    originalThickness: "0.500",
    actualThickness: "0.485",
    age: "10"
  }]
};

// Simulate the calculation that happens in the UI
function calculateShell() {
  const fillHeight = parseFloat(testData.fillHeight);
  const specificGravity = parseFloat(testData.specificGravity);
  const jointEfficiency = parseFloat(testData.jointEfficiency);
  const tankDiameter = 120; // ft
  
  const course = testData.courses[0];
  const stressValue = parseFloat(course.stressValue);
  const originalThickness = parseFloat(course.originalThickness);
  const actualThickness = parseFloat(course.actualThickness);
  const age = parseFloat(course.age);
  
  // Calculate H (for first course, H = fillHeight)
  const H = fillHeight;
  
  // API 653 Formula Implementation
  const P = 0.433 * specificGravity * H;
  const radiusInches = (tankDiameter * 12) / 2;
  const requiredThickness = (P * radiusInches) / (stressValue * jointEfficiency - 0.6 * P);
  const corrosionAllowance = 0.100;
  const tMin = requiredThickness + corrosionAllowance;
  
  // Corrosion rate
  const thicknessLoss = originalThickness - actualThickness;
  const corrosionRate = age > 0 ? (thicknessLoss / age) * 1000 : 0;
  
  console.log("Direct Calculation Test Results:");
  console.log("================================");
  console.log(`Hydrostatic Pressure P = ${P.toFixed(2)} psi`);
  console.log(`Required Thickness = ${requiredThickness.toFixed(3)} inches`);
  console.log(`Minimum Thickness (with CA) = ${tMin.toFixed(3)} inches`);
  console.log(`Corrosion Rate = ${corrosionRate.toFixed(1)} mpy`);
  console.log("\nExpected from Audit:");
  console.log("Minimum Thickness = 0.650 inches");
  console.log("Corrosion Rate = 1.5 mpy");
  
  return {
    tMin: tMin.toFixed(3),
    corrosionRate: corrosionRate.toFixed(2)
  };
}

calculateShell();
