const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const ejs = require('ejs');
const { format } = require('date-fns');
const { tr } = require('date-fns/locale');

/**
 * 📄 MMM95 PDF Report Generation Service
 * Enterprise-grade PDF reports for meetings, analytics, and performance
 */
class PDFService {
  constructor() {
    this.browser = null;
    this.templatesPath = path.join(__dirname, '../views/pdf-templates');
  }

  /**
   * Initialize Puppeteer browser
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 📊 Generate Analytics Dashboard PDF Report
   */
  async generateAnalyticsReport(analyticsData, options = {}) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({ width: 1200, height: 800 });

      // Prepare template data
      const templateData = {
        title: 'MMM95 Analytics Raporu',
        generatedAt: format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: tr }),
        period: options.period || '30 gün',
        data: analyticsData,
        companyName: 'MMM95 Endüstriyel Ekipman Yönetimi',
        reportType: 'Analytics Dashboard',
        ...options,
      };

      // Render HTML template
      const templatePath = path.join(
        this.templatesPath,
        'analytics-report.ejs',
      );
      const htmlContent = await ejs.renderFile(templatePath, templateData);

      // Generate PDF
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(templateData),
        footerTemplate: this.getFooterTemplate(),
        preferCSSPageSize: true,
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await page.close();

      return {
        success: true,
        buffer: pdfBuffer,
        filename: `MMM95_Analytics_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`,
        size: pdfBuffer.length,
      };
    } catch (error) {
      console.error('❌ Analytics PDF generation error:', error);
      throw new Error(`PDF oluşturma hatası: ${error.message}`);
    }
  }

  /**
   * 📝 Generate Meeting Report PDF
   */
  async generateMeetingReport(meetingData, options = {}) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setViewport({ width: 1200, height: 800 });

      // Prepare meeting template data
      const templateData = {
        title: `Toplantı Raporu: ${meetingData.baslik}`,
        meeting: meetingData,
        generatedAt: format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: tr }),
        companyName: 'MMM95 Endüstriyel Ekipman Yönetimi',
        reportType: 'Meeting Report',
        ...options,
      };

      // Render meeting template
      const templatePath = path.join(this.templatesPath, 'meeting-report.ejs');
      const htmlContent = await ejs.renderFile(templatePath, templateData);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(templateData),
        footerTemplate: this.getFooterTemplate(),
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await page.close();

      return {
        success: true,
        buffer: pdfBuffer,
        filename: `Toplanti_Raporu_${meetingData._id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        size: pdfBuffer.length,
      };
    } catch (error) {
      console.error('❌ Meeting PDF generation error:', error);
      throw new Error(`Toplantı raporu oluşturma hatası: ${error.message}`);
    }
  }

  /**
   * 📈 Generate Performance Report PDF
   */
  async generatePerformanceReport(performanceData, options = {}) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setViewport({ width: 1200, height: 800 });

      const templateData = {
        title: 'MMM95 Performans Raporu',
        performance: performanceData,
        generatedAt: format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: tr }),
        period: options.period || '30 gün',
        companyName: 'MMM95 Endüstriyel Ekipman Yönetimi',
        reportType: 'Performance Report',
        ...options,
      };

      const templatePath = path.join(
        this.templatesPath,
        'performance-report.ejs',
      );
      const htmlContent = await ejs.renderFile(templatePath, templateData);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(templateData),
        footerTemplate: this.getFooterTemplate(),
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await page.close();

      return {
        success: true,
        buffer: pdfBuffer,
        filename: `MMM95_Performans_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`,
        size: pdfBuffer.length,
      };
    } catch (error) {
      console.error('❌ Performance PDF generation error:', error);
      throw new Error(`Performans raporu oluşturma hatası: ${error.message}`);
    }
  }

  /**
   * 📋 Generate Custom Analytics Report with Charts
   */
  async generateCustomReport(chartData, options = {}) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.setViewport({ width: 1200, height: 800 });

      // Inject Recharts and Chart.js for chart rendering
      await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/chart.js' });
      await page.addScriptTag({
        url: 'https://unpkg.com/react@18/umd/react.production.min.js',
      });
      await page.addScriptTag({
        url: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
      });
      await page.addScriptTag({
        url: 'https://unpkg.com/recharts@2.12.7/umd/Recharts.js',
      });

      const templateData = {
        title: options.title || 'MMM95 Özel Rapor',
        charts: chartData,
        generatedAt: format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: tr }),
        companyName: 'MMM95 Endüstriyel Ekipman Yönetimi',
        reportType: 'Custom Report',
        ...options,
      };

      const templatePath = path.join(this.templatesPath, 'custom-report.ejs');
      const htmlContent = await ejs.renderFile(templatePath, templateData);

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Wait for charts to render
      await page.waitForTimeout(3000);

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(templateData),
        footerTemplate: this.getFooterTemplate(),
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      await page.close();

      return {
        success: true,
        buffer: pdfBuffer,
        filename: `MMM95_Ozel_Rapor_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`,
        size: pdfBuffer.length,
      };
    } catch (error) {
      console.error('❌ Custom PDF generation error:', error);
      throw new Error(`Özel rapor oluşturma hatası: ${error.message}`);
    }
  }

  /**
   * Get PDF header template
   */
  getHeaderTemplate(data) {
    return `
      <div style="width: 100%; font-size: 10px; padding: 5px 15px; color: #666; border-bottom: 1px solid #eee;">
        <div style="float: left;">${data.companyName}</div>
        <div style="float: right;">${data.reportType}</div>
        <div style="clear: both;"></div>
      </div>
    `;
  }

  /**
   * Get PDF footer template
   */
  getFooterTemplate() {
    return `
      <div style="width: 100%; font-size: 10px; padding: 5px 15px; color: #666; border-top: 1px solid #eee;">
        <div style="float: left;">MMM95 - Endüstriyel Ekipman Yönetim Sistemi</div>
        <div style="float: right;">Sayfa <span class="pageNumber"></span> / <span class="totalPages"></span></div>
        <div style="clear: both;"></div>
      </div>
    `;
  }

  /**
   * 🧹 Cleanup resources
   */
  async cleanup() {
    await this.closeBrowser();
  }
}

module.exports = new PDFService();
