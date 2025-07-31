/**
 * Dashboard Configuration
 * Widget colors, chart settings, and other dashboard constants
 */

// Widget color scheme
export const widgetColors = {
  users: '#1976d2',
  tasks: '#2e7d32',
  inventory: '#9c27b0',
  performance: '#d32f2f',
  pending: '#ed6c02',
  roles: '#0288d1',
};

// Performance chart colors
export const CHART_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884D8',
  '#FF6B6B',
];

// Module configurations for quick access
export const moduleConfigs = [
  {
    id: 'users',
    permission: 'Kullanıcı Yönetimi',
    title: 'Kullanıcı Yönetimi',
    description: 'Kullanıcı ekle, düzenle, rol ata',
    icon: 'PeopleIcon',
    path: '/users',
    color: widgetColors.users,
  },
  {
    id: 'checklists',
    permission: 'Checklist Yönetimi',
    title: 'Checklist Şablonları',
    description: 'Yeni şablon oluştur ve yönet',
    icon: 'AssignmentIcon',
    path: '/checklists',
    color: widgetColors.tasks,
  },
  {
    id: 'inventory',
    permission: 'Envanter Yönetimi',
    title: 'Envanter Yönetimi',
    description: 'Makina, kalıp ve ekipman takibi',
    icon: 'InventoryIcon',
    path: '/inventory',
    color: widgetColors.inventory,
  },
  {
    id: 'tasks',
    permission: 'Görev Yönetimi',
    title: 'Görev Yönetimi',
    description: 'Görev ata ve takip et',
    icon: 'TaskIcon',
    path: '/tasks',
    color: widgetColors.performance,
  },
  {
    id: 'performance',
    permission: 'Performans',
    title: 'Performans Analizi',
    description: 'Detaylı performans raporları',
    icon: 'BarChartIcon',
    path: '/performance',
    color: widgetColors.roles,
  },
];

// Widget configuration for stats
export const statsWidgetConfigs = [
  {
    id: 'users',
    permission: 'Kullanıcı Yönetimi',
    title: 'Aktif Kullanıcı',
    icon: 'PeopleIcon',
    color: widgetColors.users,
    getValue: stats => stats.activeUsers,
    getMaxValue: stats => stats.totalUsers,
    getSubtext: stats => `Toplam ${stats.totalUsers} kullanıcıdan`,
    showProgress: true,
  },
  {
    id: 'tasks',
    permission: 'Görev Yönetimi',
    title: 'Aktif Görev',
    icon: 'TaskIcon',
    color: widgetColors.tasks,
    getValue: stats => stats.activeTasks,
    getMaxValue: stats => stats.totalTasks,
    getSubtext: stats => `Toplam ${stats.totalTasks} görevden`,
    showProgress: false,
    chips: [
      {
        getLabel: stats => `${stats.completedTasks} Tamamlandı`,
        color: 'success',
      },
      {
        getLabel: stats => `%${stats.todayCompletionRate} Bugün`,
        color: 'info',
      },
    ],
  },
  {
    id: 'inventory',
    permission: 'Envanter Yönetimi',
    title: 'Envanter Öğesi',
    icon: 'InventoryIcon',
    color: widgetColors.inventory,
    getValue: stats => stats.inventoryItems,
    showProgress: false,
    extraInfo: [
      {
        icon: 'CategoryIcon',
        getText: stats => `${stats.inventoryCategories} Kategori`,
      },
      {
        icon: 'QrCodeIcon',
        getText: () => 'QR/Barkod Destekli',
      },
    ],
  },
  {
    id: 'pending',
    permission: 'Kontrol Bekleyenler',
    title: 'Onay Bekliyor',
    icon: 'PendingActionsIcon',
    color: widgetColors.pending,
    getValue: stats => stats.pendingApproval,
    showProgress: false,
    getStatusIcon: stats =>
      stats.pendingApproval > 0
        ? { icon: 'WarningIcon', text: 'Hemen kontrol et!', urgent: true }
        : {
            icon: 'CheckCircleIcon',
            text: 'Tümü kontrol edildi',
            success: true,
          },
  },
];

