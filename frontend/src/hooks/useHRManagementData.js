import { useState, useCallback } from 'react';
import { hrManagementAPI } from '../services/api';

export const useHRManagementData = () => {
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, settingsRes, rolesRes, usersRes] = await Promise.all(
        [
          hrManagementAPI.getTemplates(),
          hrManagementAPI.getSettings(),
          hrManagementAPI.getRoles(),
          hrManagementAPI.getUsers(),
        ],
      );

      setTemplates(templatesRes.data);
      setSettings(settingsRes.data);
      setRoles(rolesRes.data);
      setUsers(usersRes.data);

      return true;
    } catch (error) {
      console.error('HR Management data loading error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Template CRUD operations
  const createTemplate = useCallback(
    async templateData => {
      try {
        await hrManagementAPI.createTemplate(templateData);
        await loadData();
        return { success: true, message: 'Şablon oluşturuldu' };
      } catch (error) {
        return { success: false, message: 'İşlem başarısız' };
      }
    },
    [loadData],
  );

  const updateTemplate = useCallback(
    async (id, templateData) => {
      try {
        await hrManagementAPI.updateTemplate(id, templateData);
        await loadData();
        return { success: true, message: 'Şablon güncellendi' };
      } catch (error) {
        return { success: false, message: 'İşlem başarısız' };
      }
    },
    [loadData],
  );

  const deleteTemplate = useCallback(
    async id => {
      try {
        await hrManagementAPI.deleteTemplate(id);
        await loadData();
        return { success: true, message: 'Şablon silindi' };
      } catch (error) {
        return { success: false, message: 'Silme işlemi başarısız' };
      }
    },
    [loadData],
  );

  // Settings operations
  const updateSettings = useCallback(
    async settingsData => {
      try {
        await hrManagementAPI.updateSettings(settingsData);
        await loadData();
        return { success: true, message: 'Ayarlar güncellendi' };
      } catch (error) {
        return { success: false, message: 'Ayarlar güncellenemedi' };
      }
    },
    [loadData],
  );

  // Permissions operations
  const updateRolePermissions = useCallback(
    async (roleId, permissions) => {
      try {
        console.log('🔧 Frontend: Updating role permissions:', {
          roleId,
          permissions,
        });

        const response = await hrManagementAPI.updateRolePermissions(
          roleId,
          permissions,
        );

        console.log('📤 Frontend: API Response:', response.data);

        await loadData();
        return { success: true, message: 'Yetkiler güncellendi' };
      } catch (error) {
        console.error('❌ Frontend: Role permissions update error:', error);
        return { success: false, message: 'Yetkiler güncellenemedi' };
      }
    },
    [loadData],
  );

  const toggleModuleAccess = useCallback(
    async (item, type) => {
      try {
        await hrManagementAPI.toggleModuleAccess(item, type);
        await loadData();
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    },
    [loadData],
  );

  return {
    // State
    templates,
    settings,
    roles,
    users,
    loading,

    // Actions
    loadData,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateSettings,
    updateRolePermissions,
    toggleModuleAccess,
  };
};
