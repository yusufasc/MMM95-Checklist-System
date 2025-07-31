const MyActivityService = require('../services/myActivityService');
const MyActivityHelpers = require('../services/myActivityHelpers');
const MyActivityFormatters = require('../utils/myActivityFormatters');
const Task = require('../models/Task');
const WorkTask = require('../models/WorkTask');
const QualityControlEvaluation = require('../models/QualityControlEvaluation');
const HRScore = require('../models/HRScore');
const KalipDegisimEvaluation = require('../models/KalipDegisimEvaluation');
const BonusEvaluation = require('../models/BonusEvaluation');
const User = require('../models/User');

/**
 * MyActivity Controller Layer
 * Handles HTTP requests and responses for MyActivity routes
 */
class MyActivityController {
  /**
   * Test endpoint
   */
  static testEndpoint(req, res) {
    try {
      console.log('🔍 Test route çalışıyor...');
      console.log('User ID:', req.user._id);
      console.log('User ad:', req.user.ad);
      console.log('User roller:', req.user.roller?.length || 0);

      res.json({
        message: 'Test başarılı',
        user: {
          id: req.user._id,
          ad: req.user.ad,
          soyad: req.user.soyad,
          rollerSayisi: req.user.roller?.length || 0,
        },
      });
    } catch (error) {
      console.error('❌ Test route hatası:', error.message);
      console.error('❌ Stack:', error.stack);
      res.status(500).json({ message: 'Test hatası: ' + error.message });
    }
  }