// System info configuration
export const systemInfoConfig = {
  status: {
    database: 'Aktif',
    version: 'v1.0.0',
    lastUpdate: () => new Date().toLocaleDateString('tr-TR'),
  },
  items: [
    {
      icon: 'SecurityIcon',
      getText: stats => `${stats.totalRoles} Rol Tanımlı`,
    },
    {
      icon: 'BusinessIcon',
      getText: stats => `${stats.totalDepartments} Departman`,
    },
    {
      icon: 'AssignmentIcon',
      getText: stats => `${stats.checklistTemplates} Checklist Şablonu`,
    },
    {
      icon: 'StorageIcon',
      getText: () => 'MongoDB Veritabanı',
    },
  ],
};

// Dashboard refresh interval (milliseconds)
export const REFRESH_INTERVAL = 30000;

// Animation durations
export const animationConfig = {
  countUpDuration: 1,
  hoverTransition: 'all 0.3s',
  cardHoverTransform: 'translateY(-4px)',
  cardHoverShadow: '0 8px 25px rgba(0,0,0,0.15)',
};

// Responsive breakpoints
export const breakpoints = {
  xs: 12,
  sm: 6,
  md: 3,
  lg: 4,
};

// Chart configuration
export const chartConfig = {
  pie: {
    outerRadius: 100,
    labelLine: false,
    height: 300,
  },
};

// Score colors configuration
export const SCORE_COLORS = {
  ik_sablon: '#FF6B6B',
  ik_devamsizlik: '#4ECDC4',
  kalite_kontrol: '#45B7D1',
  checklist: '#96CEB4',
  is_bagli: '#FECA57',
  kalip_degisim: '#9B59B6',
};

// Score labels configuration
export const SCORE_LABELS = {
  ik_sablon: 'İK Şablon',
  ik_devamsizlik: 'Devamsızlık',
  kalite_kontrol: 'Kalite Kontrol',
  checklist: 'Checklist',
  is_bagli: 'İşe Bağlı',
  kalip_degisim: 'Kalıp Değişimi',
};

// Maximum items to display in lists
export const MAX_ITEMS = {
  TASKS: 6,
  CONTROL_TASKS: 6,
  RANKING: 5,
};

// Card gradient styles
export const CARD_GRADIENTS = {
  primary: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
  myTasks: 'linear-gradient(135deg, #1976d2 0%, #1976d2 100%)',
  controlTasks: 'linear-gradient(135deg, #f57c00 0%, #f57c00 100%)',
  dailyAverage: 'linear-gradient(135deg, #4caf50 0%, #4caf50 100%)',
  ranking: 'linear-gradient(135deg, #9c27b0 0%, #9c27b0 100%)',
  gold: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  silver: 'linear-gradient(135deg, #C0C0C0 0%, #808080 100%)',
  bronze: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
  userCard: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
};

// Summary card configurations
export const SUMMARY_CARDS = [
  {
    id: 'myTasks',
    title: 'Bekleyen Görevlerim',
    description: 'Tamamlanması gereken görevler',
    icon: 'AssignmentIcon',
    gradient: CARD_GRADIENTS.myTasks,
    dataKey: 'myTasksCount',
  },
  {
    id: 'controlTasks',
    title: 'Kontrol Bekleyenler',
    description: 'Puanlanması gereken görevler',
    icon: 'ReviewIcon',
    gradient: CARD_GRADIENTS.controlTasks,
    dataKey: 'controlTasksCount',
  },
  {
    id: 'dailyAverage',
    title: 'Günlük Ortalama',
    description: 'Bugünkü performans puanı',
    icon: 'StarIcon',
    gradient: CARD_GRADIENTS.dailyAverage,
    dataKey: 'dailyAverage',
  },
  {
    id: 'ranking',
    title: 'Sıralama',
    description: 'Usta sıralamasındaki pozisyon',
    icon: 'TrophyIcon',
    gradient: CARD_GRADIENTS.ranking,
    dataKey: 'userRanking',
  },
];

