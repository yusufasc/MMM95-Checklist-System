import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { authAPI, tasksAPI, inventoryAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [accessibleMachines, setAccessibleMachines] = useState([]);
  const [currentShift, setCurrentShift] = useState(null);

  // Makina verilerine ihtiyaç duyan roller
  const machineRelatedRoles = useMemo(
    () => [
      'Ortacı',
      'Usta',
      'Paketlemeci',
      'Kalite Kontrol',
      'VARDİYA AMİRİ',
      'Admin',
    ],
    [],
  );

  const needsMachineData = useCallback(
    userRoles => {
      if (!userRoles || !Array.isArray(userRoles)) {
        return false;
      }
      return userRoles.some(role =>
        machineRelatedRoles.includes(role.ad || role),
      );
    },
    [machineRelatedRoles],
  );

  const loadMachineData = useCallback(
    async (userRoles = null) => {
      // Kullanıcının rolü makina verilerine ihtiyaç duymuyor mu kontrol et
      if (userRoles && !needsMachineData(userRoles)) {
        setAccessibleMachines([]);
        setSelectedMachines([]);
        setCurrentShift(null);
        return;
      }

      try {
        const inventoryMachinesResponse = await inventoryAPI.getMachines('all');
        setAccessibleMachines(inventoryMachinesResponse.data);

        const selectedResponse = await tasksAPI.getMySelectedMachines();

        // Vardiya bilgisi dahil mi kontrol et
        if (selectedResponse.data && selectedResponse.data.machines) {
          // Yeni format: machines ve shift bilgisi ayrı
          setSelectedMachines(selectedResponse.data.machines);
          setCurrentShift(selectedResponse.data.shift);
        } else {
          // Eski format: sadece makina listesi
          setSelectedMachines(selectedResponse.data);
          setCurrentShift(null);
        }

        // Aktif vardiya bilgisini ayrıca getir
        try {
          const shiftResponse = await tasksAPI.getCurrentShift();
          if (shiftResponse.data.hasActiveShift) {
            setCurrentShift(shiftResponse.data.shift);
          }
        } catch (error) {
          // Vardiya bilgisi getirilemezse sessizce devam et
          console.warn('Vardiya bilgisi getirilemedi:', error.message);
        }
      } catch (error) {
        if (
          typeof process !== 'undefined' &&
          process.env?.NODE_ENV === 'development'
        ) {
          console.error('Makina verileri yüklenirken hata:', error);
        }
        setAccessibleMachines([]);
        setSelectedMachines([]);
        setCurrentShift(null);
      }
    },
    [needsMachineData],
  );

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      // Token'ı backend'de doğrula
      try {
        const response = await authAPI.getMe();
        const userData = response.data;

        // Güncel kullanıcı verisini kaydet
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);

        // Sayfa yenilendiğinde de makina verilerini yükle
        await loadMachineData(userData.roller);
      } catch (error) {
        // Token geçersiz veya süresi dolmuş
        console.error('Token doğrulama hatası:', error);
        logout();
      }
    } catch (error) {
      if (
        typeof process !== 'undefined' &&
        process.env?.NODE_ENV === 'development'
      ) {
        console.error('Auth check hatası:', error);
      }
      logout();
    } finally {
      setLoading(false);
    }
  }, [loadMachineData]);

  const updateSelectedMachines = async machines => {
    try {
      const machineIds = machines.map(m => m._id);

      const response = await tasksAPI.selectMachines(machineIds);
      setSelectedMachines(machines);

      // Vardiya bilgisi varsa güncelle
      if (response.data.shift) {
        setCurrentShift(response.data.shift);
      }

      return {
        success: true,
        message: response.data.message,
        shift: response.data.shift,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Makina seçimi güncellenemedi',
      };
    }
  };

  const endCurrentShift = async () => {
    try {
      await tasksAPI.endShift();
      setCurrentShift(null);
      setSelectedMachines([]);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Vardiya sonlandırılamadı',
      };
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async credentials => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      // Kullanıcının rollerine göre makina verilerini yükle
      await loadMachineData(userData.roller);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Giriş yapılırken hata oluştu',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setSelectedMachines([]);
    setAccessibleMachines([]);
  };

  const refreshUserData = async () => {
    try {
      const response = await authAPI.getMe();
      const userData = response.data;

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Veriler yenilenemedi',
      };
    }
  };

  const hasModulePermission = (moduleName, permission = 'erisebilir') => {
    if (!user || !user.roller) {
      return false;
    }

    const isAdmin = user.roller.some(rol => rol.ad === 'Admin');
    if (isAdmin) {
      return true;
    }

    for (const rol of user.roller) {
      if (rol.moduller) {
        for (const modulYetkisi of rol.moduller) {
          if (modulYetkisi.modul && modulYetkisi.modul.ad === moduleName) {
            if (permission === 'erisebilir' && modulYetkisi.erisebilir) {
              return true;
            }
            if (
              permission === 'duzenleyebilir' &&
              modulYetkisi.duzenleyebilir
            ) {
              return true;
            }
          }
        }
      }
    }

    return false;
  };

  const isAdmin = () => {
    if (!user || !user.roller) {
      return false;
    }
    return user.roller.some(rol => rol.ad === 'Admin');
  };

  const hasChecklistPermission = (targetRoleName, permission = 'gorebilir') => {
    if (!user || !user.roller) {
      return false;
    }

    if (isAdmin()) {
      return true;
    }

    for (const rol of user.roller) {
      if (rol.checklistYetkileri) {
        for (const yetki of rol.checklistYetkileri) {
          if (yetki.hedefRol && yetki.hedefRol.ad === targetRoleName) {
            if (permission === 'gorebilir' && yetki.gorebilir) {
              return true;
            }
            if (
              permission === 'puanlayabilir' &&
              (yetki.puanlayabilir || yetki.onaylayabilir)
            ) {
              return true;
            }
            if (permission === 'onaylayabilir' && yetki.onaylayabilir) {
              return true;
            }
          }
        }
      }
    }

    return false;
  };

  const getAccessibleMenuItems = () => {
    const allMenuItems = [
      // Admin Sayfaları (Üstte)
      {
        text: 'Dashboard',
        icon: 'DashboardIcon',
        path: '/dashboard',
        module: null,
      },
      {
        text: 'Kullanıcılar',
        icon: 'PeopleIcon',
        path: '/users',
        module: 'Kullanıcı Yönetimi',
        adminOnly: true,
      },
      {
        text: 'Roller',
        icon: 'SecurityIcon',
        path: '/roles',
        module: 'Rol Yönetimi',
        adminOnly: true,
      },
      {
        text: 'Departmanlar',
        icon: 'BusinessIcon',
        path: '/departments',
        module: 'Departman Yönetimi',
        adminOnly: true,
      },
      {
        text: 'Checklist Şablonları',
        icon: 'AssignmentIcon',
        path: '/checklists',
        module: 'Checklist Yönetimi',
        adminOnly: true,
      },
      {
        text: 'Envanter Yönetimi',
        icon: 'InventoryIcon',
        path: '/inventory',
        module: 'Envanter Yönetimi',
        adminOnly: true,
      },
      {
        text: 'Kalite Kontrol Yönetimi',
        icon: 'AdminPanelSettingsIcon',
        path: '/quality-control-management',
        module: 'Kalite Kontrol Yönetimi',
        adminOnly: true,
      },
      {
        text: 'İK Yönetimi',
        icon: 'AdminPanelSettingsIcon',
        path: '/hr-management',
        module: 'İnsan Kaynakları Yönetimi',
        adminOnly: true,
      },
      {
        text: 'Bonus Yönetimi',
        icon: 'StarIcon',
        path: '/bonus-evaluation-management',
        module: 'Bonus Değerlendirme Yönetimi',
        adminOnly: true,
      },
      {
        text: 'Ekipman Yönetimi',
        icon: 'InventoryIcon',
        path: '/equipment-management',
        module: 'Ekipman Yönetimi',
        adminOnly: true,
      },

      // Ayırıcı
      { text: 'divider', isDivider: true },

      // Kullanıcı Sayfaları (Sıralı)
      {
        text: 'Görevlerim',
        icon: 'TaskIcon',
        path: '/tasks',
        module: 'Görev Yönetimi',
      },
      {
        text: 'Kontrol Bekleyenler',
        icon: 'PendingActionsIcon',
        path: '/control-pending',
        module: 'Kontrol Bekleyenler',
      },
      {
        text: 'Yaptım Kontrol',
        icon: 'BuildIcon',
        path: '/worktask-control',
        module: 'Kontrol Bekleyenler',
      },
      {
        text: 'Yaptım',
        icon: 'BuildIcon',
        path: '/worktasks',
        module: 'Yaptım',
      },
      {
        text: 'Kişisel Performansım',
        icon: 'AssessmentIcon',
        path: '/my-activity',
        module: null,
      },
      {
        text: 'Profilim',
        icon: 'PersonIcon',
        path: '/profile',
        module: null,
      },
      {
        text: 'Kalite Kontrol',
        icon: 'EngineeringIcon',
        path: '/quality-control',
        module: 'Kalite Kontrol',
      },
      {
        text: 'İnsan Kaynakları',
        icon: 'PeopleIcon',
        path: '/hr',
        module: 'İnsan Kaynakları',
        checkCustomAccess: true,
      },
      {
        text: 'Performans',
        icon: 'BarChartIcon',
        path: '/performance',
        module: 'Performans',
      },
      {
        text: 'Personel Takip',
        icon: 'EngineeringIcon',
        path: '/personnel-tracking',
        module: 'Personel Takip',
      },
      {
        text: 'Bonus Değerlendirme',
        icon: 'StarIcon',
        path: '/bonus-evaluation',
        module: 'Bonus Değerlendirme',
      },
    ];

    return allMenuItems.filter(item => {
      if (!item.module) {
        return true;
      }

      // Admin only sayfalar için özel kontrol
      if (item.adminOnly && !isAdmin()) {
        return false;
      }

      return hasModulePermission(item.module);
    });
  };

  const value = {
    user,
    isAuthenticated,
    isLoggedIn: isAuthenticated,
    loading,
    selectedMachines,
    accessibleMachines,
    login,
    logout,
    hasModulePermission,
    hasChecklistPermission,
    isAdmin,
    getAccessibleMenuItems,
    updateSelectedMachines,
    loadMachineData,
    refreshUserData,
    currentShift,
    endCurrentShift,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