  /**
   * Get user activity summary
   */
  static async getSummary(req, res) {
    try {
      console.log('🔍 Summary endpoint başladı');
      console.log('User:', req.user?.ad, req.user?.soyad);
      console.log('User ID:', req.user?._id);

      const { days = 30 } = req.query;
      const userId = req.user._id;

      if (!userId) {
        console.error('❌ User ID bulunamadı');
        return res.status(400).json({ message: 'User ID gerekli' });
      }

      console.log(
        `📊 ${req.user.ad} ${req.user.soyad} için aktivite özeti hesaplanıyor...`,
      );

      // Get raw data from service
      const data = await MyActivityService.getUserSummary(userId, days);

      // ✅ DEBUG: Control scores debug
      console.log('🔍 Raw control scores count:', data.controlScores.length);
      if (data.controlScores.length > 0) {
        console.log(
          '🔍 Control scores details:',
          data.controlScores.map(score => ({
            gorevTipi: score.gorevTipi,
            puan: score.kontrolPuani,
            tarih: score.puanlamaTarihi,
            puanlanan: score.puanlananKullanici,
          })),
        );
      }

      // Calculate scores by category
      const scoresByCategory = MyActivityService.calculateScoresByCategory(
        data,
        userId,
      );

      // Format general statistics
      const genelIstatistikler = MyActivityFormatters.formatGeneralStats(
        data,
        scoresByCategory,
        days,
      );

      // Response
      const summary = {
        kullanici: {
          id: req.user._id,
          ad: req.user.ad,
          soyad: req.user.soyad,
          roller: req.user.roller,
        },
        tarihAraligi: {
          baslangic: data.dateRange.startDate,
          bitis: data.dateRange.endDate,
          gunSayisi: parseInt(days),
        },
        genelIstatistikler,
        kategorilerePuanlar: scoresByCategory,
        checklistGorevleri: data.checklistTasks.length,
        iseBagliGorevleri: data.workTasks.length,
        kaliteKontrolDegerlendirmeleri: data.qualityEvaluations.length,
        ikDegerlendirmeleri: data.hrScores.length,
        bonusDegerlendirmeleri: data.bonusEvaluations.length,
        kalipDegisimDegerlendirmeleri: data.kalipDegisimEvaluations.length,
        kontrolPuanlari: data.controlScores.length,
      };

      console.log(
        `✅ Aktivite özeti hazırlandı - Toplam: ${genelIstatistikler.toplamGorevSayisi} görev, ${genelIstatistikler.toplamPuan} puan`,
      );
      res.json(summary);
    } catch (error) {
      console.error('❌ Aktivite özeti hatası:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  }

  /**
   * Get detailed activity list
   */
  static async getDetailed(req, res) {
    try {
      const userId = req.user._id;
      const filters = req.query;

      console.log(
        `📋 ${req.user.ad} ${req.user.soyad} için detaylı aktivite listesi getiriliyor...`,
      );

      // Get activities data
      const activityData = await MyActivityHelpers.getDetailedActivities(
        userId,
        filters,
      );

      console.log('📊 Aktivite verileri:', {
        checklistTasks: activityData.checklistTasks.length,
        workTasks: activityData.workTasks.length,
        qualityEvaluations: activityData.qualityEvaluations.length,
        hrScores: activityData.hrScores.length,
        bonusEvaluations: activityData.bonusEvaluations?.length || 0,
        controlPendingTasks: activityData.controlPendingTasks?.length || 0,
        controlScores: activityData.controlScores?.length || 0,
        kalipDegisimEvaluations:
          activityData.kalipDegisimEvaluations?.length || 0,
      });

      // Format activities - Tüm aktivite tiplerini dahil et
      const allActivities = MyActivityFormatters.formatDetailedActivities(
        activityData.checklistTasks,
        activityData.workTasks,
        activityData.qualityEvaluations,
        activityData.hrScores,
        activityData.bonusEvaluations || [],
        activityData.controlPendingTasks || [],
        activityData.controlScores || [],
        activityData.kalipDegisimEvaluations || [],
        userId, // User context for buddy detection
      );

      // Calculate pagination - Tüm aktivite tiplerini dahil et
      const toplamKayit =
        activityData.totalChecklistTasks +
        activityData.totalWorkTasks +
        activityData.totalQualityEvaluations +
        activityData.totalHRScores +
        (activityData.totalBonusEvaluations || 0) +
        (activityData.totalControlPendingTasks || 0) +
        (activityData.totalControlScores || 0) +
        (activityData.totalKalipDegisimEvaluations || 0);

      // Apply pagination to combined activities
      const skip =
        (activityData.pagination.pageNum - 1) *
        activityData.pagination.limitNum;
      const paginatedActivities = allActivities.slice(
        skip,
        skip + activityData.pagination.limitNum,
      );

      const toplamSayfa = Math.ceil(
        toplamKayit / activityData.pagination.limitNum,
      );

      console.log(
        `✅ ${allActivities.length} toplam aktivite, ${paginatedActivities.length} gösteriliyor`,
      );

      res.json({
        activities: paginatedActivities,
        sayfalama: {
          mevcutSayfa: activityData.pagination.pageNum,
          toplamSayfa,
          toplamKayit,
          sayfaBoyutu: activityData.pagination.limitNum,
        },
        aktiviteTipleri: {
          checklistTasks: activityData.totalChecklistTasks,
          workTasks: activityData.totalWorkTasks,
          qualityEvaluations: activityData.totalQualityEvaluations,
          hrScores: activityData.totalHRScores,
          bonusEvaluations: activityData.totalBonusEvaluations || 0,
          controlPendingTasks: activityData.totalControlPendingTasks || 0,
          controlScores: activityData.totalControlScores || 0,
        },
      });
    } catch (error) {
      console.error('❌ Detaylı aktivite hatası:', error.message);
      console.error('❌ Stack:', error.stack);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  }

  /**
   * Get score details
   */
  static async getScoresDetail(req, res) {
    try {
      const userId = req.user._id;
      const filters = req.query;

      console.log(
        `🏆 ${req.user.ad} ${req.user.soyad} için puanlama detayları getiriliyor...`,
      );

      // Get score data
      const scoreData = await MyActivityHelpers.getScoreDetails(
        userId,
        filters,
      );

      // Format score details
      const scoreDetails = MyActivityFormatters.formatScoreDetails(
        scoreData,
        scoreData.dateRange.startDate,
        scoreData.dateRange.endDate,
      );

      // Apply pagination
      const skip =
        (scoreData.pagination.pageNum - 1) * scoreData.pagination.limitNum;
      const toplamKayit = scoreDetails.length;
      const toplamSayfa = Math.ceil(
        toplamKayit / scoreData.pagination.limitNum,
      );
      const paginatedScoreDetails = scoreDetails.slice(
        skip,
        skip + scoreData.pagination.limitNum,
      );

      console.log(
        `✅ ${scoreDetails.length} puanlama detayı hazırlandı, ${paginatedScoreDetails.length} gösteriliyor`,
      );

      res.json({
        scoreDetails: paginatedScoreDetails,
        sayfalama: {
          mevcutSayfa: scoreData.pagination.pageNum,
          toplamSayfa,
          toplamKayit,
          sayfaBoyutu: scoreData.pagination.limitNum,
        },
        istatistikler: {
          toplamPuanliGorev: toplamKayit,
          sonGunler: parseInt(filters.days || 30),
          tarihAraligi: {
            baslangic: scoreData.dateRange.startDate,
            bitis: scoreData.dateRange.endDate,
          },
        },
      });
    } catch (error) {
      console.error('❌ Puanlama detayları hatası:', error.message);
      console.error('❌ Stack trace:', error.stack);
      res.status(500).json({
        message: 'Sunucu hatası',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Sunucu hatası',
      });
    }
  }

  /**
   * Get task details by ID
   */
  static async getTaskDetails(req, res) {
    try {
      const taskId = req.params.id;
      console.log('🔍 Task details isteniyor:', taskId);
      console.log('📝 Task ID analizi:', {
        length: taskId.length,
        startsWithHR: taskId.startsWith('hr_'),
        isHRChecklist: taskId.startsWith('hr_checklist_'),
        isHRMesai: taskId.startsWith('hr_mesai_'),
        isHRDevamsizlik: taskId.startsWith('hr_devamsizlik_'),
        isKalipDegisim: taskId.startsWith('kalip_degisim_'),
        isBonusEval: taskId.startsWith('bonus_eval_'),
      });

      // Check if it's a Kalıp Değişim evaluation
      if (
        taskId.startsWith('kalip_degisim_main_') ||
        taskId.startsWith('kalip_degisim_buddy_')
      ) {
        console.log('🔧 Kalıp değişim değerlendirmesi tespit edildi');
        const actualId = taskId
          .replace('kalip_degisim_main_', '')
          .replace('kalip_degisim_buddy_', '');
        const isMainWorker = taskId.startsWith('kalip_degisim_main_');

        console.log(
          '📋 Kalıp değişim ID:',
          actualId,
          'Ana çalışan:',
          isMainWorker,
        );

        const kalipDegisimEvaluation = await KalipDegisimEvaluation.findById(
          actualId,
        )
          .populate('checklistTemplate', 'ad aciklama maddeler')
          .populate('workTask', 'makina indirilenKalip baglananHamade')
          .populate('degerlendiren', 'ad soyad')
          .populate('anaCalisan', 'ad soyad kullaniciAdi')
          .populate('buddyCalisan', 'ad soyad kullaniciAdi');

        if (kalipDegisimEvaluation) {
          console.log('✅ Kalıp değişim değerlendirmesi bulundu');
          console.log('🔍 Debug - Kalıp değişim evaluation verileri:', {
            id: kalipDegisimEvaluation._id,
            checklistTemplate: kalipDegisimEvaluation.checklistTemplate?.ad,
            maddeleSayisi: kalipDegisimEvaluation.maddeler?.length || 0,
            templateMaddeleSayisi:
              kalipDegisimEvaluation.checklistTemplate?.maddeler?.length || 0,
            anaCalısanPuan: kalipDegisimEvaluation.anaCalısanToplamPuan,
            buddyPuan: kalipDegisimEvaluation.buddyToplamPuan,
            maxPuan: kalipDegisimEvaluation.maxToplamPuan,
          });

          // Maddeler kontrolü - hangisini kullanacağız?
          const maddelerKaynak =
            kalipDegisimEvaluation.maddeler?.length > 0
              ? 'evaluation.maddeler'
              : 'template.maddeler';
          console.log('🔍 Maddeler kaynağı:', maddelerKaynak);

          if (kalipDegisimEvaluation.maddeler?.length > 0) {
            console.log(
              '🔍 Evaluation maddeler (ilk 3):',
              kalipDegisimEvaluation.maddeler.slice(0, 3).map(m => ({
                baslik: m.baslik,
                puan: m.puan,
                maksimumPuan: m.maksimumPuan,
              })),
            );
          }

          if (kalipDegisimEvaluation.checklistTemplate?.maddeler?.length > 0) {
            console.log(
              '🔍 Template maddeler (ilk 3):',
              kalipDegisimEvaluation.checklistTemplate.maddeler
                .slice(0, 3)
                .map(m => ({
                  baslik: m.baslik,
                  maksimumPuan: m.maksimumPuan,
                })),
            );
          }

          // Field mapping ile doğru response döndür
          const mappedMaddeler = (kalipDegisimEvaluation.maddeler || []).map(
            madde => ({
              baslik: madde.soru, // soru → baslik
              maksimumPuan: madde.maxPuan, // maxPuan → maksimumPuan
              puan: madde.verilenPuan, // verilenPuan → puan
              yorum: madde.yorum || '',
              resimUrl: madde.resimUrl || '',
              maddeId: madde.maddeId,
            }),
          );

          console.log(
            '🔧 Field mapping sonrası maddeler (ilk 3):',
            mappedMaddeler.slice(0, 3).map(m => ({
              baslik: m.baslik,
              puan: m.puan,
              maksimumPuan: m.maksimumPuan,
            })),
          );

          return res.json({
            tip: 'kalip_degisim',
            checklistAdi:
              kalipDegisimEvaluation.checklistTemplate?.ad || 'Kalıp Değişim',
            kategori: isMainWorker
              ? 'Kalıp Değişim - Ana Çalışan'
              : 'Kalıp Değişim - Buddy',
            tarih: kalipDegisimEvaluation.degerlendirmeTarihi,
            puan: isMainWorker
              ? kalipDegisimEvaluation.anaCalısanToplamPuan
              : kalipDegisimEvaluation.buddyToplamPuan,
            maksimumPuan: kalipDegisimEvaluation.maxToplamPuan || 100,
            maddeler: mappedMaddeler, // Mapped maddeler kullan
            degerlendiren: kalipDegisimEvaluation.degerlendiren,
            rol: isMainWorker ? 'Ana Çalışan' : 'Buddy',
            workTask: kalipDegisimEvaluation.workTask,
          });
        } else {
          console.log('❌ Kalıp değişim değerlendirmesi bulunamadı:', actualId);
        }
      }

      // Check if it's a Bonus evaluation
      if (taskId.startsWith('bonus_eval_')) {
        console.log('🎁 Bonus değerlendirmesi tespit edildi');
        const actualId = taskId.replace('bonus_eval_', '');

        console.log('📋 Bonus evaluation ID:', actualId);

        const bonusEvaluation = await BonusEvaluation.findById(actualId)
          .populate('sablon', 'ad aciklama bonusKategorisi')
          .populate('degerlendirenKullanici', 'ad soyad')
          .populate('departman', 'ad');

        if (bonusEvaluation) {
          console.log('✅ Bonus değerlendirmesi bulundu');
          // Basit bir response döndür şimdilik
          return res.json({
            tip: 'bonus_evaluation',
            checklistAdi: bonusEvaluation.sablon?.ad || 'Bonus Değerlendirmesi',
            kategori: `Bonus - ${bonusEvaluation.sablon?.bonusKategorisi || 'Genel'}`,
            tarih: bonusEvaluation.degerlendirmeTarihi,
            puan: bonusEvaluation.toplamPuan || 0,
            maksimumPuan: bonusEvaluation.sablon?.maksimumPuan || 100,
            maddeler: bonusEvaluation.puanlamalar || [],
            degerlendiren: bonusEvaluation.degerlendirenKullanici,
            bonusKategorisi: bonusEvaluation.sablon?.bonusKategorisi,
            departman: bonusEvaluation.departman,
          });
        } else {
          console.log('❌ Bonus değerlendirmesi bulunamadı:', actualId);
        }
      }

      // Check if it's an HR evaluation
      if (
        taskId.startsWith('hr_checklist_') ||
        taskId.startsWith('hr_mesai_') ||
        taskId.startsWith('hr_devamsizlik_')
      ) {
        console.log('🏥 İK değerlendirmesi tespit edildi');
        const taskDetails = await MyActivityController.getHRTaskDetails(taskId);
        console.log('✅ İK task details başarıyla döndürülüyor');
        return res.json(taskDetails);
      }

      // Check if it's a Quality Control evaluation
      if (taskId.length === 24 && !taskId.startsWith('hr_')) {
        console.log('🔬 Kalite kontrol değerlendirmesi aranıyor:', taskId);

        const qualityEvaluation = await QualityControlEvaluation.findById(
          taskId,
        )
          .populate('sablon', 'ad aciklama kriterler')
          .populate('degerlendirenKullanici', 'ad soyad')
          .populate('makina', 'ad envanterKodu')
          .populate('kalip', 'ad envanterKodu');

        if (qualityEvaluation) {
          console.log('✅ Kalite kontrol değerlendirmesi bulundu');
          const taskDetails =
            MyActivityFormatters.formatQualityEvaluationDetails(
              qualityEvaluation,
            );
          return res.json(taskDetails);
        } else {
          console.log('❌ Kalite kontrol değerlendirmesi bulunamadı');
        }
      }

      // Try to find as WorkTask first
      console.log('🔧 WorkTask olarak aranıyor...');
      const workTask = await WorkTask.findById(taskId)
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad kategori aciklama maddeler')
        .populate('makina', 'ad makinaNo envanterKodu')
        .populate('indirilenKalip', 'envanterKodu ad dinamikAlanlar')
        .populate('baglananHamade', 'envanterKodu ad dinamikAlanlar')
        .populate('onaylayanKullanici', 'ad soyad');

      if (workTask) {
        console.log('✅ WorkTask bulundu');
        const taskDetails =
          MyActivityFormatters.formatWorkTaskDetails(workTask);
        console.log(
          `✅ WorkTask detayları hazırlandı - ${taskDetails.checklistAdi} - ${taskDetails.maddeler.length} madde`,
        );
        return res.json(taskDetails);
      }

      // Normal task details
      console.log('📋 Normal Task olarak aranıyor...');
      const task = await Task.findById(taskId)
        .populate('kullanici', 'ad soyad kullaniciAdi')
        .populate('checklist', 'ad kategori aciklama maddeler')
        .populate('makina', 'ad makinaNo envanterKodu')
        .populate('onaylayan', 'ad soyad')
        .populate('kontroleden', 'ad soyad');

      if (!task) {
        console.log('❌ Hiçbir yerde task bulunamadı:', taskId);
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }

      console.log('✅ Normal Task bulundu');
      const taskDetails = MyActivityFormatters.formatTaskDetails(task);

      console.log(
        `✅ ${taskDetails.checklistAdi} görev detayları hazırlandı - ${taskDetails.maddeler.length} madde`,
      );

      res.json(taskDetails);
    } catch (error) {
      console.error('❌ Görev detayları hatası:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      res.status(500).json({
        message: 'Sunucu hatası',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Sunucu hatası',
        details:
          process.env.NODE_ENV === 'development'
            ? {
              taskId: req.params.id,
              errorName: error.name,
              errorMessage: error.message,
            }
            : undefined,
      });
    }
  }

  /**
   * Get HR task details (helper method)
   */
  static async getHRTaskDetails(taskId) {
    try {
      console.log('🔍 İK task details isteniyor:', taskId);
      console.log('📏 Task ID uzunluğu:', taskId.length);

      const parts = taskId.split('_');
      console.log('🔧 Split sonucu:', parts);
      console.log('🔧 Parts sayısı:', parts.length);

      if (parts.length < 4) {
        console.error('❌ Geçersiz task ID formatı:', taskId);
        throw new Error('Geçersiz task ID formatı');
      }

      const [, type, hrScoreId, subItemId] = parts;

      console.log('📋 Parse edilen bilgiler:', { type, hrScoreId, subItemId });
      console.log('📊 ID uzunlukları:', {
        type: type?.length,
        hrScoreId: hrScoreId?.length,
        subItemId: subItemId?.length,
      });

      // MongoDB ObjectID validation
      if (!hrScoreId || hrScoreId.length !== 24) {
        console.error('❌ Geçersiz hrScoreId:', hrScoreId);
        throw new Error('Geçersiz HR Score ID');
      }

      if (!subItemId || subItemId.length !== 24) {
        console.error('❌ Geçersiz subItemId:', subItemId);
        throw new Error('Geçersiz Sub Item ID');
      }

      const hrScore = await HRScore.findById(hrScoreId).populate(
        'checklistPuanlari.sablon',
        'ad aciklama maddeler',
      );

      if (!hrScore) {
        console.error('❌ İK Score bulunamadı:', hrScoreId);
        throw new Error('İK değerlendirmesi bulunamadı');
      }

      console.log('✅ İK Score bulundu, alt veri aranıyor...');
      console.log('📊 HR Score içeriği:', {
        checklistCount: hrScore.checklistPuanlari?.length || 0,
        mesaiCount: hrScore.mesaiKayitlari?.length || 0,
        devamsizlikCount: hrScore.devamsizlikKayitlari?.length || 0,
      });

      // Mevcut ID'leri listele
      if (hrScore.checklistPuanlari?.length > 0) {
        console.log(
          '📋 Mevcut checklist ID\'leri:',
          hrScore.checklistPuanlari.map(p => p._id.toString()),
        );
      }

      let evaluation = null;

      if (type === 'checklist') {
        evaluation = hrScore.checklistPuanlari.find(
          p => p._id.toString() === subItemId,
        );
        console.log(
          '🔍 Checklist arama sonucu:',
          evaluation ? 'Bulundu' : 'Bulunamadı',
        );
        if (evaluation) {
          console.log('✅ Bulunan evaluation:', {
            id: evaluation._id,
            sablonId: evaluation.sablon?._id,
            tarih: evaluation.tarih,
            maddePuan: evaluation.madde?.puan,
            detaylarSayisi: evaluation.madde?.detaylar?.length || 0,
          });
        }
      } else if (type === 'mesai') {
        evaluation = hrScore.mesaiKayitlari.find(
          m => m._id.toString() === subItemId,
        );
        console.log(
          '🔍 Mesai arama sonucu:',
          evaluation ? 'Bulundu' : 'Bulunamadı',
        );
      } else if (type === 'devamsizlik') {
        evaluation = hrScore.devamsizlikKayitlari.find(
          d => d._id.toString() === subItemId,
        );
        console.log(
          '🔍 Devamsızlık arama sonucu:',
          evaluation ? 'Bulundu' : 'Bulunamadı',
        );
      }

      if (!evaluation) {
        console.error('❌ İK değerlendirmesi bulunamadı');
        console.log('🎯 Aranan subItemId:', subItemId);
        throw new Error('İK değerlendirmesi bulunamadı');
      }

      console.log('✅ İK değerlendirmesi bulundu, formatlanıyor...');
      const formattedData = MyActivityFormatters.formatHRTaskDetails(
        taskId,
        type,
        evaluation,
      );
      console.log('✅ Formatlanmış veri hazır:', {
        id: formattedData.id,
        checklistAdi: formattedData.checklistAdi,
        maddelerSayisi: formattedData.maddeler?.length || 0,
      });

      return formattedData;
    } catch (error) {
      console.error('❌ İK task details hatası:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Get daily performance data
   */
  static async getDailyPerformance(req, res) {
    try {
      const { days = 30 } = req.query;
      const userId = req.user._id;

      console.log(
        `📈 ${req.user.ad} ${req.user.soyad} için günlük performans verileri hesaplanıyor...`,
      );

      const performanceData = await MyActivityHelpers.getDailyPerformance(
        userId,
        days,
      );

      res.json(performanceData);
    } catch (error) {
      console.error('❌ Günlük performans hatası:', error.message);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  }

  /**
   * Debug endpoint
   */
  static debugUser(req, res) {
    try {
      console.log('🐛 Debug endpoint çağrıldı');
      console.log('User:', req.user);

      res.json({
        message: 'User authenticated successfully',
        user: {
          id: req.user._id,
          ad: req.user.ad,
          soyad: req.user.soyad,
          kullaniciAdi: req.user.kullaniciAdi,
        },
      });
    } catch (error) {
      console.error('Debug endpoint hatası:', error);
      res.status(500).json({ message: 'Debug hatası' });
    }
  }

  /**
   * Get role-based ranking by scores
   */
  static async getRanking(req, res) {
    try {
      const currentUser = req.user;
      const { days = 30 } = req.query;

      console.log(
        `🏆 ${currentUser.ad} ${currentUser.soyad} için rol bazlı sıralama hesaplanıyor...`,
      );

      // Get users with same role
      const sameRoleUsers = await User.find({
        roller: { $in: currentUser.roller },
        aktif: true,
      }).select('ad soyad kullaniciAdi roller');

      console.log(
        `📊 ${currentUser.roller} rolü için ${sameRoleUsers.length} kullanıcı bulundu`,
      );

      // Calculate scores for each user
      const rankings = [];
      const userPromises = sameRoleUsers.map(async user => {
        try {
          // Get user summary data
          const userData = await MyActivityService.getUserSummary(
            user._id,
            days,
          );
          const scoresByCategory =
            MyActivityService.calculateScoresByCategory(userData);

          // Calculate total score
          const totalScore = Object.values(scoresByCategory).reduce(
            (sum, score) => sum + score,
            0,
          );
          const totalTasks =
            userData.checklistTasks.length +
            userData.workTasks.length +
            userData.qualityEvaluations.length +
            userData.hrScores.length;

          return {
            kullanici: {
              id: user._id,
              ad: user.ad,
              soyad: user.soyad,
              kullaniciAdi: user.kullaniciAdi,
              isCurrentUser: user._id.toString() === currentUser._id.toString(),
            },
            toplamPuan: totalScore,
            toplamGorev: totalTasks,
            kategorilerePuanlar: scoresByCategory,
            ortalamaPuan:
              totalTasks > 0 ? (totalScore / totalTasks).toFixed(1) : 0,
          };
        } catch (userError) {
          console.log(
            `⚠️ ${user.ad} ${user.soyad} için puan hesaplanamadı:`,
            userError.message,
          );
          // Add user with 0 score if calculation fails
          return {
            kullanici: {
              id: user._id,
              ad: user.ad,
              soyad: user.soyad,
              kullaniciAdi: user.kullaniciAdi,
              isCurrentUser: user._id.toString() === currentUser._id.toString(),
            },
            toplamPuan: 0,
            toplamGorev: 0,
            kategorilerePuanlar: {},
            ortalamaPuan: 0,
          };
        }
      });

      const rankingResults = await Promise.all(userPromises);
      rankings.push(...rankingResults);

      // Sort by total score (descending)
      rankings.sort((a, b) => b.toplamPuan - a.toplamPuan);

      // Add rank numbers
      rankings.forEach((ranking, index) => {
        ranking.sira = index + 1;
      });

      // Find current user's ranking
      const currentUserRanking = rankings.find(r => r.kullanici.isCurrentUser);

      console.log(
        `✅ Sıralama hazırlandı - ${rankings.length} kullanıcı, mevcut kullanıcı ${currentUserRanking?.sira || 'N/A'}. sırada`,
      );

      res.json({
        siralamalar: rankings,
        mevcutKullanici: currentUserRanking,
        toplamKullanici: rankings.length,
        tarihAraligi: {
          gunSayisi: parseInt(days),
          baslangic: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          bitis: new Date().toISOString().split('T')[0],
        },
      });
    } catch (error) {
      console.error('❌ Ranking hatası:', error.message);
      console.error('❌ Stack trace:', error.stack);
      res.status(500).json({
        message: 'Sunucu hatası',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Sunucu hatası',
      });
    }
  }

  /**
   * Get detailed score breakdown with filters
   */
  static async getScoreBreakdown(req, res) {
    try {
      const userId = req.user._id;
      const filters = req.query;

      console.log(
        `📊 ${req.user.ad} ${req.user.soyad} için puan breakdown getiriliyor...`,
      );

      // Get score breakdown data
      const breakdownData = await MyActivityHelpers.getScoreBreakdown(
        userId,
        filters,
      );

      // Format breakdown details
      const scoreBreakdown =
        MyActivityFormatters.formatScoreBreakdown(breakdownData);

      // Calculate statistics
      const stats = {
        toplamGorev: scoreBreakdown.length,
        toplamPuan: scoreBreakdown.reduce(
          (sum, item) => sum + (item.toplamPuan || 0),
          0,
        ),
        ortalamaPuan:
          scoreBreakdown.length > 0
            ? Math.round(
              scoreBreakdown.reduce(
                (sum, item) => sum + (item.toplamPuan || 0),
                0,
              ) / scoreBreakdown.length,
            )
            : 0,
        onaylananGorev: scoreBreakdown.filter(
          item => item.durum === 'onaylandi',
        ).length,
        bekleyenGorev: scoreBreakdown.filter(item => item.durum === 'beklemede')
          .length,
      };

      // Apply pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const skip = (page - 1) * limit;
      const toplamKayit = scoreBreakdown.length;
      const toplamSayfa = Math.ceil(toplamKayit / limit);
      const paginatedBreakdown = scoreBreakdown.slice(skip, skip + limit);

      console.log(
        `✅ ${scoreBreakdown.length} puan breakdown hazırlandı, ${paginatedBreakdown.length} gösteriliyor`,
      );

      res.json({
        scoreBreakdown: paginatedBreakdown,
        istatistikler: stats,
        sayfalama: {
          mevcutSayfa: page,
          toplamSayfa,
          toplamKayit,
          sayfaBoyutu: limit,
        },
      });
    } catch (error) {
      console.error('❌ Score breakdown hatası:', error.message);
      res.status(500).json({
        message: 'Sunucu hatası',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Sunucu hatası',
      });
    }
  }

  /**
   * Get monthly score totals by category - Aylık toplam puanları kategorize ederek getir
   */
  static async getMonthlyTotals(req, res) {
    try {
      const userId = req.user._id;
      const filters = req.query;

      console.log(
        `📅 ${req.user.ad} ${req.user.soyad} için aylık toplam puanları getiriliyor...`,
      );

      // Get monthly totals data
      const monthlyTotals = await MyActivityHelpers.getMonthlyScoreTotals(
        userId,
        filters,
      );

      console.log(
        `✅ ${monthlyTotals.donem.donemAdi} dönemi toplam puanları hazırlandı`,
      );

      res.json({
        success: true,
        data: monthlyTotals,
        kullanici: {
          id: req.user._id,
          ad: req.user.ad,
          soyad: req.user.soyad,
        },
      });
    } catch (error) {
      console.error('❌ Aylık toplam puanları hatası:', error.message);
      res.status(500).json({
        success: false,
        message: 'Sunucu hatası',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Sunucu hatası',
      });
    }
  }

  /**
   * Get Quality Control criteria breakdown
   */
  static async getQualityCriteriaBreakdown(req, res) {
    try {
      const userId = req.user._id;
      const { month, year } = req.query;

      console.log('🔬 Kalite kontrol madde bazlı puanlar isteniyor:', {
        userId: userId.toString(),
        month,
        year,
      });

      // Tarih aralığını belirle
      let dateFilter = {};
      if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(
          parseInt(year),
          parseInt(month),
          0,
          23,
          59,
          59,
        );
        dateFilter = {
          $or: [
            {
              createdAt: {
                $gte: startDate,
                $lte: endDate,
              },
            },
            {
              degerlendirmeTarihi: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          ],
        };
      } else {
        // Son 30 gün
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        dateFilter = {
          $or: [
            {
              createdAt: {
                $gte: startDate,
                $lte: endDate,
              },
            },
            {
              degerlendirmeTarihi: {
                $gte: startDate,
                $lte: endDate,
              },
            },
          ],
        };
      }

      // Kalite kontrol değerlendirmelerini çek
      const qualityEvaluations = await QualityControlEvaluation.find({
        degerlendirilenKullanici: userId,
        ...dateFilter,
      })
        .populate('sablon', 'ad aciklama kriterler')
        .populate('degerlendirenKullanici', 'ad soyad')
        .sort({ degerlendirmeTarihi: -1, createdAt: -1 });

      console.log(
        `📊 ${qualityEvaluations.length} kalite kontrol değerlendirmesi bulundu`,
      );

      // Madde bazında puanları topla
      const criteriaBreakdown = {};
      let totalEvaluations = 0;
      let totalScore = 0;
      let totalMaxScore = 0;

      qualityEvaluations.forEach(evaluation => {
        totalEvaluations++;

        if (evaluation.puanlamalar && evaluation.puanlamalar.length > 0) {
          evaluation.puanlamalar.forEach(puanlama => {
            const criteriaName = puanlama.maddeBaslik || 'Bilinmeyen Kriter';
            const score = puanlama.puan || 0;
            const maxScore = puanlama.maksimumPuan || 0;

            if (!criteriaBreakdown[criteriaName]) {
              criteriaBreakdown[criteriaName] = {
                criteriaName,
                totalScore: 0,
                totalMaxScore: 0,
                evaluationCount: 0,
                scores: [],
              };
            }

            criteriaBreakdown[criteriaName].totalScore += score;
            criteriaBreakdown[criteriaName].totalMaxScore += maxScore;
            criteriaBreakdown[criteriaName].evaluationCount++;
            criteriaBreakdown[criteriaName].scores.push({
              score,
              maxScore,
              evaluationId: evaluation._id,
              date: evaluation.degerlendirmeTarihi || evaluation.createdAt,
              evaluator: evaluation.degerlendirenKullanici
                ? `${evaluation.degerlendirenKullanici.ad} ${evaluation.degerlendirenKullanici.soyad}`
                : 'Bilinmeyen',
            });

            totalScore += score;
            totalMaxScore += maxScore;
          });
        }
      });

      // Sıralama - toplam puana göre büyükten küçüğe
      const sortedCriteria = Object.values(criteriaBreakdown).sort(
        (a, b) => b.totalScore - a.totalScore,
      );

      // Her kriter için yüzdelik başarı hesapla
      sortedCriteria.forEach(criteria => {
        criteria.successPercentage =
          criteria.totalMaxScore > 0
            ? Math.round((criteria.totalScore / criteria.totalMaxScore) * 100)
            : 0;
        criteria.averageScore =
          criteria.evaluationCount > 0
            ? Math.round(
              (criteria.totalScore / criteria.evaluationCount) * 100,
            ) / 100
            : 0;
      });

      const result = {
        criteria: sortedCriteria,
        summary: {
          totalEvaluations,
          totalCriteria: sortedCriteria.length,
          totalScore,
          totalMaxScore,
          overallSuccessPercentage:
            totalMaxScore > 0
              ? Math.round((totalScore / totalMaxScore) * 100)
              : 0,
          averageScore:
            totalEvaluations > 0
              ? Math.round((totalScore / totalEvaluations) * 100) / 100
              : 0,
        },
        dateRange: {
          month: month ? parseInt(month) : null,
          year: year ? parseInt(year) : null,
        },
      };

      console.log('✅ Kalite kontrol madde bazlı analiz tamamlandı:', {
        toplamKriter: result.summary.totalCriteria,
        toplamDegerlendirme: result.summary.totalEvaluations,
        genelBasari: result.summary.overallSuccessPercentage,
      });

      res.json(result);
    } catch (error) {
      console.error('❌ Kalite kontrol kriter analizi hatası:', error.message);
      console.error('❌ Stack trace:', error.stack);
      res.status(500).json({
        message: 'Sunucu hatası',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Sunucu hatası',
      });
    }
  }
}

module.exports = MyActivityController;
