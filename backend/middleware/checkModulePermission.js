const checkModulePermission = (moduleNames, permission = 'erisebilir') => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res
          .status(401)
          .json({ message: 'Kullanıcı doğrulaması gerekli' });
      }

      // Admin rolü varsa tüm yetkileri ver
      const isAdmin =
        user.roller && user.roller.some(rol => rol.ad === 'Admin');
      if (isAdmin) {
        return next();
      }

      // moduleNames'i array'e dönüştür (string ise)
      const moduleArray = Array.isArray(moduleNames)
        ? moduleNames
        : [moduleNames];

      // Kullanıcının rollerini kontrol et
      let hasPermission = false;

      if (user.roller) {
        for (const rol of user.roller) {
          if (rol.moduller) {
            for (const modulYetkisi of rol.moduller) {
              if (modulYetkisi.modul) {
                // Her modül adı için kontrol et
                for (const moduleName of moduleArray) {
                  if (modulYetkisi.modul.ad === moduleName) {
                    if (
                      permission === 'erisebilir' &&
                      modulYetkisi.erisebilir
                    ) {
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
          }
          if (hasPermission) {
            break;
          }
        }
      }

      if (!hasPermission) {
        const moduleNamesText = Array.isArray(moduleNames)
          ? moduleNames.join(' veya ')
          : moduleNames;
        return res.status(403).json({
          message: `${moduleNamesText} modülü için ${permission} yetkisi bulunmuyor`,
        });
      }

      next();
    } catch (error) {
      console.error('Yetki kontrolü hatası:', error);
      res.status(500).json({ message: 'Yetki kontrolü sırasında hata oluştu' });
    }
  };
};

module.exports = { checkModulePermission };
