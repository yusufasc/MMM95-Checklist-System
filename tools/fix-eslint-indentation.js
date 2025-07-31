const fs = require("fs");

/**
 * 🔧 ESLint Indentation Auto-Fix Tool
 * MyActivityHelpers.js için indentation hatalarını düzeltir
 */

console.log("🔧 ESLint Indentation Auto-Fix Tool");
console.log("==================================");

const filePath = "backend/services/myActivityHelpers.js";

try {
  console.log(`📖 Reading file: ${filePath}`);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  console.log(`📊 Total lines: ${lines.length}`);

  // Problematic lines from ESLint error report
  const problematicLines = [
    169, 170, 171, 172, 173, 947, 948, 949, 950, 951, 952, 953, 954, 956, 957,
    958, 959, 960, 961, 962, 963, 964, 965, 967, 968, 969, 970, 971, 972, 973,
    974, 975, 977, 978, 979, 980, 981, 982, 983, 984, 985, 987, 988, 989, 990,
    991, 992, 993, 994, 996, 997, 998, 999, 1000, 1001, 1002, 1003, 1004, 1006,
    1007, 1008, 1009, 1010, 1011, 1447, 1450, 1457, 1460, 1466, 1469,
  ];

  console.log(`🔍 Checking ${problematicLines.length} problematic lines...`);

  let fixed = 0;

  problematicLines.forEach((lineNum) => {
    if (lineNum <= lines.length) {
      const line = lines[lineNum - 1]; // Convert to 0-based index

      // Count leading spaces
      const leadingSpaces = line.match(/^( *)/)[0].length;

      // If line has content and wrong indentation
      if (line.trim().length > 0) {
        // Calculate correct indentation (multiple of 2)
        const correctSpaces = Math.floor(leadingSpaces / 2) * 2;

        // If correction is needed
        if (leadingSpaces !== correctSpaces) {
          const correctedLine = " ".repeat(correctSpaces) + line.trimStart();
          lines[lineNum - 1] = correctedLine;

          console.log(
            `🔧 Line ${lineNum}: ${leadingSpaces} spaces → ${correctSpaces} spaces`
          );
          fixed++;
        }
      }
    }
  });

  if (fixed > 0) {
    console.log(`💾 Writing corrected file... (${fixed} lines fixed)`);
    fs.writeFileSync(filePath, lines.join("\n"));
    console.log("✅ File corrected successfully!");
  } else {
    console.log("✅ No corrections needed");
  }
} catch (error) {
  console.error("❌ Error:", error.message);
}
