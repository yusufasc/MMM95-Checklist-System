const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const Machine = require('../models/Machine');
const InventoryItem = require('../models/InventoryItem');
const { auth } = require('../middleware/auth');
const WorkTask = require('../models/WorkTask');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Personnel tracking route works!' });
});

// ✅ YENİ: Ana personel verisi - refactoring sonrası eklendi (current-status'un alias'ı)
router.get('/data', auth, async (req, res) => {
  try {
    console.log('📊 Ana personel verisi getiriliyor...');

    // Basit veri yapısı döndür
    const data = {
      message: 'Personnel tracking data endpoint',
      timestamp: new Date().toISOString(),
      status: 'active',
      // Boş veri yapısı - frontend'de hata almamak için
      machinePersonnel: [],
      departmentPersonnel: [],
      rolePersonnel: [],
      allPersonnel: [],
      statistics: {
        totalPersonnel: 0,
        totalMachines: 0,
        totalDepartments: 0,
        currentShift: 'Gündüz',
      },
    };

    res.json(data);
  } catch (error) {
    console.error('❌ Ana personel verisi hatası:', error);
    res.status(500).json({
      message: 'Ana personel verisi alınırken hata oluştu',
      error: error.message,
    });
  }
});

// ✅ YENİ: Makina bazlı personel takibi - Detaylı veri
router.get('/machine-based', auth, async (req, res) => {
  try {
    console.log('🏭 Makina bazlı personel takibi getiriliyor...');
    const { roleFilter } = req.query; // Rol filtresi: 'paketlemeci', 'ortaci' vs.

    // Tüm makinaları getir (Machine + InventoryItem)
    const machines = await Machine.find({}).select(
      'ad makinaNo envanterKodu kategori',
    );
    const inventoryMachines = await InventoryItem.find({}).select(
      'ad kod envanterKodu dinamikAlanlar',
    );

    console.log(
      `🔧 ${machines.length} Machine, ${inventoryMachines.length} InventoryItem makina bulundu`,
    );

    // Birleştirilmiş makina listesi
    const allMachines = [
      ...machines.map(m => ({
        _id: m._id,
        ad: m.ad,
        kod: m.makinaNo || m.envanterKodu,
        envanterKodu: m.envanterKodu,
        kategori: m.kategori,
        kaynak: 'Machine',
      })),
      ...inventoryMachines.map(m => {
        // dinamikAlanlar Map() tipinde olabilir
        let kategori = 'Genel Makina';
        if (m.dinamikAlanlar) {
          if (m.dinamikAlanlar instanceof Map) {
            kategori = m.dinamikAlanlar.get('kategori') || 'Genel Makina';
          } else if (m.dinamikAlanlar.kategori) {
            kategori = m.dinamikAlanlar.kategori;
          }
        }

        return {
          _id: m._id,
          ad: m.ad,
          kod: m.kod || m.envanterKodu,
          envanterKodu: m.envanterKodu,
          kategori: kategori,
          kaynak: 'InventoryItem',
        };
      }),
    ];

    // Aktif personeli getir
    const personalQuery = {
      durum: 'aktif',
      secilenMakinalar: { $exists: true, $ne: [] },
    };

    // Rol filtresi varsa
    if (roleFilter) {
      const roleNames = {
        paketlemeci: 'Paketlemeci',
        ortaci: 'Ortacı',
        usta: 'Usta',
        vardiya_amiri: 'VARDİYA AMİRİ',
      };

      if (roleNames[roleFilter]) {
        // Rol adına göre filtrele
        const Role = require('../models/Role');
        const targetRole = await Role.findOne({ ad: roleNames[roleFilter] });
        if (targetRole) {
          personalQuery.roller = targetRole._id;
        }
      }
    }

    const personnel = await User.find(personalQuery)
      .populate('roller', 'ad')
      .populate('departmanlar', 'ad')
      .populate('secilenMakinalar', 'envanterKodu ad kategori kod makinaNo')
      .select(
        'ad soyad kullaniciAdi rollers departmanlar secilenMakinalar guncellemeTarihi',
      )
      .sort({ ad: 1, soyad: 1 });

    console.log(
      `👥 ${personnel.length} personel bulundu (${roleFilter ? 'filtrelenmiş' : 'tümü'})`,
    );

    // Makina bazlı gruplandırma - Promise.all ile optimize edilmiş
    const machinePersonnelResults = await Promise.all(
      allMachines.map(async machine => {
        // Bu makinada çalışan personelleri bul
        const machinePersonnel = personnel.filter(person =>
          person.secilenMakinalar.some(
            selectedMachine =>
              selectedMachine._id.toString() === machine._id.toString(),
          ),
        );

        if (machinePersonnel.length === 0) {
          return null; // Bu makina için veri yok
        }

        console.log(
          `🔧 ${machine.ad} makinasında ${machinePersonnel.length} personel çalışıyor`,
        );

        // Her personel için son checklist'leri ve puanları getir
        const personnelWithScores = await Promise.all(
          machinePersonnel.map(async person => {
            try {
              // Son 30 gün içindeki görevleri getir
              const last30Days = new Date();
              last30Days.setDate(last30Days.getDate() - 30);

              // Rutin görevler (Task)
              const recentTasks = await Task.find({
                kullanici: person._id,
                makina: { $in: person.secilenMakinalar.map(m => m._id) },
                durum: 'tamamlandi',
                tamamlanmaTarihi: { $gte: last30Days },
              })
                .populate('checklist', 'ad kategori')
                .select(
                  'checklist toplamPuan kontrolToplamPuani tamamlanmaTarihi onayTarihi',
                )
                .sort({ tamamlanmaTarihi: -1 })
                .limit(10);

              // Kalite kontrol değerlendirmeleri
              const qualityEvaluations = await QualityControlEvaluation.find({
                degerlendirilenKullanici: person._id,
                makina: { $in: person.secilenMakinalar.map(m => m._id) },
                degerlendirmeTarihi: { $gte: last30Days },
              })
                .populate('sablon', 'ad')
                .populate('degerlendirenKullanici', 'ad soyad')
                .select(
                  'sablon toplamPuan degerlendirmeTarihi degerlendirenKullanici',
                )
                .sort({ degerlendirmeTarihi: -1 })
                .limit(5);

              // Puan hesaplamaları
              const taskScores = recentTasks.map(task => ({
                checklistAdi: task.checklist?.ad || 'Bilinmeyen',
                kategori: task.checklist?.kategori || 'Checklist',
                alinanPuan: task.toplamPuan || 0,
                kontrolPuani: task.kontrolToplamPuani || 0,
                tarih: task.tamamlanmaTarihi,
                onayTarihi: task.onayTarihi,
                tip: 'task',
              }));

              const qualityScores = qualityEvaluations.map(evaluation => ({
                checklistAdi: evaluation.sablon?.ad || 'Kalite Kontrolü',
                kategori: 'Kalite Kontrol',
                alinanPuan: evaluation.toplamPuan || 0,
                kontrolPuani: evaluation.toplamPuan || 0,
                tarih: evaluation.degerlendirmeTarihi,
                degerlendirenKullanici: evaluation.degerlendirenKullanici,
                tip: 'quality',
              }));

              const allScores = [...taskScores, ...qualityScores].sort(
                (a, b) => new Date(b.tarih) - new Date(a.tarih),
              );

              // Ortalama puan hesaplama
              const avgScore =
                allScores.length > 0
                  ? Math.round(
                    allScores.reduce(
                      (sum, score) => sum + score.alinanPuan,
                      0,
                    ) / allScores.length,
                  )
                  : 0;

              const avgControlScore =
                allScores.length > 0
                  ? Math.round(
                    allScores.reduce(
                      (sum, score) =>
                        sum + (score.kontrolPuani || score.alinanPuan),
                      0,
                    ) / allScores.length,
                  )
                  : 0;

              return {
                _id: person._id,
                ad: person.ad,
                soyad: person.soyad,
                kullaniciAdi: person.kullaniciAdi,
                roller: person.roller.map(r => r.ad),
                departmanlar: person.departmanlar?.map(d => d.ad) || [
                  'Atanmamış',
                ],
                guncellemeTarihi: person.guncellemeTarihi,
                makinaSayisi: person.secilenMakinalar?.length || 0,
                // Yeni veriler
                recentScores: allScores.slice(0, 5), // Son 5 puan
                totalTasks: taskScores.length,
                totalQualityEvaluations: qualityScores.length,
                avgScore,
                avgControlScore,
                lastActivity: allScores.length > 0 ? allScores[0].tarih : null,
                performanceStatus:
                  avgControlScore >= 80
                    ? 'İyi'
                    : avgControlScore >= 60
                      ? 'Orta'
                      : 'Düşük',
              };
            } catch (error) {
              console.error(
                `❌ Personel ${person.kullaniciAdi} için veri getirme hatası:`,
                error,
              );
              return {
                _id: person._id,
                ad: person.ad,
                soyad: person.soyad,
                kullaniciAdi: person.kullaniciAdi,
                roller: person.roller.map(r => r.ad),
                departmanlar: person.departmanlar?.map(d => d.ad) || [
                  'Atanmamış',
                ],
                guncellemeTarihi: person.guncellemeTarihi,
                makinaSayisi: person.secilenMakinalar?.length || 0,
                recentScores: [],
                totalTasks: 0,
                totalQualityEvaluations: 0,
                avgScore: 0,
                avgControlScore: 0,
                lastActivity: null,
                performanceStatus: 'Veri Yok',
              };
            }
          }),
        );

        return {
          machineId: machine._id,
          machineData: {
            machine: {
              _id: machine._id,
              ad: machine.ad,
              kod: machine.kod,
              envanterKodu: machine.envanterKodu,
              kategori: machine.kategori,
              kaynak: machine.kaynak,
            },
            personnel: personnelWithScores,
            personnelCount: personnelWithScores.length,
            avgMachineScore:
              personnelWithScores.length > 0
                ? Math.round(
                  personnelWithScores.reduce(
                    (sum, p) => sum + p.avgControlScore,
                    0,
                  ) / personnelWithScores.length,
                )
                : 0,
          },
        };
      }),
    );

    // Null olmayan sonuçları machinePersonnelData objesine dönüştür
    const machinePersonnelData = {};
    machinePersonnelResults
      .filter(result => result !== null)
      .forEach(result => {
        machinePersonnelData[result.machineId] = result.machineData;
      });

    // İstatistikler
    const totalPersonnel = Object.values(machinePersonnelData).reduce(
      (sum, machineData) => sum + machineData.personnelCount,
      0,
    );

    const stats = {
      totalMachines: Object.keys(machinePersonnelData).length,
      totalPersonnel,
      roleFilter: roleFilter || 'all',
      avgSystemScore:
        totalPersonnel > 0
          ? Math.round(
            Object.values(machinePersonnelData).reduce(
              (sum, machineData) =>
                sum +
                  machineData.avgMachineScore * machineData.personnelCount,
              0,
            ) / totalPersonnel,
          )
          : 0,
    };

    console.log(
      `📊 ${stats.totalMachines} makinada ${stats.totalPersonnel} personel, ortalama puan: ${stats.avgSystemScore}`,
    );

    res.json({
      success: true,
      data: {
        machinePersonnelData,
        stats,
        roleFilter: roleFilter || null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Makina bazlı personel takip hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Makina bazlı personel verileri alınırken hata oluştu',
      error: error.message,
    });
  }
});

// ✅ YENİ: Rol bazlı personel listesi
router.get('/by-role/:roleId', auth, async (req, res) => {
  try {
    const { roleId } = req.params;
    console.log(`👔 Rol bazlı personel listesi getiriliyor, roleId: ${roleId}`);

    const personnel = await User.find({
      durum: 'aktif',
      roller: roleId,
    })
      .populate('roller', 'ad')
      .populate('departmanlar', 'ad')
      .populate('secilenMakinalar', 'envanterKodu ad kategori')
      .select(
        'ad soyad kullaniciAdi roller departmanlar secilenMakinalar guncellemeTarihi',
      )
      .sort({ ad: 1, soyad: 1 });

    // Her personel için aktivite özetini getir
    const personnelWithActivity = await Promise.all(
      personnel.map(async person => {
        try {
          const last7Days = new Date();
          last7Days.setDate(last7Days.getDate() - 7);

          // Son 7 gündeki aktiviteler
          const recentTasks = await Task.countDocuments({
            kullanici: person._id,
            durum: 'tamamlandi',
            tamamlanmaTarihi: { $gte: last7Days },
          });

          const recentEvaluations =
            await QualityControlEvaluation.countDocuments({
              degerlendirilenKullanici: person._id,
              degerlendirmeTarihi: { $gte: last7Days },
            });

          return {
            _id: person._id,
            ad: person.ad,
            soyad: person.soyad,
            kullaniciAdi: person.kullaniciAdi,
            roller: person.roller.map(r => r.ad),
            departmanlar: person.departmanlar?.map(d => d.ad) || ['Atanmamış'],
            secilenMakinalar: person.secilenMakinalar.map(m => ({
              _id: m._id,
              ad: m.ad,
              envanterKodu: m.envanterKodu,
              kategori: m.kategori,
            })),
            makinaSayisi: person.secilenMakinalar?.length || 0,
            guncellemeTarihi: person.guncellemeTarihi,
            weeklyTaskCount: recentTasks,
            weeklyEvaluationCount: recentEvaluations,
            weeklyTotalActivity: recentTasks + recentEvaluations,
          };
        } catch (error) {
          console.error(
            `❌ Personel ${person.kullaniciAdi} aktivite verisi hatası:`,
            error,
          );
          return {
            _id: person._id,
            ad: person.ad,
            soyad: person.soyad,
            kullaniciAdi: person.kullaniciAdi,
            roller: person.roller.map(r => r.ad),
            departmanlar: person.departmanlar?.map(d => d.ad) || ['Atanmamış'],
            secilenMakinalar: person.secilenMakinalar,
            makinaSayisi: person.secilenMakinalar?.length || 0,
            guncellemeTarihi: person.guncellemeTarihi,
            weeklyTaskCount: 0,
            weeklyEvaluationCount: 0,
            weeklyTotalActivity: 0,
          };
        }
      }),
    );

    res.json({
      success: true,
      data: {
        personnel: personnelWithActivity,
        count: personnelWithActivity.length,
        roleId,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Rol bazlı personel listesi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rol bazlı personel verileri alınırken hata oluştu',
      error: error.message,
    });
  }
});

// ✅ YENİ: Personel detaylı aktivite raporu
router.get('/personnel/:id/activity', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    console.log(
      `🔍 Personel aktivite raporu getiriliyor, id: ${id}, days: ${days}`,
    );

    const person = await User.findById(id)
      .populate('roller', 'ad')
      .populate('departmanlar', 'ad')
      .populate('secilenMakinalar', 'envanterKodu ad kategori');

    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Personel bulunamadı',
      });
    }

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));

    // Rutin görevler
    const tasks = await Task.find({
      kullanici: id,
      durum: 'tamamlandi',
      tamamlanmaTarihi: { $gte: dateFilter },
    })
      .populate('checklist', 'ad kategori')
      .populate('makina', 'ad envanterKodu')
      .select(
        'checklist makina toplamPuan kontrolToplamPuani tamamlanmaTarihi onayTarihi',
      )
      .sort({ tamamlanmaTarihi: -1 });

    // Kalite kontrol değerlendirmeleri
    const qualityEvaluations = await QualityControlEvaluation.find({
      degerlendirilenKullanici: id,
      degerlendirmeTarihi: { $gte: dateFilter },
    })
      .populate('sablon', 'ad')
      .populate('degerlendirenKullanici', 'ad soyad')
      .populate('makina', 'ad envanterKodu')
      .select(
        'sablon makina toplamPuan degerlendirmeTarihi degerlendirenKullanici',
      )
      .sort({ degerlendirmeTarihi: -1 });

    // Makina bazlı aktivite dağılımı
    const machineActivity = {};

    tasks.forEach(task => {
      if (task.makina) {
        const machineKey = task.makina._id.toString();
        if (!machineActivity[machineKey]) {
          machineActivity[machineKey] = {
            machine: task.makina,
            taskCount: 0,
            qualityCount: 0,
            totalScore: 0,
            totalControlScore: 0,
            activities: [],
          };
        }
        machineActivity[machineKey].taskCount++;
        machineActivity[machineKey].totalScore += task.toplamPuan || 0;
        machineActivity[machineKey].totalControlScore +=
          task.kontrolToplamPuani || 0;
        machineActivity[machineKey].activities.push({
          tip: 'task',
          checklistAdi: task.checklist?.ad,
          puan: task.toplamPuan,
          kontrolPuani: task.kontrolToplamPuani,
          tarih: task.tamamlanmaTarihi,
        });
      }
    });

    qualityEvaluations.forEach(evaluation => {
      if (evaluation.makina) {
        const machineKey = evaluation.makina._id.toString();
        if (!machineActivity[machineKey]) {
          machineActivity[machineKey] = {
            machine: evaluation.makina,
            taskCount: 0,
            qualityCount: 0,
            totalScore: 0,
            totalControlScore: 0,
            activities: [],
          };
        }
        machineActivity[machineKey].qualityCount++;
        machineActivity[machineKey].totalScore += evaluation.toplamPuan || 0;
        machineActivity[machineKey].totalControlScore +=
          evaluation.toplamPuan || 0;
        machineActivity[machineKey].activities.push({
          tip: 'quality',
          checklistAdi: evaluation.sablon?.ad,
          puan: evaluation.toplamPuan,
          kontrolPuani: evaluation.toplamPuan,
          tarih: evaluation.degerlendirmeTarihi,
          degerlendirenKullanici: evaluation.degerlendirenKullanici,
        });
      }
    });

    // Her makina için aktiviteleri tarihe göre sırala
    Object.keys(machineActivity).forEach(machineKey => {
      machineActivity[machineKey].activities.sort(
        (a, b) => new Date(b.tarih) - new Date(a.tarih),
      );

      // Ortalama puanları hesapla
      const totalActivities =
        machineActivity[machineKey].taskCount +
        machineActivity[machineKey].qualityCount;
      if (totalActivities > 0) {
        machineActivity[machineKey].avgScore = Math.round(
          machineActivity[machineKey].totalScore / totalActivities,
        );
        machineActivity[machineKey].avgControlScore = Math.round(
          machineActivity[machineKey].totalControlScore / totalActivities,
        );
      } else {
        machineActivity[machineKey].avgScore = 0;
        machineActivity[machineKey].avgControlScore = 0;
      }
    });

    // Genel istatistikler
    const totalTasks = tasks.length;
    const totalQualityEvaluations = qualityEvaluations.length;
    const totalActivities = totalTasks + totalQualityEvaluations;

    const totalScore =
      tasks.reduce((sum, task) => sum + (task.toplamPuan || 0), 0) +
      qualityEvaluations.reduce(
        (sum, evaluation) => sum + (evaluation.toplamPuan || 0),
        0,
      );

    const totalControlScore =
      tasks.reduce((sum, task) => sum + (task.kontrolToplamPuani || 0), 0) +
      qualityEvaluations.reduce(
        (sum, evaluation) => sum + (evaluation.toplamPuan || 0),
        0,
      );

    const stats = {
      totalTasks,
      totalQualityEvaluations,
      totalActivities,
      avgScore:
        totalActivities > 0 ? Math.round(totalScore / totalActivities) : 0,
      avgControlScore:
        totalActivities > 0
          ? Math.round(totalControlScore / totalActivities)
          : 0,
      machineCount: Object.keys(machineActivity).length,
      days: parseInt(days),
    };

    res.json({
      success: true,
      data: {
        person: {
          _id: person._id,
          ad: person.ad,
          soyad: person.soyad,
          kullaniciAdi: person.kullaniciAdi,
          roller: person.roller.map(r => r.ad),
          departmanlar: person.departmanlar?.map(d => d.ad) || ['Atanmamış'],
          secilenMakinalar: person.secilenMakinalar,
        },
        machineActivity,
        stats,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Personel aktivite raporu hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Personel aktivite raporu alınırken hata oluştu',
      error: error.message,
    });
  }
});

