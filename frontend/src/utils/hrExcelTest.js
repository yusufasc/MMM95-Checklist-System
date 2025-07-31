// HR Excel Download Test Utility
// Bu dosya HR Excel download endpoint'ini test etmek için kullanılır

import { hrAPI } from '../services/api';

export const testHRExcelDownload = async () => {
  console.log('🧪 HR Excel Download Test Starting...');

  try {
    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No auth token found in localStorage');
      return {
        success: false,
        error: 'No authentication token found. Please login first.',
      };
    }

    console.log('✅ Auth token found');

    // API çağrısı
    console.log('📤 Making API request to /api/hr/excel/download...');
    const startTime = performance.now();

    const response = await hrAPI.downloadExcel();

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    console.log('✅ API request successful:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers['content-type'],
      contentLength: response.headers['content-length'],
      duration: `${duration}ms`,
    });

    // Blob validation
    if (!response.data) {
      throw new Error('No data received from server');
    }

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    console.log('📊 Blob created:', {
      size: `${Math.round(blob.size / 1024)} KB`,
      type: blob.type,
    });

    return {
      success: true,
      data: {
        blob,
        response,
        duration,
        size: blob.size,
      },
    };
  } catch (error) {
    console.error('❌ HR Excel Download Test Failed:', error);

    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    };

    console.error('🔍 Error Details:', errorDetails);

    let userFriendlyMessage = 'Excel download test failed';

    switch (error.response?.status) {
      case 401:
        userFriendlyMessage = 'Authentication failed. Please login again.';
        break;
      case 403:
        userFriendlyMessage = 'Permission denied. You need HR module access.';
        break;
      case 404:
        userFriendlyMessage = 'Excel download endpoint not found (404).';
        break;
      case 500:
        userFriendlyMessage = 'Server error occurred while generating Excel.';
        break;
      default:
        userFriendlyMessage = error.response?.data?.message || error.message;
    }

    return {
      success: false,
      error: userFriendlyMessage,
      details: errorDetails,
    };
  }
};

// Browser console'dan test etmek için
window.testHRExcel = testHRExcelDownload;
