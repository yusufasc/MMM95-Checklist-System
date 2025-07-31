const fs = require("fs");
const path = require("path");

/**
 * 🔧 ESLint Trailing Comma Auto-Fix Tool
 * Frontend dosyalarında trailing comma hatalarını düzeltir
 */

console.log("🔧 ESLint Trailing Comma Auto-Fix Tool");
console.log("=====================================");

const filesToFix = [
  "frontend/src/components/MyActivity/ScoreBreakdown.js",
  "frontend/src/pages/EquipmentManagement.js",
];

filesToFix.forEach((filePath) => {
  try {
    console.log(`\n📖 Processing: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;

    // Fix common trailing comma patterns
    const fixes = [
      // Function call parameters ending with comma inside )
      {
        pattern: /,(\s*)\)/g,
        replacement: "$1)",
        description: "Remove trailing comma before closing parenthesis",
      },
      // Array/Object literals missing trailing comma
      {
        pattern: /([^\s,])\s*\n(\s*[\]\}])/g,
        replacement: "$1,\n$2",
        description: "Add missing trailing comma in arrays/objects",
      },
      // Fix specific problematic patterns from ESLint errors
      {
        pattern: /'error'\s*\)/g,
        replacement: "'error',)",
        description: "Fix error string trailing comma",
      },
      {
        pattern: /'success'\s*\)/g,
        replacement: "'success',)",
        description: "Fix success string trailing comma",
      },
      {
        pattern: /'tr-TR'\s*\)/g,
        replacement: "'tr-TR',)",
        description: "Fix tr-TR string trailing comma",
      },
      {
        pattern: /\[\s*\]\s*,/g,
        replacement: "[]",
        description: "Remove comma after empty array",
      },
    ];

    fixes.forEach((fix) => {
      const before = content;
      content = content.replace(fix.pattern, fix.replacement);
      if (before !== content) {
        console.log(`🔧 Applied: ${fix.description}`);
        changed = true;
      }
    });

    // Custom fixes for specific line patterns
    const lines = content.split("\n");

    // Look for patterns that need trailing comma fixes
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Fix lines ending with single quotes without comma
      if (
        trimmed.match(/['"]\s*$/) &&
        !trimmed.includes(",") &&
        lines[index + 1] &&
        lines[index + 1].trim().match(/^[\)\]\}]/)
      ) {
        lines[index] = line.replace(/(['"])\s*$/, "$1,");
        console.log(`🔧 Line ${lineNum}: Added trailing comma`);
        changed = true;
      }
    });

    if (changed) {
      const updatedContent = lines.join("\n");
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ File updated: ${filePath}`);
    } else {
      console.log(`✅ No changes needed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log("\n🎯 Trailing comma fixes completed!");
console.log("Run `npm run lint` to verify fixes.");
