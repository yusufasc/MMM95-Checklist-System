const checkModulePermission = (moduleName, permission = 'erisebilir') => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: 'Kullanıcı doğrulaması gerekli' });
      }

      // Admin rolü varsa tüm yetkileri ver
      const isAdmin = user.roller && user.roller.some(rol => rol.ad === 'Admin');
      if (isAdmin) {
        return next();
      }

      // Kullanıcının rollerini kontrol et
      let hasPermission = false;

      if (user.roller) {
        for (const rol of user.roller) {
          if (rol.moduller) {
            for (const modulYetkisi of rol.moduller) {
              if (modulYetkisi.modul && modulYetkisi.modul.ad === moduleName) {
                if (permission === 'erisebilir' && modulYetkisi.erisebilir) {
                  hasPermission = true;
                  break;
                }
                if (permission === 'duzenleyebilir' && modulYetkisi.duzenleyebilir) {
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
      }

      if (!hasPermission) {
        return res.status(403).json({
          message: `${moduleName} modülü için ${permission} yetkisi bulunmuyor`,
        });
      }

      next();
    } catch (error) {
      console.error('Yetki kontrolü hatası:', error);
      res.status(500).json({ message: 'Yetki kontrolü sırasında hata oluştu' });
    }
  };
};

module.exports = checkModulePermission;
