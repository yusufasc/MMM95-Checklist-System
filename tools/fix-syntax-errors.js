#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔧 Critical Syntax Error Fix Tool");
console.log("===================================");

// Files to fix
const filesToFix = ["frontend/src/pages/EquipmentManagement.js"];

function fixSyntaxErrors(filePath) {
  console.log(`\n📖 Processing: ${filePath}`);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    // Fix syntax patterns: ;, -> ;
    const fixes = [
      {
        pattern: /;,(\s*\n)/g,
        replacement: ";$1",
        name: "semicolon followed by comma",
      },
      {
        pattern: /\),(\s*\n)/g,
        replacement: ")$1",
        name: "closing paren followed by comma",
      },
      {
        pattern: /\},(\s*\n)/g,
        replacement: "}$1",
        name: "closing brace followed by comma",
      },
      {
        pattern: /;,(\s*})/g,
        replacement: ";$1",
        name: "semicolon comma before closing brace",
      },
      {
        pattern: /\);,(\s*\n)/g,
        replacement: ");$1",
        name: "paren semicolon comma",
      },
    ];

    fixes.forEach((fix) => {
      const beforeCount = (content.match(fix.pattern) || []).length;
      content = content.replace(fix.pattern, fix.replacement);
      const afterCount = (content.match(fix.pattern) || []).length;

      if (beforeCount > 0) {
        console.log(`  ✅ Fixed ${beforeCount} instances of ${fix.name}`);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`✅ Successfully fixed syntax errors in ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No syntax errors found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
let totalFixed = 0;
filesToFix.forEach((file) => {
  if (fixSyntaxErrors(file)) {
    totalFixed++;
  }
});

console.log(`\n🎯 Syntax error fixes completed!`);
console.log(`📊 Fixed ${totalFixed} file(s)`);
console.log("Run `npm run lint` to verify fixes.");
