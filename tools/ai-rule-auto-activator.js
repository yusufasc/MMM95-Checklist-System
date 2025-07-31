#!/usr/bin/env node

/**
 * 🎯 AI Rule Auto Activator
 * Kullanıcı input'una göre otomatik cursor rule aktivasyonu
 */

const fs = require("fs");
const path = require("path");

class AIRuleActivator {
  constructor() {
    this.configPath = path.join(
      __dirname,
      "../.cursor/ai-rule-coordinator.json"
    );
    this.config = this.loadConfig();
    this.activeRules = [];
    this.lastContext = null;
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(this.configPath, "utf8");
      return JSON.parse(configData);
    } catch (error) {
      console.error(
        "❌ AI Rule Coordinator config yüklenemedi:",
        error.message
      );
      return null;
    }
  }

  /**
   * Ana analiz fonksiyonu - user input'u analiz eder
   */
  analyzeUserInput(userInput, currentFile = null, openFiles = []) {
    const context = this.detectContext(userInput, currentFile, openFiles);
    const intent = this.detectIntent(userInput);
    const recommendedRules = this.selectRules(context, intent);

    return {
      context,
      intent,
      recommendedRules,
      activationCommand: this.generateActivationCommand(recommendedRules),
      explanation: this.generateExplanation(context, intent, recommendedRules),
    };
  }

  /**
   * Context detection - dosya, anahtar kelime, proje yapısı analizi
   */
  detectContext(userInput, currentFile, openFiles) {
    const contexts = [];
    const coordinator = this.config.ruleCoordinator;

    // File-based context detection
    if (currentFile) {
      const fileContext = this.getFileContext(currentFile);
      if (fileContext) contexts.push(fileContext);
    }

    // Keyword-based context detection
    const keywordContext = this.getKeywordContext(userInput);
    contexts.push(...keywordContext);

    // Intent-based context detection
    const intentContext = this.getIntentContext(userInput);
    if (intentContext) contexts.push(intentContext);

    return [...new Set(contexts)]; // Remove duplicates
  }

  /**
   * Dosya türüne göre context belirleme
   */
  getFileContext(filePath) {
    if (!this.config?.ruleCoordinator?.contextDetection?.filePatterns) {
      return null;
    }

    const patterns = this.config.ruleCoordinator.contextDetection.filePatterns;

    for (const [context, pathPatterns] of Object.entries(patterns)) {
      for (const pattern of pathPatterns) {
        const regex = new RegExp(
          pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")
        );
        if (regex.test(filePath)) {
          return context;
        }
      }
    }

    return null;
  }

  /**
   * Anahtar kelimelere göre context belirleme
   */
  getKeywordContext(userInput) {
    if (!this.config?.ruleCoordinator?.contextDetection?.contentKeywords) {
      return [];
    }

    const keywords =
      this.config.ruleCoordinator.contextDetection.contentKeywords;
    const contexts = [];

    const inputLower = userInput.toLowerCase();

    for (const [context, contextKeywords] of Object.entries(keywords)) {
      for (const keyword of contextKeywords) {
        if (inputLower.includes(keyword.toLowerCase())) {
          contexts.push(context);
          break;
        }
      }
    }

    return contexts;
  }

  /**
   * User intent detection
   */
  detectIntent(userInput) {
    if (!this.config?.ruleCoordinator?.contextDetection?.userIntentKeywords) {
      return "development"; // Default intent
    }

    const intentKeywords =
      this.config.ruleCoordinator.contextDetection.userIntentKeywords;

    const inputLower = userInput.toLowerCase();

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      for (const keyword of keywords) {
        if (inputLower.includes(keyword.toLowerCase())) {
          return intent;
        }
      }
    }

    return "development"; // Default intent
  }

  /**
   * Intent-based context belirleme
   */
  getIntentContext(userInput) {
    const inputLower = userInput.toLowerCase();

    // Manuel komut detection
    if (
      this.config?.ruleCoordinator?.activationInstructions?.manualOverride
        ?.commands
    ) {
      const manualCommands =
        this.config.ruleCoordinator.activationInstructions.manualOverride
          .commands;
      for (const [command] of Object.entries(manualCommands)) {
        if (inputLower.includes(command)) {
          return command.substring(1); // Remove @ symbol
        }
      }
    }

    return null;
  }

  /**
   * Context ve intent'e göre rule selection
   */
  selectRules(contexts, intent) {
    if (!this.config?.ruleCoordinator) {
      return ["core-cursor.mdc"]; // Fallback
    }

    const coordinator = this.config.ruleCoordinator;
    const selectedRules = new Set();

    // Primary context rules
    for (const context of contexts) {
      const primaryRules =
        coordinator.ruleActivationMatrix?.contextPriority?.primary?.[context];
      if (primaryRules) {
        primaryRules.forEach((rule) => selectedRules.add(rule));
      }
    }

    // Intent-based rules
    const intentRules =
      coordinator.ruleActivationMatrix?.intentBasedActivation?.[intent];
    if (intentRules) {
      intentRules.forEach((rule) => selectedRules.add(rule));
    }

    // Secondary context rules (if primary not enough)
    if (selectedRules.size < 2) {
      for (const context of contexts) {
        const secondaryRules =
          coordinator.ruleActivationMatrix?.contextPriority?.secondary?.[
            context
          ];
        if (secondaryRules) {
          secondaryRules.forEach((rule) => selectedRules.add(rule));
        }
      }
    }

    // Smart combinations
    const combination = this.getSmartCombination(contexts, intent);
    if (combination) {
      combination.forEach((rule) => selectedRules.add(rule));
    }

    // Max active rules limit
    const maxRules =
      coordinator.activationInstructions?.autoActivation?.maxActiveRules || 4;
    const rulesArray = Array.from(selectedRules);

    return rulesArray.slice(0, maxRules);
  }

  /**
   * Smart rule combinations
   */
  getSmartCombination(contexts, intent) {
    if (
      !this.config?.ruleCoordinator?.ruleActivationMatrix?.smartCombinations
    ) {
      return null;
    }

    const combinations =
      this.config.ruleCoordinator.ruleActivationMatrix.smartCombinations;

    // Full-stack development detection
    if (contexts.includes("backend") && contexts.includes("frontend")) {
      return combinations.fullStackDevelopment;
    }

    // API development detection
    if (contexts.includes("backend") && contexts.includes("api")) {
      return combinations.apiDevelopment;
    }

    // Frontend-only detection
    if (contexts.includes("frontend") && !contexts.includes("backend")) {
      return combinations.frontendDevelopment;
    }

    // Production deployment detection
    if (intent === "deployment") {
      return combinations.productionDeployment;
    }

    // Quality assurance detection
    if (contexts.includes("testing") || intent === "optimization") {
      return combinations.qualityAssurance;
    }

    // Data management detection
    if (contexts.includes("database") || contexts.includes("data")) {
      return combinations.dataManagement;
    }

    return null;
  }

  /**
   * Activation command generation
   */
  generateActivationCommand(rules) {
    if (!rules || rules.length === 0) {
      return "@core";
    }

    // Map rules to @ commands
    const ruleToCommand = {
      "backend-cursor.mdc": "@backend",
      "frontend-cursor.mdc": "@frontend",
      "database-cursor.mdc": "@database",
      "security-cursor.mdc": "@security",
      "testing-cursor.mdc": "@test",
      "deployment-cursor.mdc": "@deploy",
      "debugging-troubleshooting-cursor.mdc": "@debug",
      "eslint-performance-cursor.mdc": "@performance",
      "api-documentation-cursor.mdc": "@docs",
      "mobile-pwa-cursor.mdc": "@mobile",
      "data-management-cursor.mdc": "@data",
      "maintenance-cursor.mdc": "@maintenance",
      "monitoring-logging-cursor.mdc": "@monitoring",
      "core-cursor.mdc": "@core",
    };

    const commands = rules
      .map((rule) => ruleToCommand[rule])
      .filter((cmd) => cmd)
      .slice(0, 3); // Max 3 commands

    return commands.join(" ");
  }

  /**
   * Açıklama metni generation
   */
  generateExplanation(contexts, intent, rules) {
    let explanation = `🎯 **AI Rule Activation Analysis**\n\n`;

    explanation += `**Detected Context:** ${contexts.join(", ")}\n`;
    explanation += `**Detected Intent:** ${intent}\n`;
    explanation += `**Recommended Rules:** ${rules.length}\n\n`;

    explanation += `**Active Rules:**\n`;
    rules.forEach((rule) => {
      const ruleName = rule.replace("-cursor.mdc", "").replace("-", " ");
      explanation += `✅ ${ruleName}\n`;
    });

    explanation += `\n**Why these rules?**\n`;
    explanation += this.generateWhyExplanation(contexts, intent);

    return explanation;
  }

  /**
   * "Neden bu rule'lar?" açıklaması
   */
  generateWhyExplanation(contexts, intent) {
    let why = "";

    if (contexts.includes("backend")) {
      why +=
        "• Backend context detected → Backend development rules activated\n";
    }

    if (contexts.includes("frontend")) {
      why +=
        "• Frontend context detected → Frontend development rules activated\n";
    }

    if (contexts.includes("database")) {
      why +=
        "• Database context detected → Database optimization rules activated\n";
    }

    if (intent === "debugging") {
      why += "• Debugging intent detected → Troubleshooting rules activated\n";
    }

    if (intent === "optimization") {
      why += "• Optimization intent detected → Performance rules activated\n";
    }

    if (intent === "deployment") {
      why +=
        "• Deployment intent detected → Production deployment rules activated\n";
    }

    return (
      why ||
      "• General development context → Core development rules activated\n"
    );
  }

  /**
   * Test fonksiyonu
   */
  test() {
    const testCases = [
      {
        input: "Backend'de yeni user API'si oluştur",
        file: "backend/routes/users.js",
        expected: ["backend", "api"],
      },
      {
        input: "React component hatası var, düzeltmek lazım",
        file: "frontend/src/components/App.jsx",
        expected: ["frontend", "debugging"],
      },
      {
        input: "MongoDB query performance optimization",
        file: "backend/models/User.js",
        expected: ["database", "performance"],
      },
      {
        input: "@fullstack Kullanıcı profil sistemi ekle",
        file: null,
        expected: ["fullstack"],
      },
    ];

    console.log("🧪 **AI Rule Activator Test Sonuçları**\n");

    testCases.forEach((testCase, index) => {
      console.log(`**Test ${index + 1}:** ${testCase.input}`);

      const result = this.analyzeUserInput(testCase.input, testCase.file);

      console.log(`Context: ${result.context.join(", ")}`);
      console.log(`Intent: ${result.intent}`);
      console.log(`Command: ${result.activationCommand}`);
      console.log(`Rules: ${result.recommendedRules.length}\n`);
    });
  }
}

// CLI Usage
if (require.main === module) {
  const activator = new AIRuleActivator();

  const args = process.argv.slice(2);

  if (args[0] === "test") {
    activator.test();
  } else if (args[0] === "analyze") {
    const userInput = args.slice(1).join(" ");
    const result = activator.analyzeUserInput(userInput);
    console.log(result.explanation);
    console.log(`\n💡 **Recommended Command:** ${result.activationCommand}`);
  } else {
    console.log(`
🎯 **AI Rule Auto Activator**

Usage:
  node ai-rule-auto-activator.js test                    # Run tests
  node ai-rule-auto-activator.js analyze "user input"    # Analyze input

Examples:
  node ai-rule-auto-activator.js analyze "Backend API oluştur"
  node ai-rule-auto-activator.js analyze "React component debug"
  node ai-rule-auto-activator.js analyze "@fullstack User management"
    `);
  }
}

module.exports = AIRuleActivator;
