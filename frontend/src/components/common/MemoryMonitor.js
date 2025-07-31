import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Memory as MemoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const MemoryMonitor = ({ enabled = true, alertThreshold = 80 }) => {
  const [memoryStats, setMemoryStats] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!enabled || !performance.memory) {
      return undefined;
    }

    const checkMemory = () => {
      const memory = performance.memory;
      const stats = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      };

      // Memory percentage hesaplama
      const usedPercentage = (stats.used / stats.limit) * 100;
      stats.usedPercentage = usedPercentage;

      // Format for display
      stats.usedMB = (stats.used / 1024 / 1024).toFixed(2);
      stats.totalMB = (stats.total / 1024 / 1024).toFixed(2);
      stats.limitMB = (stats.limit / 1024 / 1024).toFixed(2);

      setMemoryStats(stats);

      // Alert kontrolü
      if (usedPercentage > alertThreshold) {
        const alertMessage = `⚠️ High memory usage: ${usedPercentage.toFixed(1)}%`;
        console.warn(alertMessage, stats);

        setAlerts(prev => {
          const newAlert = {
            id: Date.now(),
            message: alertMessage,
            percentage: usedPercentage,
            timestamp: new Date().toLocaleTimeString(),
          };
          return [newAlert, ...prev.slice(0, 4)]; // Keep last 5 alerts
        });
      }

      // Critical memory durumu
      if (usedPercentage > 90) {
        console.error('🚨 CRITICAL: Memory usage over 90%', stats);

        // Garbage collection tetikleme (Chrome DevTools)
        if (window.gc && typeof window.gc === 'function') {
          try {
            window.gc();
            console.log('🗑️ Forced garbage collection triggered');
          } catch (e) {
            console.warn('Could not trigger garbage collection:', e);
          }
        }
      }
    };

    // İlk kontrol
    checkMemory();

    // 5 saniyede bir kontrol
    const interval = setInterval(checkMemory, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, alertThreshold]);

  if (!enabled || !performance.memory || !memoryStats) {
    return null;
  }

  const getMemoryColor = percentage => {
    if (percentage > 90) {
      return 'error';
    }
    if (percentage > alertThreshold) {
      return 'warning';
    }
    return 'success';
  };

  const isDevelopment =
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        width: 280,
        zIndex: 9999,
        opacity: isDevelopment ? 0.95 : 0.8,
        '&:hover': { opacity: 1 },
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          bgcolor:
            getMemoryColor(memoryStats.usedPercentage) === 'error'
              ? 'error.light'
              : getMemoryColor(memoryStats.usedPercentage) === 'warning'
                ? 'warning.light'
                : 'success.light',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <MemoryIcon sx={{ mr: 1, fontSize: 20 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant='body2' fontWeight='bold'>
            Memory: {memoryStats.usedMB} MB
          </Typography>
          <LinearProgress
            variant='determinate'
            value={memoryStats.usedPercentage}
            color={getMemoryColor(memoryStats.usedPercentage)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
        <Chip
          label={`${memoryStats.usedPercentage.toFixed(1)}%`}
          size='small'
          color={getMemoryColor(memoryStats.usedPercentage)}
        />
        <IconButton size='small'>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2, pt: 0 }}>
          <Typography variant='caption' color='text.secondary' gutterBottom>
            Memory Details:
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant='body2'>
              Used: {memoryStats.usedMB} MB
            </Typography>
            <Typography variant='body2'>
              Total: {memoryStats.totalMB} MB
            </Typography>
            <Typography variant='body2'>
              Limit: {memoryStats.limitMB} MB
            </Typography>
          </Box>

          {alerts.length > 0 && (
            <Box>
              <Typography variant='caption' color='error' gutterBottom>
                Recent Alerts:
              </Typography>
              {alerts.slice(0, 3).map(alert => (
                <Alert key={alert.id} severity='warning' sx={{ mb: 1, py: 0 }}>
                  <Typography variant='caption'>
                    {alert.timestamp}: {alert.percentage.toFixed(1)}%
                  </Typography>
                </Alert>
              ))}
            </Box>
          )}

          <Typography variant='caption' color='text.secondary'>
            Updates every 5 seconds
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default MemoryMonitor;