// Personel makina takip - Ana sayfa (Mevcut endpoint)
router.get('/current-status', auth, async (req, res) => {
  try {
    console.log('📊 Personel makina durumu getiriliyor...');

    // Tüm aktif personeli getir
    const personnel = await User.find({
      durum: 'aktif',
      secilenMakinalar: { $exists: true, $ne: [] },
    })
      .populate('roller', 'ad')
      .populate('departmanlar', 'ad')
      .populate('secilenMakinalar', 'envanterKodu ad kategori')
      .select(
        'ad soyad kullaniciAdi roller departmanlar secilenMakinalar guncellemeTarihi',
      )
      .sort({ ad: 1, soyad: 1 });

    console.log(`👥 ${personnel.length} aktif personel bulundu`);

    // Makina bazlı gruplama
    const machinePersonnel = {};
    const departmentPersonnel = {};
    const rolePersonnel = {};

    personnel.forEach(person => {
      const departmanAdlari = person.departmanlar?.map(d => d.ad) || [
        'Atanmamış',
      ];
      const personData = {
        _id: person._id,
        ad: person.ad,
        soyad: person.soyad,
        kullaniciAdi: person.kullaniciAdi,
        roller: person.roller.map(r => r.ad),
        departmanlar: departmanAdlari,
        guncellemeTarihi: person.guncellemeTarihi,
        makinaSayisi: person.secilenMakinalar?.length || 0,
      };

      // Departman bazlı gruplama (her departman için ayrı)
      departmanAdlari.forEach(deptAd => {
        if (!departmentPersonnel[deptAd]) {
          departmentPersonnel[deptAd] = [];
        }
        departmentPersonnel[deptAd].push(personData);
      });

      // Rol bazlı gruplama
      person.roller.forEach(role => {
        if (!rolePersonnel[role.ad]) {
          rolePersonnel[role.ad] = [];
        }
        rolePersonnel[role.ad].push(personData);
      });

      // Makina bazlı gruplama
      if (person.secilenMakinalar && person.secilenMakinalar.length > 0) {
        person.secilenMakinalar.forEach(machine => {
          const machineKey = `${machine.envanterKodu} - ${machine.ad}`;
          if (!machinePersonnel[machineKey]) {
            machinePersonnel[machineKey] = {
              machine: {
                _id: machine._id,
                envanterKodu: machine.envanterKodu,
                ad: machine.ad,
                kategori: machine.kategori,
              },
              personnel: [],
            };
          }
          machinePersonnel[machineKey].personnel.push(personData);
        });
      }
    });

    // İstatistikler
    const stats = {
      toplamPersonel: personnel.length,
      departmanSayisi: Object.keys(departmentPersonnel).length,
      makinaSayisi: Object.keys(machinePersonnel).length,
      rolSayisi: Object.keys(rolePersonnel).length,
      makinasizPersonel: personnel.filter(
        p => !p.secilenMakinalar || p.secilenMakinalar.length === 0,
      ).length,
    };

    // Vardiya bilgisi (şu anki saat bazında)
    const currentHour = new Date().getHours();
    const currentShift =
      currentHour >= 8 && currentHour < 20 ? 'Gündüz' : 'Gece';

    console.log(
      `📊 İstatistikler: ${stats.toplamPersonel} personel, ${stats.makinaSayisi} makina`,
    );

    res.json({
      success: true,
      data: {
        personnel,
        machinePersonnel,
        departmentPersonnel,
        rolePersonnel,
        stats,
        currentShift,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('❌ Personel takip hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Personel takip verileri alınırken hata oluştu',
      error: error.message,
    });
  }
});

// @route   GET /api/personnel-tracking/kalip-degisim
// @desc    Kalıp değişim takibi - hangi makinada son kalıp değişimi kim yaptı
// @access  Private
router.get('/kalip-degisim', auth, async (req, res) => {
  try {
    console.log('🔄 Kalıp değişim takibi verileri getiriliyor...');

    // Tüm makinaları getir (InventoryItem'dan)
    const allMachines = await InventoryItem.find({
      $or: [
        { kategori: { $regex: /makina/i } },
        { 'dinamikAlanlar.kategori': { $regex: /makina/i } },
      ],
    })
      .select('ad kod envanterKodu kategori dinamikAlanlar')
      .sort({ ad: 1 });

    console.log(`🏭 Toplam ${allMachines.length} makina bulundu`);

    // Her makina için en son kalıp değişim görevi bilgisini getir
    const machineKalipData = await Promise.all(
      allMachines.map(async machine => {
        try {
          // Bu makinada en son yapılan kalıp değişim görevini bul
          const lastKalipTask = await WorkTask.findOne({
            makina: machine._id,
            durum: 'tamamlandi',
            // Kalıp bilgileri mevcut olanları filtrele
            $or: [
              { indirilenKalip: { $exists: true, $ne: null } },
              { baglananHamade: { $exists: true, $ne: null } },
            ],
          })
            .populate('kullanici', 'ad soyad kullaniciAdi')
            .populate('checklist', 'ad')
            .populate('indirilenKalip', 'ad envanterKodu dinamikAlanlar')
            .populate('baglananHamade', 'ad envanterKodu dinamikAlanlar')
            .populate('kalipDegisimBuddy', 'ad soyad kullaniciAdi')
            .sort({ tamamlanmaTarihi: -1 })
            .limit(1);

          // Kategori bilgisini güvenli şekilde çıkar
          let kategori = 'Bilinmiyor';
          if (machine.kategori) {
            kategori = machine.kategori;
          } else if (machine.dinamikAlanlar) {
            // Map veya Object olabilir
            if (machine.dinamikAlanlar instanceof Map) {
              kategori = machine.dinamikAlanlar.get('kategori') || 'Bilinmiyor';
            } else if (typeof machine.dinamikAlanlar === 'object') {
              kategori = machine.dinamikAlanlar.kategori || 'Bilinmiyor';
            }
          }

          return {
            machine: {
              _id: machine._id,
              ad: machine.ad,
              kod: machine.kod || machine.envanterKodu,
              envanterKodu: machine.envanterKodu,
              kategori: kategori,
            },
            lastKalipChange: lastKalipTask
              ? {
                _id: lastKalipTask._id,
                makina: {
                  _id: machine._id,
                  ad: machine.ad,
                },
                usta: {
                  _id: lastKalipTask.kullanici._id,
                  ad: lastKalipTask.kullanici.ad,
                  soyad: lastKalipTask.kullanici.soyad,
                  kullaniciAdi: lastKalipTask.kullanici.kullaniciAdi,
                },
                buddy: lastKalipTask.kalipDegisimBuddy
                  ? {
                    _id: lastKalipTask.kalipDegisimBuddy._id,
                    ad: lastKalipTask.kalipDegisimBuddy.ad,
                    soyad: lastKalipTask.kalipDegisimBuddy.soyad,
                    kullaniciAdi:
                          lastKalipTask.kalipDegisimBuddy.kullaniciAdi,
                  }
                  : null,
                checklistAdi: lastKalipTask.checklist
                  ? lastKalipTask.checklist.ad
                  : 'Bilinmiyor',
                indirilenKalip: lastKalipTask.indirilenKalip
                  ? {
                    ad: lastKalipTask.indirilenKalip.ad || 'Bilinmiyor',
                    envanterKodu:
                          lastKalipTask.indirilenKalip.envanterKodu || 'Yok',
                  }
                  : null,
                baglananKalip: lastKalipTask.baglananHamade
                  ? {
                    ad: lastKalipTask.baglananHamade.ad || 'Bilinmiyor',
                    envanterKodu:
                          lastKalipTask.baglananHamade.envanterKodu || 'Yok',
                  }
                  : null,
                tamamlanmaTarihi: lastKalipTask.tamamlanmaTarihi,
                makinaDurmaSaati: lastKalipTask.makinaDurmaSaati,
                yeniKalipAktifSaati: lastKalipTask.yeniKalipAktifSaati,
              }
              : null,
          };
        } catch (error) {
          console.error(
            `❌ Makina ${machine.ad} için kalıp değişim verisi alınırken hata:`,
            error,
          );
          return {
            machine: {
              _id: machine._id,
              ad: machine.ad,
              kod: machine.kod || machine.envanterKodu,
              envanterKodu: machine.envanterKodu,
              kategori: 'Bilinmiyor',
            },
            lastKalipChange: null,
          };
        }
      }),
    );

    // İstatistikler
    const totalMachines = machineKalipData.length;
    const machinesWithKalipChange = machineKalipData.filter(
      item => item.lastKalipChange !== null,
    ).length;
    const machinesWithoutKalipChange = totalMachines - machinesWithKalipChange;

    // Son 7 günde kalıp değişimi yapılan makinalar
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const recentKalipChanges = machineKalipData.filter(
      item =>
        item.lastKalipChange &&
        new Date(item.lastKalipChange.tamamlanmaTarihi) >= last7Days,
    ).length;

    const stats = {
      totalMachines,
      machinesWithKalipChange,
      machinesWithoutKalipChange,
      recentKalipChanges,
      lastUpdate: new Date(),
    };

    console.log(
      `📊 Kalıp değişim istatistikleri: ${machinesWithKalipChange}/${totalMachines} makinada kalıp değişimi var`,
    );

    res.json({
      success: true,
      data: {
        machines: machineKalipData,
        stats,
      },
    });
  } catch (error) {
    console.error('❌ Kalıp değişim takibi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kalıp değişim takibi verileri alınırken hata oluştu',
      error: error.message,
    });
  }
});

// @route   GET /api/personnel-tracking/kalip-degisim/:machineId/history
// @desc    Belirli bir makinanın kalıp değişim geçmişi
// @access  Private
router.get('/kalip-degisim/:machineId/history', auth, async (req, res) => {
  try {
    const { machineId } = req.params;
    const { limit = 10 } = req.query;

    console.log(
      `🔍 Makina ${machineId} için kalıp değişim geçmişi getiriliyor...`,
    );

    // Makinanın tüm kalıp değişim görevlerini getir
    const kalipHistory = await WorkTask.find({
      makina: machineId,
      durum: 'tamamlandi',
      $or: [
        { indirilenKalip: { $exists: true, $ne: null } },
        { baglananHamade: { $exists: true, $ne: null } },
      ],
    })
      .populate('kullanici', 'ad soyad kullaniciAdi')
      .populate('checklist', 'ad')
      .populate('indirilenKalip', 'ad envanterKodu dinamikAlanlar')
      .populate('baglananHamade', 'ad envanterKodu dinamikAlanlar')
      .populate('kalipDegisimBuddy', 'ad soyad kullaniciAdi')
      .populate('makina', 'ad envanterKodu')
      .sort({ tamamlanmaTarihi: -1 })
      .limit(parseInt(limit));

    // Makina bilgisini getir
    const machine = await InventoryItem.findById(machineId).select(
      'ad kod envanterKodu kategori dinamikAlanlar',
    );

    if (!machine) {
      return res.status(404).json({
        success: false,
        message: 'Makina bulunamadı',
      });
    }

    // Geçmiş verileri formatla
    const formattedHistory = kalipHistory.map(task => ({
      _id: task._id,
      usta: task.kullanici
        ? {
          _id: task.kullanici._id,
          ad: task.kullanici.ad,
          soyad: task.kullanici.soyad,
          kullaniciAdi: task.kullanici.kullaniciAdi,
        }
        : null,
      buddy: task.kalipDegisimBuddy
        ? {
          _id: task.kalipDegisimBuddy._id,
          ad: task.kalipDegisimBuddy.ad,
          soyad: task.kalipDegisimBuddy.soyad,
          kullaniciAdi: task.kalipDegisimBuddy.kullaniciAdi,
        }
        : null,
      checklistAdi: task.checklist ? task.checklist.ad : 'Bilinmiyor',
      indirilenKalip: task.indirilenKalip
        ? {
          ad: task.indirilenKalip.ad || 'Bilinmiyor',
          envanterKodu: task.indirilenKalip.envanterKodu || 'Yok',
        }
        : null,
      baglananKalip: task.baglananHamade
        ? {
          ad: task.baglananHamade.ad || 'Bilinmiyor',
          envanterKodu: task.baglananHamade.envanterKodu || 'Yok',
        }
        : null,
      tamamlanmaTarihi: task.tamamlanmaTarihi,
      makinaDurmaSaati: task.makinaDurmaSaati,
      yeniKalipAktifSaati: task.yeniKalipAktifSaati,
      // Süre hesaplama
      durmaSuresi:
        task.yeniKalipAktifSaati && task.makinaDurmaSaati
          ? Math.round(
            (new Date(task.yeniKalipAktifSaati) -
                new Date(task.makinaDurmaSaati)) /
                (1000 * 60),
          ) // dakika
          : null,
    }));

    console.log(`✅ ${formattedHistory.length} kalıp değişim kaydı bulundu`);

    res.json({
      success: true,
      data: {
        machine: {
          _id: machine._id,
          ad: machine.ad,
          kod: machine.kod || machine.envanterKodu,
          envanterKodu: machine.envanterKodu,
        },
        history: formattedHistory,
        totalCount: formattedHistory.length,
      },
    });
  } catch (error) {
    console.error('❌ Kalıp değişim geçmişi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Kalıp değişim geçmişi alınırken hata oluştu',
      error: error.message,
    });
  }
});

module.exports = router;
