const express = require('express');
const router = express.Router();
const slackService = require('../services/slackService');
const cacheService = require('../services/cacheService');
const excelService = require('../services/excelService');
const taskScheduler = require('../services/taskScheduler');

/**
 * @route   GET /api/services/test
 * @desc    Tüm servisleri test et
 * @access  Public (test için)
 */
router.get('/test', async (req, res) => {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      services: {},
    };

    // 1. Cache Service Test
    try {
      await cacheService.set('test_key', { test: 'data' }, 60);
      const testData = await cacheService.get('test_key');
      await cacheService.del('test_key');

      testResults.services.cacheService = {
        status: 'success',
        message: 'Cache operations working',
        stats: cacheService.getStats(),
        testData: testData ? 'retrieved' : 'not found',
      };
    } catch (error) {
      testResults.services.cacheService = {
        status: 'error',
        message: error.message,
      };
    }

    // 2. Slack Service Test
    try {
      testResults.services.slackService = {
        status: slackService.enabled ? 'enabled' : 'disabled',
        message: slackService.enabled
          ? 'Slack service ready'
          : 'Slack service disabled (no webhook URL)',
        webhookConfigured: !!slackService.webhookUrl,
      };
    } catch (error) {
      testResults.services.slackService = {
        status: 'error',
        message: error.message,
      };
    }

    // 3. Excel Service Test
    try {
      const testData = [{ name: 'Test', value: 123 }];
      const excelBuffer = await excelService.generateExportFile(
        testData,
        'test',
      );

      testResults.services.excelService = {
        status: 'success',
        message: 'Excel generation working',
        bufferSize: excelBuffer.buffer.length,
      };
    } catch (error) {
      testResults.services.excelService = {
        status: 'error',
        message: error.message,
      };
    }

    // 4. Task Scheduler Test
    try {
      testResults.services.taskScheduler = {
        status: taskScheduler.isRunning ? 'running' : 'stopped',
        message: taskScheduler.isRunning
          ? 'Task scheduler active'
          : 'Task scheduler not running',
      };
    } catch (error) {
      testResults.services.taskScheduler = {
        status: 'error',
        message: error.message,
      };
    }

    // 5. MyActivity Service Test
    try {
      // MyActivity service routes üzerinden test edilir
      testResults.services.myActivityService = {
        status: 'available',
        message: 'MyActivity service routes available',
        endpoints: [
          '/api/my-activity/summary',
          '/api/my-activity/detailed',
          '/api/my-activity/scores-detail',
          '/api/my-activity/daily-performance',
          '/api/my-activity/ranking',
        ],
      };
    } catch (error) {
      testResults.services.myActivityService = {
        status: 'error',
        message: error.message,
      };
    }

    // Overall status
    const allServicesWorking = Object.values(testResults.services).every(
      service =>
        service.status === 'success' ||
        service.status === 'running' ||
        service.status === 'enabled',
    );

    res.json({
      success: true,
      overall: allServicesWorking
        ? 'All services operational'
        : 'Some services have issues',
      ...testResults,
    });
  } catch (error) {
    console.error('Services test error:', error);
    res.status(500).json({
      success: false,
      message: 'Services test failed',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/services/slack/test
 * @desc    Slack servisini test et
 * @access  Public (test için)
 */
router.post('/slack/test', async (req, res) => {
  try {
    const { message = 'Test mesajı MMM Checklist sisteminden' } = req.body;

    if (!slackService.enabled) {
      return res.json({
        success: false,
        message:
          'Slack service disabled. Set SLACK_ENABLED=true and SLACK_WEBHOOK_URL in environment.',
      });
    }

    await slackService.sendMessage(message, {
      channel: '#test',
      emoji: ':test_tube:',
    });

    res.json({
      success: true,
      message: 'Slack test mesajı gönderildi',
    });
  } catch (error) {
    console.error('Slack test error:', error);
    res.status(500).json({
      success: false,
      message: 'Slack test failed',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/services/cache/test
 * @desc    Cache servisini test et
 * @access  Public (test için)
 */
router.get('/cache/test', async (req, res) => {
  try {
    const testKey = `test_${Date.now()}`;
    const testData = {
      message: 'Cache test data',
      timestamp: new Date().toISOString(),
      random: Math.random(),
    };

    // Set cache
    await cacheService.set(testKey, testData, 60);

    // Get cache
    const cachedData = await cacheService.get(testKey);

    // Delete cache
    await cacheService.del(testKey);

    // Verify deletion
    const deletedData = await cacheService.get(testKey);

    res.json({
      success: true,
      message: 'Cache test completed',
      results: {
        setOperation: 'success',
        getOperation: cachedData ? 'success' : 'failed',
        deleteOperation: !deletedData ? 'success' : 'failed',
        dataMatch: JSON.stringify(testData) === JSON.stringify(cachedData),
      },
      stats: cacheService.getStats(),
    });
  } catch (error) {
    console.error('Cache test error:', error);
    res.status(500).json({
      success: false,
      message: 'Cache test failed',
      error: error.message,
    });
  }
});

module.exports = router;
