const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token doğrulama middleware'i
const auth = async (req, res, next) => {
  try {
    // Token'ı hem Authorization hem x-auth-token header'larından al
    let token = req.header('Authorization')?.replace('Bearer ', '');

    // Eğer Authorization header'ı yoksa x-auth-token'ı kontrol et
    if (!token) {
      token = req.header('x-auth-token');
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Token bulunamadı, erişim reddedildi' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Kullanıcıyı veritabanından getir (güncel rol bilgileri için)
    const user = await User.findById(decoded.user.id)
      .populate({
        path: 'roller',
        populate: {
          path: 'moduller.modul',
          model: 'Module',
        },
      })
      .populate('departmanlar');

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz token' });
    }

    if (user.durum !== 'aktif') {
      return res.status(401).json({ message: 'Hesap pasif durumda' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(401).json({ message: 'Geçersiz token' });
  }
};

// Modül yetkisi kontrolü - Modern modulePermissions yapısı ile (Array desteği)
const checkModulePermission = (moduleNames, permission = 'gorebilir') => {
  return (req, res, next) => {
    try {
      const user = req.user;

      // Admin rolü varsa tüm yetkileri ver
      const isAdmin = user.roller.some(rol => rol.ad === 'Admin');
      if (isAdmin) {
        return next();
      }

      // moduleNames'i array'e çevir (string veya array olabilir)
      const moduleNamesArray = Array.isArray(moduleNames)
        ? moduleNames
        : [moduleNames];

      // Kullanıcının rollerini kontrol et
      let hasPermission = false;

      for (const rol of user.roller) {
        // Her modül adı için kontrol et
        for (const moduleName of moduleNamesArray) {
          // Modern modulePermissions yapısını kontrol et
          if (rol.modulePermissions && Array.isArray(rol.modulePermissions)) {
            const modulePermission = rol.modulePermissions.find(
              perm => perm.moduleName === moduleName,
            );

            if (modulePermission) {
              if (permission === 'gorebilir' && modulePermission.gorebilir) {
                hasPermission = true;
                break;
              }
              if (
                permission === 'duzenleyebilir' &&
                modulePermission.duzenleyebilir
              ) {
                hasPermission = true;
                break;
              }
            }
          }

          // Eski moduller yapısını da destekle (backward compatibility)
          if (rol.moduller && Array.isArray(rol.moduller)) {
            for (const modulYetkisi of rol.moduller) {
              if (modulYetkisi.modul && modulYetkisi.modul.ad === moduleName) {
                if (permission === 'gorebilir' && modulYetkisi.erisebilir) {
                  hasPermission = true;
                  break;
                }
                if (
                  permission === 'duzenleyebilir' &&
                  modulYetkisi.duzenleyebilir
                ) {
                  hasPermission = true;
                  break;
                }
              }
            }
          }

          if (hasPermission) {
            break;
          }
        }

        if (hasPermission) {
          break;
        }
      }

      if (!hasPermission) {
        const moduleNamesStr = moduleNamesArray.join(' veya ');
        return res.status(403).json({
          message: `${moduleNamesStr} modülü için ${permission} yetkisi bulunmuyor`,
        });
      }

      next();
    } catch (error) {
      console.error('Modül yetki kontrolü hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  };
};

// Admin yetkisi kontrolü
const requireAdmin = (req, res, next) => {
  try {
    const user = req.user;
    const isAdmin = user.roller.some(rol => rol.ad === 'Admin');

    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin yetkisi gerekli' });
    }

    next();
  } catch (error) {
    console.error('Admin yetki kontrolü hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// Checklist yetki kontrolü
const checkChecklistPermission = (permission = 'gorebilir') => {
  return async (req, res, next) => {
    try {
      const taskId = req.params.id;
      if (!taskId) {
        return res.status(400).json({ message: 'Task ID gereklidir' });
      }

      const Task = require('../models/Task');
      const Role = require('../models/Role');

      const task = await Task.findById(taskId).populate({
        path: 'kullanici',
        populate: {
          path: 'roller',
          select: 'ad _id',
        },
      });

      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      if (
        !task.kullanici ||
        !task.kullanici.roller ||
        task.kullanici.roller.length === 0
      ) {
        return res
          .status(400)
          .json({ message: 'Görev sahibinin rolü bulunamadı' });
      }

      const currentUser = await User.findById(req.user._id).populate(
        'roller',
        'ad _id',
      );
      if (
        !currentUser ||
        !currentUser.roller ||
        currentUser.roller.length === 0
      ) {
        return res.status(400).json({ message: 'Kullanıcı rolü bulunamadı' });
      }

      const taskOwnerRoleIds = task.kullanici.roller.map(role =>
        role._id.toString(),
      );

      // Tüm rolleri paralel olarak kontrol et
      const roleChecks = await Promise.all(
        currentUser.roller.map(async userRole => {
          const fullRole = await Role.findById(userRole._id).populate(
            'checklistYetkileri.hedefRol',
          );

          if (!fullRole || !fullRole.checklistYetkileri) {
            return false;
          }

          return fullRole.checklistYetkileri.some(yetki => {
            if (
              !yetki.hedefRol ||
              !taskOwnerRoleIds.includes(yetki.hedefRol._id.toString())
            ) {
              return false;
            }

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

            return false;
          });
        }),
      );

      const hasPermission = roleChecks.some(Boolean);

      if (!hasPermission) {
        return res.status(403).json({
          message: `Bu görev için ${permission} yetkiniz yok`,
          taskOwnerRoles: task.kullanici.roller.map(r => r.ad),
          userRoles: currentUser.roller.map(r => r.ad),
        });
      }

      next();
    } catch {
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  };
};

module.exports = {
  auth,
  checkModulePermission,
  requireAdmin,
  checkChecklistPermission,
};
