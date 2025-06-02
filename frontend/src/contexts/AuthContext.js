import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { authAPI, tasksAPI } from '../services/api';

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

  // Makina verilerine ihtiyaç duyan roller
  const machineRelatedRoles = useMemo(
    () => ['Ortacı', 'Usta', 'Paketlemeci', 'Kalite Kontrol', 'VARDİYA AMİRİ', 'Admin'],
    [],
  );

  const needsMachineData = useCallback(
    userRoles => {
      if (!userRoles || !Array.isArray(userRoles)) {
        return false;
      }
      return userRoles.some(role => machineRelatedRoles.includes(role.ad || role));
    },
    [machineRelatedRoles],
  );

  const loadMachineData = useCallback(
    async (userRoles = null) => {
      // Kullanıcının rolü makina verilerine ihtiyaç duymuyor mu kontrol et
      if (userRoles && !needsMachineData(userRoles)) {
        setAccessibleMachines([]);
        setSelectedMachines([]);
        return;
      }

      try {
        const inventoryMachinesResponse = await tasksAPI.getInventoryMachines();
        setAccessibleMachines(inventoryMachinesResponse.data);

        const selectedResponse = await tasksAPI.getMySelectedMachines();
        setSelectedMachines(selectedResponse.data);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Makina verileri yüklenirken hata:', error);
        }
        setAccessibleMachines([]);
        setSelectedMachines([]);
      }
    },
    [needsMachineData],
  );

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);

        // Sayfa yenilendiğinde de makina verilerini yükle
        await loadMachineData(parsedUser.roller);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
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

      await tasksAPI.selectMachines(machineIds);
      setSelectedMachines(machines);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Makina seçimi güncellenemedi',
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
      return { success: false, error: error.response?.data?.message || 'Veriler yenilenemedi' };
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
            if (permission === 'duzenleyebilir' && modulYetkisi.duzenleyebilir) {
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
            if (permission === 'puanlayabilir' && (yetki.puanlayabilir || yetki.onaylayabilir)) {
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
      { text: 'Dashboard', icon: 'DashboardIcon', path: '/dashboard', module: null },
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

      // Ayırıcı
      { text: 'divider', isDivider: true },

      // Kullanıcı Sayfaları (Sıralı)
      { text: 'Görevlerim', icon: 'TaskIcon', path: '/tasks', module: 'Görev Yönetimi' },
      {
        text: 'Kontrol Bekleyenler',
        icon: 'PendingActionsIcon',
        path: '/control-pending',
        module: 'Kontrol Bekleyenler',
      },
      { text: 'Yaptım', icon: 'BuildIcon', path: '/worktasks', module: 'Yaptım' },
      { text: 'Kişisel Performansım', icon: 'AssessmentIcon', path: '/my-activity', module: null },
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
      { text: 'Performans', icon: 'BarChartIcon', path: '/performance', module: 'Performans' },
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