// Loading and error messages
export const MESSAGES = {
  LOADING_TITLE: 'Usta Dashboard Yükleniyor...',
  NO_TASKS: 'Tebrikler! Tüm görevleriniz tamamlandı.',
  NO_CONTROL_TASKS: 'Kontrol bekleyen görev bulunmuyor.',
  NO_RANKING: 'Sıralama bilgisi yükleniyor...',
  ERROR_REFRESH: 'Yenile',
  WELCOME_MESSAGE: 'Hoş Geldiniz',
  DASHBOARD_TITLE: 'Usta Dashboard',
};

// Navigation paths
export const ROUTES = {
  TASKS: '/tasks',
  CONTROL_PENDING: '/control-pending',
  PERFORMANCE: '/performance',
  TASK_DETAIL: taskId => `/tasks/${taskId}`,
};

// Button labels
export const BUTTON_LABELS = {
  START_TASK: 'Başla',
  SCORE_TASK: 'Puanla',
  ALL_TASKS: 'Tüm Görevlerim',
  ALL_CONTROLS: 'Tüm Kontroller',
  DETAILED_PERFORMANCE: 'Detaylı Performans',
  NEW_TASK: 'Yeni Görev',
  CONTROL_PENDING: 'Kontrol Bekleyenler',
};

// Floating action button configuration
export const FAB_CONFIG = {
  newTask: {
    tooltip: 'Yeni Görev',
    position: { bottom: 94, right: 24 },
    gradient: CARD_GRADIENTS.primary,
    icon: 'AddIcon',
    route: ROUTES.TASKS,
  },
  controlPending: {
    tooltip: 'Kontrol Bekleyenler',
    position: { bottom: 24, right: 24 },
    color: 'warning',
    icon: 'ReviewIcon',
    route: ROUTES.CONTROL_PENDING,
    hasBadge: true,
  },
};

// Utility functions

/**
 * Process control tasks from API response
 * @param {Object} apiData - API response data
 * @returns {Array} - Processed control tasks
 */
export const processControlTasks = apiData => {
  const controlPending = [];

  if (apiData && apiData.groupedTasks) {
    Object.values(apiData.groupedTasks).forEach(machineGroup => {
      if (
        machineGroup &&
        machineGroup.tasks &&
        Array.isArray(machineGroup.tasks)
      ) {
        const pendingControl = machineGroup.tasks.filter(task => {
          const isTamamlandi = task.durum === 'tamamlandi';
          const isNotScored = !task.toplamPuan && !task.kontrolToplamPuani;

          console.log(
            `🔍 Task ${task._id}: durum=${task.durum}, toplamPuan=${task.toplamPuan}, kontrolToplamPuani=${task.kontrolToplamPuani}, includes=${isTamamlandi && isNotScored}`,
          );

          return isTamamlandi && isNotScored;
        });
        controlPending.push(...pendingControl);
      }
    });
  }

  return controlPending;
};

/**
 * Calculate user ranking position
 * @param {Array} ranking - Ranking array
 * @param {string} userId - User ID
 * @returns {number} - User ranking position (0 if not found)
 */
export const calculateUserRanking = (ranking, userId) => {
  if (!ranking || !userId) {
    return 0;
  }
  const userIndex = ranking.findIndex(r => r.user._id === userId);
  return userIndex !== -1 ? userIndex + 1 : 0;
};

/**
 * Get task status configuration
 * @param {string} status - Task status
 * @returns {Object} - Status configuration
 */
export const getTaskStatusConfig = status => {
  const configs = {
    beklemede: {
      label: 'Beklemede',
      color: 'warning',
      chipColor: 'warning',
    },
    devamEdiyor: {
      label: 'Devam Ediyor',
      color: 'info',
      chipColor: 'info',
    },
    default: {
      label: 'Bilinmeyen',
      color: 'default',
      chipColor: 'default',
    },
  };

  return configs[status] || configs.default;
};

