// Ana görev yönetimi router
// Refactor edildi: 2025-02-05T23:15:00.000Z
// Orijinal tek dosya 772 satır -> 5 modüle bölündü

const express = require('express');
const router = express.Router();

// Alt modülleri import et
const tasksCore = require('./tasks-core');
const tasksControl = require('./tasks-control');
const tasksMy = require('./tasks-my');
const tasksMachines = require('./tasks-machines');

// Ana router'ları bağla
router.use('/', tasksCore); // Ana CRUD işlemleri
router.use('/', tasksControl); // Kontrol ve onay işlemleri
router.use('/', tasksMy); // Kullanıcının kendi görevleri
router.use('/', tasksMachines); // Makina entegrasyonu

module.exports = router;
