const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Simple Auth Middleware for MyActivity routes
 * Lightweight version optimized for performance
 */
const simpleAuth = async (req, res, next) => {
  try {
    // Hem Authorization hem de x-auth-token header'larını kontrol et
    const authHeader = req.header('Authorization');
    const xAuthToken = req.header('x-auth-token');

    let token = null;

    if (authHeader) {
      token = authHeader.replace('Bearer ', '');
    } else if (xAuthToken) {
      token = xAuthToken;
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Token bulunamadı, erişim reddedildi' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Basit user getir (populate olmadan - performance için)
    const user = await User.findById(decoded.user.id);

    if (!user) {
      return res.status(401).json({ message: 'Geçersiz token' });
    }

    if (user.durum !== 'aktif') {
      return res.status(401).json({ message: 'Hesap pasif durumda' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Simple Auth hatası:', error.message);
    res.status(401).json({ message: 'Geçersiz token' });
  }
};

module.exports = { simpleAuth };