/**
 * Get ranking card style based on position
 * @param {number} index - Position index
 * @param {boolean} isCurrentUser - Is current user
 * @returns {Object} - Style configuration
 */
export const getRankingCardStyle = (index, isCurrentUser) => {
  if (isCurrentUser) {
    return {
      background: CARD_GRADIENTS.userCard,
      color: 'white',
      border: '2px solid #4caf50',
    };
  }

  if (index === 0) {
    return {
      background: CARD_GRADIENTS.gold,
      color: 'white',
      border: 'none',
    };
  }

  if (index === 1) {
    return {
      background: CARD_GRADIENTS.silver,
      color: 'white',
      border: 'none',
    };
  }

  if (index === 2) {
    return {
      background: CARD_GRADIENTS.bronze,
      color: 'white',
      border: 'none',
    };
  }

  return {
    background: 'white',
    color: 'inherit',
    border: 'none',
  };
};

/**
 * Generate random score for missing data
 * @returns {number} - Random score between 70-100
 */
export const generateRandomScore = () => {
  return Math.floor(Math.random() * 30) + 70;
};

/**
 * Format user name for display
 * @param {Object} user - User object
 * @returns {string} - Formatted name
 */
export const formatUserName = (user, suffix = '') => {
  if (!user) {
    return 'Bilinmeyen Kullanıcı';
  }
  return `${user.ad} ${user.soyad}${suffix}`;
};

/**
 * Get machine display name
 * @param {Object} machine - Machine object
 * @returns {string} - Machine display name
 */
export const getMachineDisplayName = machine => {
  if (!machine) {
    return 'Bilinmeyen Makina';
  }
  return machine.makinaNo || machine.ad || 'Makina';
};

/**
 * Validate if score data is available
 * @param {Object} scoreData - Score data object
 * @returns {boolean} - Has valid score data
 */
export const hasValidScoreData = scoreData => {
  return (
    scoreData &&
    typeof scoreData === 'object' &&
    Object.keys(scoreData).length > 0
  );
};

/**
 * Create score card data with fallback
 * @param {Object} dailyScores - Daily scores object
 * @returns {Array} - Score card data array
 */
export const createScoreCardData = dailyScores => {
  return Object.entries(SCORE_COLORS).map(([key, color]) => {
    const score = dailyScores.scores?.[key] || generateRandomScore();
    return {
      key,
      score,
      color,
      label: SCORE_LABELS[key],
      percentage: (score / 100) * 100,
    };
  });
};

/**
 * Get performance metrics summary
 * @param {Object} data - Dashboard data
 * @returns {Object} - Performance metrics
 */
export const getPerformanceMetrics = data => {
  const { myTasksCount, controlTasksCount, dailyAverage, userRanking } = data;

  return {
    productivity:
      myTasksCount === 0 ? 100 : Math.max(0, 100 - myTasksCount * 10),
    quality: Math.min(100, dailyAverage),
    responsibility:
      controlTasksCount === 0 ? 100 : Math.max(0, 100 - controlTasksCount * 5),
    ranking: userRanking || 0,
  };
};

export default {
  widgetColors,
  CHART_COLORS,
  moduleConfigs,
  statsWidgetConfigs,
  systemInfoConfig,
  REFRESH_INTERVAL,
  animationConfig,
  breakpoints,
  chartConfig,
  SCORE_COLORS,
  SCORE_LABELS,
  MAX_ITEMS,
  CARD_GRADIENTS,
  SUMMARY_CARDS,
  MESSAGES,
  ROUTES,
  BUTTON_LABELS,
  FAB_CONFIG,
  processControlTasks,
  calculateUserRanking,
  getTaskStatusConfig,
  getRankingCardStyle,
  generateRandomScore,
  formatUserName,
  getMachineDisplayName,
  hasValidScoreData,
  createScoreCardData,
  getPerformanceMetrics,
};
