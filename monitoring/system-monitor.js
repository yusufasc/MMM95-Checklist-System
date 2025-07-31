#!/usr/bin/env node

/**
 * 🔧 MMM95 Backend & Frontend Monitoring System
 * Real-time tracking ve analiz sistemi
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

class SystemMonitor {
  constructor() {
    this.errors = [];
    this.apiCalls = [];
    this.performance = [];
    this.startTime = new Date();
    this.alertThresholds = {
      errorRate: 5, // 5% error rate
      responseTime: 1000, // 1 saniye
      memoryUsage: 85, // 85% memory usage
    };
  }

  // Backend Health Check
  async checkBackend() {
    try {
      const start = Date.now();
      const response = await this.httpRequest(
        "http://localhost:3001/api/auth/me",
        {
          timeout: 5000,
        }
      );
      const responseTime = Date.now() - start;

      return {
        status: response.statusCode === 200 ? "HEALTHY" : "ERROR",
        responseTime,
        timestamp: new Date(),
        details: response.statusCode,
      };
    } catch (error) {
      return {
        status: "ERROR",
        responseTime: null,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  // Frontend Health Check
  async checkFrontend() {
    try {
      const start = Date.now();
      const response = await this.httpRequest("http://localhost:3000", {
        timeout: 5000,
      });
      const responseTime = Date.now() - start;

      return {
        status: response.statusCode === 200 ? "HEALTHY" : "ERROR",
        responseTime,
        timestamp: new Date(),
        details: response.statusCode,
      };
    } catch (error) {
      return {
        status: "ERROR",
        responseTime: null,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  // HTTP Request Helper
  httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        resolve(res);
      });

      req.on("error", reject);
      req.setTimeout(options.timeout || 5000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
    });
  }

  // Error Tracking
  trackError(error, source = "unknown") {
    const errorEntry = {
      timestamp: new Date(),
      source,
      message: error.message || error,
      stack: error.stack,
      severity: this.classifyError(error),
    };

    this.errors.push(errorEntry);

    // Son 100 error'u sakla
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }

    this.checkAlerts();
  }

  // Error Classification
  classifyError(error) {
    const message = error.message || error;

    if (message.includes("500") || message.includes("Internal Server Error")) {
      return "CRITICAL";
    } else if (message.includes("404") || message.includes("Not Found")) {
      return "WARNING";
    } else if (message.includes("400") || message.includes("Bad Request")) {
      return "INFO";
    }

    return "LOW";
  }

  // Performance Tracking
  trackPerformance(operation, duration) {
    this.performance.push({
      timestamp: new Date(),
      operation,
      duration,
      type: this.classifyPerformance(duration),
    });

    // Son 200 performance entry'yi sakla
    if (this.performance.length > 200) {
      this.performance = this.performance.slice(-200);
    }
  }

  // Performance Classification
  classifyPerformance(duration) {
    if (duration > 2000) return "SLOW";
    if (duration > 1000) return "MODERATE";
    return "FAST";
  }

  // Alert System
  checkAlerts() {
    const recent = this.errors.filter(
      (e) => new Date() - e.timestamp < 5 * 60 * 1000 // Son 5 dakika
    );

    const criticalErrors = recent.filter((e) => e.severity === "CRITICAL");

    if (criticalErrors.length >= 3) {
      this.sendAlert(
        "CRITICAL",
        `${criticalErrors.length} critical errors in last 5 minutes`
      );
    }
  }

  // Alert Notification
  sendAlert(level, message) {
    console.log(`🚨 [${level}] ALERT: ${message}`);

    // Log'a kaydet
    const alertLog = `[${new Date().toISOString()}] ${level}: ${message}\n`;
    fs.appendFileSync(path.join(__dirname, "alerts.log"), alertLog);
  }

  // System Status Report
  generateReport() {
    const now = new Date();
    const uptime = Math.floor((now - this.startTime) / 1000);

    const recentErrors = this.errors.filter(
      (e) => now - e.timestamp < 60 * 60 * 1000 // Son 1 saat
    );

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {});

    const recentPerformance = this.performance.filter(
      (p) => now - p.timestamp < 60 * 60 * 1000 // Son 1 saat
    );

    const avgResponseTime =
      recentPerformance.length > 0
        ? recentPerformance.reduce((sum, p) => sum + p.duration, 0) /
          recentPerformance.length
        : 0;

    return {
      timestamp: now,
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor(
        (uptime % 3600) / 60
      )}m ${uptime % 60}s`,
      errors: {
        total: recentErrors.length,
        bySeverity: errorsBySeverity,
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime),
        operations: recentPerformance.length,
      },
      status:
        recentErrors.filter((e) => e.severity === "CRITICAL").length > 0
          ? "CRITICAL"
          : "HEALTHY",
    };
  }

  // Ana Monitoring Loop
  async start() {
    console.log("🔧 MMM95 System Monitor başlatıldı...");

    setInterval(async () => {
      const backendHealth = await this.checkBackend();
      const frontendHealth = await this.checkFrontend();

      console.log(`\n📊 System Health Check - ${new Date().toLocaleString()}`);
      console.log(
        `🚀 Backend: ${backendHealth.status} (${backendHealth.responseTime}ms)`
      );
      console.log(
        `🎮 Frontend: ${frontendHealth.status} (${frontendHealth.responseTime}ms)`
      );

      if (backendHealth.status === "ERROR") {
        this.trackError(
          backendHealth.error || "Backend unreachable",
          "backend"
        );
      }

      if (frontendHealth.status === "ERROR") {
        this.trackError(
          frontendHealth.error || "Frontend unreachable",
          "frontend"
        );
      }

      const report = this.generateReport();
      console.log(
        `📈 Errors (1h): ${report.errors.total}, Avg Response: ${report.performance.avgResponseTime}ms`
      );
    }, 30000); // Her 30 saniyede check
  }
}

// Monitor başlat
if (require.main === module) {
  const monitor = new SystemMonitor();
  monitor.start();
}

module.exports = SystemMonitor;
