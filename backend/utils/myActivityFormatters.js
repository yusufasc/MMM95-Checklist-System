// Model imports removed as they are not used in formatter functions

/**
 * MyActivity Data Formatters
 * Utility functions for formatting response data
 */
class MyActivityFormatters {
  /**
   * Format combined activities for detailed view
   */
  static formatDetailedActivities(
    checklistTasks,
    workTasks,
    qualityEvaluations,
    hrScores,
    bonusEvaluations,
    controlPendingTasks,
    controlScores = [], // ControlScore kayıtları
    kalipDegisimEvaluations = [], // KalipDegisimEvaluation kayıtları
    userId = null, // User context for buddy detection
  ) {
    // Kalıp değişim evaluation ID'lerini topla (duplicate prevention için)
    const kalipDegisimIds = new Set();
    kalipDegisimEvaluations.forEach(evaluation => {
      kalipDegisimIds.add(evaluation._id.toString());
    });

    // Debug: ID'leri logla
    console.log(
      '🔍 Kalıp değişim evaluation ID\'leri:',
      Array.from(kalipDegisimIds),
    );
    console.log('🔍 Bonus evaluations sayısı:', bonusEvaluations.length);
    if (bonusEvaluations.length > 0) {
      console.log(
        '🔍 Bonus evaluation ID\'leri:',
        bonusEvaluations.map(e => e._id.toString()),
      );
    }

    // Combine and add type information
    const allActivities = [
      // Checklist tasks
      ...checklistTasks.map(task => ({
        ...task.toObject(),
        tip: 'checklist',
        kategoriRengi: '#1976d2',
        gorevAdi: task.checklist?.ad || 'Rutin Checklist',
        kategori: task.checklist?.kategori || 'Genel',
        tarih: task.tamamlanmaTarihi,
        puan: task.kontrolToplamPuani || task.toplamPuan || 0,
      })),

      // Work tasks (kendi yaptığı + buddy olduğu görevler)
      ...workTasks.map(task => {
        // Buddy logic: Eğer current user buddy ise bu bir buddy görevi
        const isBuddy =
          task.kalipDegisimBuddy &&
          task.kalipDegisimBuddy._id &&
          userId &&
          task.kalipDegisimBuddy._id.toString() === userId.toString();

        return {
          ...task.toObject(),
          tip: 'worktask',
          kategoriRengi: isBuddy ? '#FF6B6B' : '#9c27b0', // Buddy için farklı renk
          gorevAdi: `${task.checklist?.ad || 'İşe Bağlı Görev'}${isBuddy ? ' (Buddy)' : ''}`,
          kategori: isBuddy ? 'İşe Bağlı (Buddy)' : 'İşe Bağlı',
          tarih: task.tamamlanmaTarihi,
          puan: task.kontrolToplamPuani || task.toplamPuan || 0,
          // Buddy bilgileri
          isBuddy: isBuddy,
          anaKullanici: task.kullanici
            ? {
              ad: task.kullanici.ad,
              soyad: task.kullanici.soyad,
              kullaniciAdi: task.kullanici.kullaniciAdi,
            }
            : null,
          buddyKullanici: task.kalipDegisimBuddy
            ? {
              ad: task.kalipDegisimBuddy.ad,
              soyad: task.kalipDegisimBuddy.soyad,
              kullaniciAdi: task.kalipDegisimBuddy.kullaniciAdi,
            }
            : null,
          // WorkTask özel alanları - Resimde görünen tüm bilgiler
          makina: task.makina,
          indirilenKalip: task.indirilenKalip,
          yazılanKalip: task.baglananHamade, // baglananHamade frontend'de yazılanKalip olarak gösteriliyor
          baglananHamade: task.baglananHamade,
          makinaDurmaSaati: task.makinaDurmaSaati,
          yeniKalipAktifSaati: task.yeniKalipAktifSaati,
          aciklama: task.aciklama,
        };
      }),

      // Quality evaluations
      ...qualityEvaluations.map(evaluation => ({
        _id: evaluation._id,
        tip: 'quality_control',
        kategoriRengi: '#9C27B0',
        gorevAdi: evaluation.sablon?.ad || 'Kalite Kontrol Değerlendirmesi',
        kategori: 'Kalite Kontrol',
        tarih: evaluation.degerlendirmeTarihi || evaluation.createdAt,
        tamamlanmaTarihi:
          evaluation.degerlendirmeTarihi || evaluation.createdAt,
        durum: evaluation.durum === 'Tamamlandı' ? 'tamamlandi' : 'taslak',
        puan: evaluation.toplamPuan || 0,
        kontrolToplamPuani: evaluation.toplamPuan || 0,
        checklist: {
          ad: evaluation.sablon?.ad || 'Kalite Kontrol',
          kategori: 'Kalite Kontrol',
          aciklama: evaluation.sablon?.aciklama || '',
          maddeler: evaluation.puanlamalar || [],
        },
        makina: evaluation.makina
          ? {
            ad: evaluation.makina.ad || evaluation.makina.envanterKodu,
            makinaNo: evaluation.makina.envanterKodu,
            envanterKodu: evaluation.makina.envanterKodu,
          }
          : null,
        puanlayanKullanici: evaluation.degerlendirenKullanici
          ? {
            ad: evaluation.degerlendirenKullanici.ad,
            soyad: evaluation.degerlendirenKullanici.soyad,
          }
          : null,
        onaylayan: evaluation.degerlendirenKullanici
          ? {
            ad: evaluation.degerlendirenKullanici.ad,
            soyad: evaluation.degerlendirenKullanici.soyad,
          }
          : null,
        kontrolTarihi: evaluation.degerlendirmeTarihi || evaluation.createdAt,
        // Kalite kontrol özel alanları
        kalip: evaluation.kalip,
        hammadde: evaluation.hammadde,
        vardiya: evaluation.vardiya,
        notlar: evaluation.notlar,
        basariYuzdesi: evaluation.basariYuzdesi,
      })),

      // HR scores - Her checklist puanlaması için ayrı aktivite
      ...this.formatHRActivities(hrScores),

      // Bonus evaluations (kalıp değişim evaluations ile çakışmayanlar)
      ...bonusEvaluations
        .filter(evaluation => {
          // Eğer bu evaluation kalıp değişim evaluations'da da varsa, duplicate'i önle
          return !kalipDegisimIds.has(evaluation._id.toString());
        })
        .map(evaluation => ({
          _id: `bonus_eval_${evaluation._id}`, // Benzersiz prefix eklendi
          tip: 'bonus_evaluation',
          kategoriRengi: '#E91E63',
          gorevAdi: evaluation.sablon?.ad || 'Bonus Değerlendirmesi',
          kategori: `Bonus - ${evaluation.sablon?.bonusKategorisi || 'Genel'}`,
          tarih: evaluation.degerlendirmeTarihi,
          tamamlanmaTarihi: evaluation.degerlendirmeTarihi,
          durum: 'tamamlandi',
          puan: evaluation.toplamPuan || 0,
          kontrolToplamPuani: evaluation.toplamPuan || 0,
          checklist: {
            ad: evaluation.sablon?.ad || 'Bonus Değerlendirmesi',
            kategori: 'Bonus',
            aciklama: `Bonus kategorisi: ${evaluation.sablon?.bonusKategorisi || 'Genel'}`,
            maddeler: evaluation.puanlamalar || [],
          },
          puanlayanKullanici: evaluation.degerlendirenKullanici
            ? {
              ad: evaluation.degerlendirenKullanici.ad,
              soyad: evaluation.degerlendirenKullanici.soyad,
            }
            : null,
          onaylayan: evaluation.degerlendirenKullanici
            ? {
              ad: evaluation.degerlendirenKullanici.ad,
              soyad: evaluation.degerlendirenKullanici.soyad,
            }
            : null,
          kontrolTarihi: evaluation.degerlendirmeTarihi,
          // Bonus özel alanları
          bonusKategorisi: evaluation.sablon?.bonusKategorisi,
          bonusKatsayisi: evaluation.sablon?.bonusKatsayisi,
          minimumBasariYuzdesi: evaluation.sablon?.minimumBasariYuzdesi,
          basariYuzdesi: evaluation.basariYuzdesi,
          bonusHakEdilenMi:
            evaluation.basariYuzdesi >=
            (evaluation.sablon?.minimumBasariYuzdesi || 70),
          departman: evaluation.departman,
          notlar: evaluation.notlar,
        })),

      // Control pending tasks (puanlanmış görevler)
      ...controlPendingTasks.map(task => ({
        ...task.toObject(),
        tip: 'control_pending',
        kategoriRengi: '#673AB7',
        gorevAdi: `${task.checklist?.ad || 'Kontrol Görevi'} (Puanlandı)`,
        kategori: 'Kontrol Puanları',
        tarih: task.kontrolTarihi || task.tamamlanmaTarihi,
        puan: task.kontrolToplamPuani || task.toplamPuan || 0,
        // Control pending özel marker
        isPuanlandi: true,
        kontrolDurumu: 'onaylandi',
      })),

      // Control scores (puanlama yapan kişinin kontrol puanları)
      ...controlScores.map(score => ({
        _id: score._id,
        tip: 'control_score',
        kategoriRengi: '#FF5722',
        gorevAdi: `Kontrol Puanı: ${score.sablonAdi}`,
        kategori: 'Kontrol Puanları',
        tarih: score.puanlamaTarihi,
        tamamlanmaTarihi: score.puanlamaTarihi,
        durum: 'tamamlandi',
        puan: score.kontrolPuani || 0,
        kontrolToplamPuani: score.kontrolPuani || 0,
        // ControlScore özel alanları
        puanlananKullanici: score.puanlananKullanici,
        gorevTipi: score.gorevTipi,
        aciklama: score.aciklama || `${score.gorevTipi} puanlaması`,
        sablonAdi: score.sablonAdi,
      })),

      // Kalıp Değişim evaluations (benzersiz ID'lerle)
      ...this.formatKalipDegisimEvaluations(kalipDegisimEvaluations, userId),
    ];

    // Sort by completion date
    allActivities.sort(
      (a, b) =>
        new Date(b.tarih || b.tamamlanmaTarihi).getTime() -
        new Date(a.tarih || a.tamamlanmaTarihi).getTime(),
    );

    return allActivities;
  }

  /**
   * Format HR scores as activities
   */
  static formatHRActivities(hrScores) {
    const hrActivities = [];

    hrScores.forEach(hrScore => {
      // Checklist evaluations
      if (hrScore.checklistPuanlari && hrScore.checklistPuanlari.length > 0) {
        hrScore.checklistPuanlari.forEach(puanlama => {
          // Şablon detaylarını hazırla
          const sablonDetaylari =
            puanlama.madde?.detaylar?.map((detay, index) => ({
              maddeId: detay.maddeId,
              baslik: detay.baslik || `Madde ${index + 1}`,
              puan: detay.puan || 0,
              maksimumPuan: detay.maksimumPuan || 0,
              aciklama: detay.aciklama || '',
              sira: index + 1,
            })) || [];

          hrActivities.push({
            _id: `hr_checklist_${hrScore._id}_${puanlama._id}`,
            tip: 'hr_checklist',
            kategoriRengi: '#FF6B6B',
            gorevAdi: puanlama.sablon?.ad || 'İK Checklist Değerlendirmesi',
            kategori: 'İK Değerlendirmesi',
            tarih: puanlama.tarih,
            tamamlanmaTarihi: puanlama.tarih,
            durum: 'tamamlandi',
            puan: puanlama.madde?.puan || 0,
            kontrolToplamPuani: puanlama.madde?.puan || 0,
            checklist: {
              ad: puanlama.sablon?.ad || 'İK Checklist',
              kategori: 'İK',
              aciklama: puanlama.sablon?.aciklama || '',
              maddeler: puanlama.madde ? [puanlama.madde] : [],
            },
            puanlayanKullanici: {
              ad: 'İK',
              soyad: 'Departmanı',
            },
            onaylayan: {
              ad: 'İK',
              soyad: 'Departmanı',
            },
            kontrolTarihi: puanlama.tarih,
            // İK özel alanları
            maksimumPuan: puanlama.madde?.maksimumPuan || 0,
            aciklama: puanlama.aciklama || '',
            // Şablon madde detayları
            sablonDetaylari: sablonDetaylari,
            puanlar: {
              toplam: puanlama.madde?.puan || 0,
              maksimum: puanlama.madde?.maksimumPuan || 0,
            },
            degerlendiren: puanlama.degerlendiren
              ? {
                _id: puanlama.degerlendiren,
              }
              : null,
            periyot: puanlama.periyot || 'aylik',
            notlar: puanlama.notlar || '',
          });
        });
      }

      // Mesai kayıtları
      if (hrScore.mesaiKayitlari && hrScore.mesaiKayitlari.length > 0) {
        hrScore.mesaiKayitlari.forEach(mesai => {
          hrActivities.push({
            _id: `hr_mesai_${hrScore._id}_${mesai._id}`,
            tip: 'hr_mesai',
            kategoriRengi: '#FFA726',
            gorevAdi: 'Mesai Değerlendirmesi',
            kategori: 'İK - Mesai',
            tarih: mesai.tarih,
            tamamlanmaTarihi: mesai.tarih,
            durum: 'tamamlandi',
            puan: mesai.puan || 0,
            kontrolToplamPuani: mesai.puan || 0,
            checklist: {
              ad: 'Mesai Değerlendirmesi',
              kategori: 'İK',
              aciklama: 'Mesai saatleri değerlendirmesi',
              maddeler: [],
            },
            puanlayanKullanici: {
              ad: 'İK',
              soyad: 'Departmanı',
            },
            onaylayan: {
              ad: 'İK',
              soyad: 'Departmanı',
            },
            kontrolTarihi: mesai.tarih,
            // Mesai özel alanları
            mesaiSaati: mesai.saat,
            mesaiTipi: 'Normal Mesai',
            aciklama: `İK Mesai Değerlendirmesi (+${mesai.puan} puan)`,
          });
        });
      }

      // Devamsızlık kayıtları
      if (
        hrScore.devamsizlikKayitlari &&
        hrScore.devamsizlikKayitlari.length > 0
      ) {
        hrScore.devamsizlikKayitlari.forEach(devamsizlik => {
          hrActivities.push({
            _id: `hr_devamsizlik_${hrScore._id}_${devamsizlik._id}`,
            tip: 'hr_devamsizlik',
            kategoriRengi: '#EF5350',
            gorevAdi: 'Devamsızlık Değerlendirmesi',
            kategori: 'İK - Devamsızlık',
            tarih: devamsizlik.tarih,
            tamamlanmaTarihi: devamsizlik.tarih,
            durum: 'tamamlandi',
            puan: devamsizlik.puan || 0,
            kontrolToplamPuani: devamsizlik.puan || 0,
            checklist: {
              ad: 'Devamsızlık Değerlendirmesi',
              kategori: 'İK',
              aciklama: 'Devamsızlık durumu değerlendirmesi',
              maddeler: [],
            },
            puanlayanKullanici: {
              ad: 'İK',
              soyad: 'Departmanı',
            },
            onaylayan: {
              ad: 'İK',
              soyad: 'Departmanı',
            },
            kontrolTarihi: devamsizlik.tarih,
            // Devamsızlık özel alanları
            devamsizlikTipi: devamsizlik.tur,
            gunSayisi: devamsizlik.miktar,
            aciklama: `İK Devamsızlık Değerlendirmesi (${devamsizlik.puan} puan)`,
          });
        });
      }
    });

    return hrActivities;
  }

  /**
   * Format score details for response
   */
  static formatScoreDetails(data, startDate, endDate) {
    const {
      scoredChecklistTasks,
      scoredWorkTasks,
      qualityEvaluations,
      hrScores,
      bonusEvaluations,
      controlScores,
      kalipDegisimEvaluations,
    } = data;

    const scoreDetails = [
      // Format checklist tasks
      ...scoredChecklistTasks.map(task => {
        const maksimumPuan =
          task.checklist?.maddeler?.reduce((toplam, madde) => {
            return toplam + (madde.puan || 0);
          }, 0) || 0;

        return {
          id: task._id,
          tip: 'checklist',
          checklistAdi: task.checklist?.ad || 'Bilinmeyen Checklist',
          kategori: task.checklist?.kategori || 'Genel',
          makina: task.makina
            ? `${task.makina.ad} (${task.makina.makinaNo})`
            : 'Makina Yok',
          tamamlanmaTarihi: task.tamamlanmaTarihi,
          durum: task.durum,
          puanlar: {
            maksimum: maksimumPuan,
            alinan: task.kontrolToplamPuani || 0,
            toplam: task.kontrolToplamPuani || 0,
          },
          puanlayanKullanici: task.puanlayanKullanici
            ? {
              ad: task.puanlayanKullanici.ad,
              soyad: task.puanlayanKullanici.soyad,
            }
            : null,
          onaylayan: task.onaylayan
            ? {
              ad: task.onaylayan.ad,
              soyad: task.onaylayan.soyad,
            }
            : null,
          puanlamaTarihi: task.kontrolTarihi || task.onayTarihi || null,
          aciklama: task.checklist?.aciklama || '',
          kategoriRengi:
            task.checklist?.kategori === 'IK'
              ? '#FF6B6B'
              : task.checklist?.kategori === 'Kalite'
                ? '#45B7D1'
                : '#96CEB4',
        };
      }),

      // Format work tasks (kendi yaptığı + buddy olduğu görevler)
      ...scoredWorkTasks.map(task => {
        const maksimumPuan =
          task.checklist?.maddeler?.reduce((toplam, madde) => {
            return toplam + (madde.puan || 0);
          }, 0) || 0;

        const isBuddy = task.kalipDegisimBuddy && task.kalipDegisimBuddy._id;

        return {
          id: task._id,
          tip: 'worktask',
          checklistAdi: `${task.checklist?.ad || 'İşe Bağlı Görev'}${isBuddy ? ' (Buddy)' : ''}`,
          kategori: isBuddy ? 'İşe Bağlı (Buddy)' : 'İşe Bağlı',
          makina: task.makina
            ? `${task.makina.ad} (${task.makina.envanterKodu})`
            : 'Makina Yok',
          kalip: task.indirilenKalip
            ? `${task.indirilenKalip.ad} (${task.indirilenKalip.envanterKodu})`
            : null,
          hamade: task.baglananHamade
            ? `${task.baglananHamade.ad} (${task.baglananHamade.envanterKodu})`
            : null,
          tamamlanmaTarihi: task.tamamlanmaTarihi,
          durum: task.durum,
          puanlar: {
            maksimum: maksimumPuan,
            alinan: task.kontrolToplamPuani || 0,
            toplam: task.kontrolToplamPuani || 0,
          },
          puanlayanKullanici: task.puanlayanKullanici
            ? {
              ad: task.puanlayanKullanici.ad,
              soyad: task.puanlayanKullanici.soyad,
            }
            : null,
          onaylayan: task.onaylayanKullanici
            ? {
              ad: task.onaylayanKullanici.ad,
              soyad: task.onaylayanKullanici.soyad,
            }
            : null,
          puanlamaTarihi: task.kontrolTarihi || task.onayTarihi || null,
          aciklama: task.checklist?.aciklama || '',
          kategoriRengi: isBuddy ? '#FF6B6B' : '#FECA57', // Buddy için farklı renk
          // Buddy bilgileri
          isBuddy: isBuddy,
          anaKullanici: task.kullanici
            ? {
              ad: task.kullanici.ad,
              soyad: task.kullanici.soyad,
              kullaniciAdi: task.kullanici.kullaniciAdi,
            }
            : null,
          buddyKullanici: task.kalipDegisimBuddy
            ? {
              ad: task.kalipDegisimBuddy.ad,
              soyad: task.kalipDegisimBuddy.soyad,
              kullaniciAdi: task.kalipDegisimBuddy.kullaniciAdi,
            }
            : null,
        };
      }),

      // Format quality evaluations
      ...qualityEvaluations.map(evaluation => ({
        id: evaluation._id,
        tip: 'quality_control',
        checklistAdi: evaluation.sablon?.ad || 'Kalite Kontrol Değerlendirmesi',
        kategori: 'Kalite Kontrol',
        makina: evaluation.makina
          ? `${evaluation.makina.ad || evaluation.makina.envanterKodu}`
          : 'Kalite Kontrol',
        kalip: evaluation.kalip
          ? `${evaluation.kalip.ad || evaluation.kalip.envanterKodu}`
          : null,
        hammadde: evaluation.hammadde || null,
        vardiya: evaluation.vardiya || null,
        tamamlanmaTarihi:
          evaluation.degerlendirmeTarihi || evaluation.createdAt,
        durum: evaluation.durum === 'Tamamlandı' ? 'tamamlandi' : 'taslak',
        puanlar: {
          maksimum: evaluation.maksimumPuan || 0,
          alinan: evaluation.toplamPuan || 0,
          toplam: evaluation.toplamPuan || 0,
        },
        puanlayanKullanici: evaluation.degerlendirenKullanici
          ? {
            ad: evaluation.degerlendirenKullanici.ad,
            soyad: evaluation.degerlendirenKullanici.soyad,
          }
          : null,
        onaylayan: evaluation.degerlendirenKullanici
          ? {
            ad: evaluation.degerlendirenKullanici.ad,
            soyad: evaluation.degerlendirenKullanici.soyad,
          }
          : null,
        puanlamaTarihi: evaluation.degerlendirmeTarihi || evaluation.createdAt,
        aciklama:
          evaluation.sablon?.aciklama || 'Kalite kontrol değerlendirmesi',
        notlar: evaluation.notlar || null,
        basariYuzdesi: evaluation.basariYuzdesi || 0,
        kategoriRengi: '#9C27B0',
        sablonDetaylari: evaluation.puanlamalar || [],
      })),

      // Format HR scores
      ...this.formatHRScores(hrScores, startDate, endDate),

      // Format bonus evaluations
      ...this.formatBonusEvaluations(bonusEvaluations || []),

      // Format control scores
      ...(controlScores || []).map(score => ({
        id: score._id,
        tip: 'control_score',
        checklistAdi: `Kontrol Puanı: ${score.sablonAdi}`,
        kategori: 'Kontrol Puanları',
        makina: 'Kontrol Puanı',
        tamamlanmaTarihi: score.puanlamaTarihi,
        durum: 'tamamlandi',
        puanlar: {
          maksimum: 0, // ControlScore'da maksimum puan yok
          alinan: score.kontrolPuani || 0,
          toplam: score.kontrolPuani || 0,
        },
        puanlayanKullanici: null, // Kendisi puanlama yapan
        onaylayan: null,
        puanlamaTarihi: score.puanlamaTarihi,
        aciklama: score.aciklama || `${score.gorevTipi} puanlaması`,
        kategoriRengi: '#FF5722',
        // ControlScore özel alanları
        puanlananKullanici: score.puanlananKullanici,
        gorevTipi: score.gorevTipi,
        sablonAdi: score.sablonAdi,
      })),

      // Format Kalıp Değişim evaluations
      ...this.formatKalipDegisimScoreDetails(kalipDegisimEvaluations || []),
    ];

    // Sort by date
    scoreDetails.sort(
      (a, b) =>
        new Date(b.tamamlanmaTarihi).getTime() -
        new Date(a.tamamlanmaTarihi).getTime(),
    );

    return scoreDetails;
  }

  /**
   * Format HR scores for response
   */
  static formatHRScores(hrScores, startDate, endDate) {
    const hrEvaluations = [];

    hrScores.forEach(hrScore => {
      // Checklist evaluations
      if (hrScore.checklistPuanlari && hrScore.checklistPuanlari.length > 0) {
        hrScore.checklistPuanlari.forEach(puanlama => {
          if (puanlama.tarih >= startDate && puanlama.tarih <= endDate) {
            console.log('📋 HR Checklist Puanlama Formatlanıyor:', {
              sablonAd: puanlama.sablon?.ad,
              maddePuan: puanlama.madde?.puan,
              maddeMaksimumPuan: puanlama.madde?.maksimumPuan,
              tarih: puanlama.tarih,
              detaylarSayisi: puanlama.madde?.detaylar?.length || 0,
            });

            hrEvaluations.push({
              id: `hr_checklist_${hrScore._id}_${puanlama.tarih.getTime()}`,
              tip: 'hr_checklist',
              checklistAdi: puanlama.sablon?.ad || 'İK Şablon Değerlendirmesi',
              kategori: 'İK Şablon',
              makina: 'İK Değerlendirmesi',
              tamamlanmaTarihi: puanlama.tarih,
              durum: 'tamamlandi',
              puanlar: {
                maksimum: puanlama.madde?.maksimumPuan || 0,
                alinan: puanlama.madde?.puan || 0,
                toplam: puanlama.madde?.puan || 0,
              },
              puanlayanKullanici: {
                ad: 'İK',
                soyad: 'Departmanı',
              },
              onaylayan: {
                ad: 'İK',
                soyad: 'Departmanı',
              },
              puanlamaTarihi: puanlama.tarih,
              aciklama:
                puanlama.sablon?.aciklama || 'İK şablon değerlendirmesi',
              kategoriRengi: '#E91E63',
              sablonDetaylari:
                puanlama.madde?.detaylar?.map((detay, index) => ({
                  maddeId: detay.maddeId,
                  baslik: detay.baslik || `Madde ${index + 1}`,
                  puan: detay.puan || 0,
                  maksimumPuan: detay.maksimumPuan || 0,
                  aciklama: detay.aciklama || '',
                  sira: index + 1,
                })) || [],
            });
          }
        });
      }

      // Overtime records
      if (hrScore.mesaiKayitlari && hrScore.mesaiKayitlari.length > 0) {
        hrScore.mesaiKayitlari.forEach(mesai => {
          if (mesai.tarih >= startDate && mesai.tarih <= endDate) {
            hrEvaluations.push({
              id: `hr_mesai_${hrScore._id}_${mesai.tarih.getTime()}`,
              tip: 'hr_mesai',
              checklistAdi: 'Mesai Puanlaması',
              kategori: 'İK Mesai',
              makina: 'İK Değerlendirmesi',
              tamamlanmaTarihi: mesai.tarih,
              durum: 'tamamlandi',
              puanlar: {
                maksimum: mesai.puan || 0,
                alinan: mesai.puan || 0,
                toplam: mesai.puan || 0,
              },
              puanlayanKullanici: {
                ad: 'İK',
                soyad: 'Departmanı',
              },
              onaylayan: {
                ad: 'İK',
                soyad: 'Departmanı',
              },
              puanlamaTarihi: mesai.tarih,
              aciklama: `İK Mesai Değerlendirmesi (+${mesai.puan} puan)`,
              kategoriRengi: '#FF5722',
            });
          }
        });
      }

      // Absence records
      if (
        hrScore.devamsizlikKayitlari &&
        hrScore.devamsizlikKayitlari.length > 0
      ) {
        hrScore.devamsizlikKayitlari.forEach(devamsizlik => {
          if (devamsizlik.tarih >= startDate && devamsizlik.tarih <= endDate) {
            hrEvaluations.push({
              id: `hr_devamsizlik_${hrScore._id}_${devamsizlik.tarih.getTime()}`,
              tip: 'hr_devamsizlik',
              checklistAdi: 'Devamsızlık Puanlaması',
              kategori: 'İK Devamsızlık',
              makina: 'İK Değerlendirmesi',
              tamamlanmaTarihi: devamsizlik.tarih,
              durum: 'tamamlandi',
              puanlar: {
                maksimum: Math.abs(devamsizlik.puan || 0),
                alinan: devamsizlik.puan || 0,
                toplam: devamsizlik.puan || 0,
              },
              puanlayanKullanici: {
                ad: 'İK',
                soyad: 'Departmanı',
              },
              onaylayan: {
                ad: 'İK',
                soyad: 'Departmanı',
              },
              puanlamaTarihi: devamsizlik.tarih,
              aciklama: `İK Devamsızlık Değerlendirmesi (${devamsizlik.puan} puan)`,
              kategoriRengi: '#795548',
            });
          }
        });
      }
    });

    return hrEvaluations;
  }

  /**
   * Format Kalıp Değişim evaluations for detailed activities
   */
  static formatKalipDegisimEvaluations(kalipDegisimEvaluations, userId) {
    const formattedEvaluations = [];

    kalipDegisimEvaluations.forEach(evaluation => {
      // Ana çalışan puanı
      if (
        evaluation.anaCalisan &&
        evaluation.anaCalisan._id.toString() === userId.toString()
      ) {
        formattedEvaluations.push({
          _id: `kalip_degisim_main_${evaluation._id}`,
          tip: 'bonus_evaluation',
          kategoriRengi: '#4CAF50',
          gorevAdi: `${evaluation.checklistTemplate?.ad || 'Kalıp Değişim'} (Ana Çalışan)`,
          kategori: 'Kalıp Değişim - Ana Çalışan',
          tarih: evaluation.degerlendirmeTarihi,
          tamamlanmaTarihi: evaluation.degerlendirmeTarihi,
          durum: 'tamamlandi',
          puan: evaluation.anaCalısanToplamPuan || 0,
          kontrolToplamPuani: evaluation.anaCalısanToplamPuan || 0,
          checklist: {
            ad: evaluation.checklistTemplate?.ad || 'Kalıp Değişim',
            kategori: 'Kalıp Değişim',
            aciklama:
              evaluation.checklistTemplate?.aciklama ||
              'Kalıp değişim değerlendirmesi',
            maddeler: evaluation.maddeler || [],
          },
          puanlayanKullanici: evaluation.degerlendiren
            ? {
              ad: evaluation.degerlendiren.ad,
              soyad: evaluation.degerlendiren.soyad,
            }
            : null,
          onaylayan: evaluation.degerlendiren
            ? {
              ad: evaluation.degerlendiren.ad,
              soyad: evaluation.degerlendiren.soyad,
            }
            : null,
          kontrolTarihi: evaluation.degerlendirmeTarihi,
          // Kalıp Değişim özel alanları
          workTask: evaluation.workTask,
          rol: 'Ana Çalışan',
          degerlendirmeTipi: evaluation.degerlendirmeTipi,
          genelYorum: evaluation.genelYorum,
          toplamPuan: evaluation.anaCalısanToplamPuan || 0,
          maksimumPuan: evaluation.maxToplamPuan || 100,
          basariYuzdesi:
            evaluation.maxToplamPuan > 0
              ? Math.round(
                (evaluation.anaCalısanToplamPuan / evaluation.maxToplamPuan) *
                    100,
              )
              : 0,
        });
      }

      // Buddy puanı
      if (
        evaluation.buddyCalisan &&
        evaluation.buddyCalisan._id.toString() === userId.toString()
      ) {
        formattedEvaluations.push({
          _id: `kalip_degisim_buddy_${evaluation._id}`,
          tip: 'bonus_evaluation',
          kategoriRengi: '#FF9800',
          gorevAdi: `${evaluation.checklistTemplate?.ad || 'Kalıp Değişim'} (Buddy)`,
          kategori: 'Kalıp Değişim - Buddy',
          tarih: evaluation.degerlendirmeTarihi,
          tamamlanmaTarihi: evaluation.degerlendirmeTarihi,
          durum: 'tamamlandi',
          puan: evaluation.buddyToplamPuan || 0,
          kontrolToplamPuani: evaluation.buddyToplamPuan || 0,
          checklist: {
            ad: evaluation.checklistTemplate?.ad || 'Kalıp Değişim',
            kategori: 'Kalıp Değişim',
            aciklama:
              evaluation.checklistTemplate?.aciklama ||
              'Kalıp değişim değerlendirmesi (Buddy)',
            maddeler: evaluation.maddeler || [],
          },
          puanlayanKullanici: evaluation.degerlendiren
            ? {
              ad: evaluation.degerlendiren.ad,
              soyad: evaluation.degerlendiren.soyad,
            }
            : null,
          onaylayan: evaluation.degerlendiren
            ? {
              ad: evaluation.degerlendiren.ad,
              soyad: evaluation.degerlendiren.soyad,
            }
            : null,
          kontrolTarihi: evaluation.degerlendirmeTarihi,
          // Kalıp Değişim özel alanları
          workTask: evaluation.workTask,
          rol: 'Buddy',
          degerlendirmeTipi: evaluation.degerlendirmeTipi,
          genelYorum: evaluation.genelYorum,
          toplamPuan: evaluation.buddyToplamPuan || 0,
          maksimumPuan: evaluation.maxToplamPuan || 100,
          basariYuzdesi:
            evaluation.maxToplamPuan > 0
              ? Math.round(
                (evaluation.buddyToplamPuan / evaluation.maxToplamPuan) * 100,
              )
              : 0,
        });
      }
    });

    return formattedEvaluations;
  }

  /**
   * Format Kalıp Değişim evaluations for score details
   */
  static formatKalipDegisimScoreDetails(kalipDegisimEvaluations) {
    const scoreDetails = [];

    kalipDegisimEvaluations.forEach(evaluation => {
      // Ana çalışan puanı
      if (evaluation.anaCalısanToplamPuan !== undefined) {
        scoreDetails.push({
          id: `kalip_degisim_main_${evaluation._id}`, // Benzersiz prefix eklendi
          tip: 'bonus_evaluation',
          checklistAdi: evaluation.checklistTemplate?.ad || 'Kalıp Değişim',
          kategori: 'Kalıp Değişim - Ana Çalışan',
          makina: evaluation.workTask?.makina?.ad || 'Makina Bilgisi Yok',
          tamamlanmaTarihi: evaluation.degerlendirmeTarihi,
          durum: 'tamamlandi',
          puanlar: {
            maksimum: evaluation.maxToplamPuan || 100,
            alinan: evaluation.anaCalısanToplamPuan || 0,
            toplam: evaluation.anaCalısanToplamPuan || 0,
          },
          puanlayanKullanici: evaluation.degerlendiren
            ? {
              ad: evaluation.degerlendiren.ad,
              soyad: evaluation.degerlendiren.soyad,
            }
            : null,
          onaylayan: evaluation.degerlendiren
            ? {
              ad: evaluation.degerlendiren.ad,
              soyad: evaluation.degerlendiren.soyad,
            }
            : null,
          puanlamaTarihi: evaluation.degerlendirmeTarihi,
          aciklama:
            evaluation.checklistTemplate?.aciklama ||
            'Kalıp değişim değerlendirmesi',
          kategoriRengi: '#4CAF50',
          // Kalıp Değişim özel alanları
          rol: 'Ana Çalışan',
          degerlendirmeTipi: evaluation.degerlendirmeTipi,
          genelYorum: evaluation.genelYorum,
          basariYuzdesi:
            evaluation.maxToplamPuan > 0
              ? Math.round(
                (evaluation.anaCalısanToplamPuan / evaluation.maxToplamPuan) *
                    100,
              )
              : 0,
          workTask: evaluation.workTask,
          // Bonus evaluation uyumluluğu için ek alanlar
          sablon: evaluation.checklistTemplate,
          toplamPuan: evaluation.anaCalısanToplamPuan || 0,
          maksimumPuan: evaluation.maxToplamPuan || 100,
          degerlendirmeTarihi: evaluation.degerlendirmeTarihi,
          degerlendirenKullanici: evaluation.degerlendiren,
          notlar: evaluation.genelYorum,
          puanlamalar: evaluation.maddeler || [],
        });
      }

      // Buddy puanı
      if (evaluation.buddyToplamPuan !== undefined) {
        scoreDetails.push({
          id: `kalip_degisim_buddy_${evaluation._id}`, // Benzersiz prefix eklendi
          tip: 'bonus_evaluation',
          checklistAdi: `${evaluation.checklistTemplate?.ad || 'Kalıp Değişim'} (Buddy)`,
          kategori: 'Kalıp Değişim - Buddy',
          makina: evaluation.workTask?.makina?.ad || 'Makina Bilgisi Yok',
          tamamlanmaTarihi: evaluation.degerlendirmeTarihi,
          durum: 'tamamlandi',
          puanlar: {
            maksimum: evaluation.maxToplamPuan || 100,
            alinan: evaluation.buddyToplamPuan || 0,
            toplam: evaluation.buddyToplamPuan || 0,
          },
          puanlayanKullanici: evaluation.degerlendiren
            ? {
              ad: evaluation.degerlendiren.ad,
              soyad: evaluation.degerlendiren.soyad,
            }
            : null,
          onaylayan: evaluation.degerlendiren
            ? {
              ad: evaluation.degerlendiren.ad,
              soyad: evaluation.degerlendiren.soyad,
            }
            : null,
          puanlamaTarihi: evaluation.degerlendirmeTarihi,
          aciklama:
            evaluation.checklistTemplate?.aciklama ||
            'Kalıp değişim değerlendirmesi (Buddy)',
          kategoriRengi: '#FF9800',
          // Kalıp Değişim özel alanları
          rol: 'Buddy',
          degerlendirmeTipi: evaluation.degerlendirmeTipi,
          genelYorum: evaluation.genelYorum,
          basariYuzdesi:
            evaluation.maxToplamPuan > 0
              ? Math.round(
                (evaluation.buddyToplamPuan / evaluation.maxToplamPuan) * 100,
              )
              : 0,
          workTask: evaluation.workTask,
          // Bonus evaluation uyumluluğu için ek alanlar
          sablon: evaluation.checklistTemplate,
          toplamPuan: evaluation.buddyToplamPuan || 0,
          maksimumPuan: evaluation.maxToplamPuan || 100,
          degerlendirmeTarihi: evaluation.degerlendirmeTarihi,
          degerlendirenKullanici: evaluation.degerlendiren,
          notlar: evaluation.genelYorum,
          puanlamalar: evaluation.maddeler || [],
        });
      }
    });

    return scoreDetails;
  }

  /**
   * Format bonus evaluations for response
   */
  static formatBonusEvaluations(bonusEvaluations) {
    return bonusEvaluations.map(evaluation => ({
      id: evaluation._id,
      tip: 'bonus_evaluation',
      checklistAdi: evaluation.sablon?.ad || 'Bonus Değerlendirmesi',
      kategori: evaluation.sablon?.bonusKategorisi || 'Genel Bonus',
      makina: 'Bonus Değerlendirmesi',
      tamamlanmaTarihi: evaluation.degerlendirmeTarihi,
      durum: 'tamamlandi',
      puanlar: {
        maksimum: evaluation.maksimumPuan || 100,
        alinan: evaluation.toplamPuan || 0,
        toplam: evaluation.toplamPuan || 0,
      },
      puanlayanKullanici: evaluation.degerlendirenKullanici
        ? {
          ad: evaluation.degerlendirenKullanici.ad,
          soyad: evaluation.degerlendirenKullanici.soyad,
        }
        : null,
      onaylayan: evaluation.degerlendirenKullanici
        ? {
          ad: evaluation.degerlendirenKullanici.ad,
          soyad: evaluation.degerlendirenKullanici.soyad,
        }
        : null,
      puanlamaTarihi: evaluation.degerlendirmeTarihi,
      aciklama: evaluation.sablon?.aciklama || 'Bonus değerlendirmesi',
      kategoriRengi: '#E91E63',
      // Bonus-specific fields
      degerlendirmeTarihi: evaluation.degerlendirmeTarihi,
      degerlendirenKullanici: evaluation.degerlendirenKullanici,
      departman: evaluation.departman,
      sablon: evaluation.sablon,
      basariYuzdesi: evaluation.basariYuzdesi || 0,
      notlar: evaluation.notlar || null,
      toplamPuan: evaluation.toplamPuan || 0,
      maksimumPuan: evaluation.maksimumPuan || 100,
      // ⭐ Bu en önemli kısım - madde detayları
      puanlamalar: evaluation.puanlamalar || [],
    }));
  }

  /**
   * Format WorkTask details for response
   */
  static formatWorkTaskDetails(workTask) {
    const maddeler =
      workTask.checklist?.maddeler?.map((madde, index) => {
        const cevap = workTask.maddeler?.[index];
        return {
          soru: madde.soru,
          puan: madde.puan || 0,
          maxPuan: madde.puan || 0, // Frontend compatibility
          cevap: cevap?.cevap || 'Cevaplanmadı',
          alinanPuan: cevap?.alinanPuan || 0,
          yorum: cevap?.yorum || '',
          resim: cevap?.resim || null,
          kontrolYorumu: cevap?.kontrolYorumu || '',
          kontrolPuani: cevap?.kontrolPuani || 0,
          sira: index + 1, // Frontend needs this
        };
      }) || [];

    const isBuddy =
      workTask.kalipDegisimBuddy && workTask.kalipDegisimBuddy._id;

    return {
      id: workTask._id,
      tip: 'worktask',
      checklistAdi: `${workTask.checklist?.ad || 'İşe Bağlı Görev'}${isBuddy ? ' (Buddy)' : ''}`,
      kategori: isBuddy ? 'İşe Bağlı (Buddy)' : 'İşe Bağlı',
      aciklama: workTask.checklist?.aciklama || '',
      kullanici: workTask.kullanici
        ? {
          ad: workTask.kullanici.ad,
          soyad: workTask.kullanici.soyad,
          kullaniciAdi: workTask.kullanici.kullaniciAdi,
        }
        : null,
      makina: workTask.makina
        ? `${workTask.makina.ad} (${workTask.makina.envanterKodu})`
        : 'Makina Yok',
      indirilenKalip: workTask.indirilenKalip
        ? {
          ad: workTask.indirilenKalip.ad,
          envanterKodu: workTask.indirilenKalip.envanterKodu,
          dinamikAlanlar: workTask.indirilenKalip.dinamikAlanlar,
        }
        : null,
      baglananHamade: workTask.baglananHamade
        ? {
          ad: workTask.baglananHamade.ad,
          envanterKodu: workTask.baglananHamade.envanterKodu,
          dinamikAlanlar: workTask.baglananHamade.dinamikAlanlar,
        }
        : null,
      olusturulmaTarihi: workTask.createdAt,
      tamamlanmaTarihi: workTask.tamamlanmaTarihi,
      onayTarihi: workTask.onayTarihi,
      kontrolTarihi: workTask.kontrolTarihi,
      durum: workTask.durum,
      onaylayanKullanici: workTask.onaylayanKullanici
        ? {
          ad: workTask.onaylayanKullanici.ad,
          soyad: workTask.onaylayanKullanici.soyad,
        }
        : null,
      // Buddy bilgileri
      isBuddy: isBuddy,
      anaKullanici: workTask.kullanici
        ? {
          ad: workTask.kullanici.ad,
          soyad: workTask.kullanici.soyad,
          kullaniciAdi: workTask.kullanici.kullaniciAdi,
        }
        : null,
      buddyKullanici: workTask.kalipDegisimBuddy
        ? {
          ad: workTask.kalipDegisimBuddy.ad,
          soyad: workTask.kalipDegisimBuddy.soyad,
          kullaniciAdi: workTask.kalipDegisimBuddy.kullaniciAdi,
        }
        : null,
      maddeler,
      toplamPuan: maddeler.reduce((toplam, madde) => toplam + madde.puan, 0),
      alinanPuan: maddeler.reduce(
        (toplam, madde) => toplam + madde.alinanPuan,
        0,
      ),
      kontrolToplamPuani: workTask.kontrolToplamPuani || 0,
      basariYuzdesi:
        workTask.kontrolToplamPuani && maddeler.length > 0
          ? Math.round(
            (workTask.kontrolToplamPuani /
                maddeler.reduce((toplam, madde) => toplam + madde.puan, 0)) *
                100,
          )
          : 0,
    };
  }

  /**
   * Format task details for response
   */
  static formatTaskDetails(task) {
    return {
      id: task._id,
      tip: 'checklist',
      checklistAdi: task.checklist.ad,
      kategori: task.checklist.kategori,
      aciklama: task.checklist.aciklama || '',
      kullanici: task.kullanici
        ? {
          ad: task.kullanici.ad,
          soyad: task.kullanici.soyad,
          kullaniciAdi: task.kullanici.kullaniciAdi,
        }
        : null,
      makina: task.makina
        ? `${task.makina.ad} (${task.makina.makinaNo})`
        : 'Makina Yok',
      durum: task.durum,
      tamamlanmaTarihi: task.tamamlanmaTarihi,
      onayTarihi: task.onayTarihi,
      kontrolTarihi: task.kontrolTarihi,
      onaylayan: task.onaylayan
        ? {
          ad: task.onaylayan.ad,
          soyad: task.onaylayan.soyad,
        }
        : null,
      kontroleden: task.kontroleden
        ? {
          ad: task.kontroleden.ad,
          soyad: task.kontroleden.soyad,
        }
        : null,
      toplamPuan: task.toplamPuan || 0,
      kontrolToplamPuani: task.kontrolToplamPuani || 0,
      maddeler: task.maddeler.map((madde, index) => ({
        sira: index + 1,
        soru: madde.soru,
        cevap: madde.cevap,
        kendiPuani: 0, // No self-scoring anymore
        maxPuan: madde.maxPuan || 0,
        kontrolPuani: madde.kontrolPuani || 0,
        yorum: madde.yorum || '',
        kontrolYorumu: madde.kontrolYorumu || '',
        resimUrl: madde.resimUrl || '',
        kontrolResimUrl: madde.kontrolResimUrl || '',
        toplamPuan: madde.kontrolPuani || 0,
      })),
    };
  }

  /**
   * Format HR task details
   */
  static formatHRTaskDetails(taskId, type, evaluation) {
    console.log('🔧 formatHRTaskDetails çağrıldı:', {
      taskId,
      type,
      evaluation,
    });

    const baseDetails = {
      id: taskId,
      tip: `hr_${type}`,
      durum: 'tamamlandi',
      tamamlanmaTarihi: evaluation.tarih,
      puanlamaTarihi: evaluation.tarih,
      puanlayanKullanici: {
        ad: 'İK',
        soyad: 'Departmanı',
      },
    };

    if (type === 'checklist') {
      const evaluationPuan = evaluation.madde?.puan || evaluation.puan || 0;
      const evaluationMaxPuan =
        evaluation.madde?.maksimumPuan || Math.abs(evaluationPuan) || 0;

      // Madde detaylarını dahil et
      const maddeDetaylari =
        evaluation.madde?.detaylar?.map((detay, index) => ({
          sira: index + 1,
          soru: detay.baslik || `Madde ${index + 1}`,
          cevap: 'Değerlendirildi',
          kontrolPuani: detay.puan || 0,
          maxPuan: detay.maksimumPuan || 0,
          kontrolYorumu: detay.aciklama || '',
          toplamPuan: detay.puan || 0,
          maddeId: detay.maddeId,
          baslik: detay.baslik,
          aciklama: detay.aciklama,
        })) || [];

      // Eğer madde detayları yoksa genel değerlendirme ekle
      const maddeler =
        maddeDetaylari.length > 0
          ? maddeDetaylari
          : [
            {
              sira: 1,
              soru:
                  evaluation.madde?.baslik ||
                  evaluation.sablon?.ad ||
                  'İK Değerlendirmesi',
              cevap: 'Değerlendirildi',
              kontrolPuani: evaluationPuan,
              maxPuan: evaluationMaxPuan,
              kontrolYorumu:
                  evaluation.madde?.aciklama || evaluation.aciklama || '',
              toplamPuan: evaluationPuan,
              periyot: 'aylik',
            },
          ];

      return {
        ...baseDetails,
        checklistAdi: evaluation.sablon?.ad || 'İK Şablon Değerlendirmesi',
        kategori: 'İK Checklist',
        aciklama: evaluation.aciklama || '',
        puanlar: {
          toplamPuan: evaluationPuan,
          kontrolToplamPuani: evaluationPuan,
          genelToplam: evaluationPuan,
        },
        maddeler: maddeler,
        sablonDetaylari: maddeDetaylari,
        notlar: evaluation.notlar || '',
        periyot: evaluation.periyot || 'aylik',
      };
    } else if (type === 'mesai') {
      const mesaiPuan = evaluation.puan || 0;

      return {
        ...baseDetails,
        checklistAdi: 'Mesai Puanlaması',
        kategori: 'İK Mesai',
        aciklama: evaluation.aciklama || '',
        puanlar: {
          toplamPuan: mesaiPuan,
          kontrolToplamPuani: mesaiPuan,
          genelToplam: mesaiPuan,
        },
        maddeler: [
          {
            sira: 1,
            soru: 'Mesai Saati',
            cevap: `${evaluation.saat || 0} saat (Normal Mesai)`,
            kontrolPuani: mesaiPuan,
            maxPuan: Math.abs(mesaiPuan),
            kontrolYorumu: evaluation.aciklama || '',
            toplamPuan: mesaiPuan,
          },
        ],
      };
    } else if (type === 'devamsizlik') {
      const devamsizlikPuan = evaluation.puan || 0;

      return {
        ...baseDetails,
        checklistAdi: 'Devamsızlık Puanlaması',
        kategori: 'İK Devamsızlık',
        aciklama: evaluation.aciklama || '',
        puanlar: {
          toplamPuan: devamsizlikPuan,
          kontrolToplamPuani: devamsizlikPuan,
          genelToplam: devamsizlikPuan,
        },
        maddeler: [
          {
            sira: 1,
            soru: 'Devamsızlık Durumu',
            cevap: `${evaluation.miktar || 0} ${evaluation.tur === 'tam_gun' ? 'gün' : 'saat'} (${evaluation.tur === 'tam_gun' ? 'Tam Gün' : 'Saatlik'})`,
            kontrolPuani: devamsizlikPuan,
            maxPuan: Math.abs(devamsizlikPuan),
            kontrolYorumu: evaluation.aciklama || '',
            toplamPuan: devamsizlikPuan,
          },
        ],
      };
    }

    // Fallback
    return {
      ...baseDetails,
      checklistAdi: 'İK Değerlendirmesi',
      kategori: 'İK',
      aciklama: evaluation.aciklama || '',
      puanlar: {
        toplamPuan: evaluation.puan || 0,
        kontrolToplamPuani: evaluation.puan || 0,
        genelToplam: evaluation.puan || 0,
      },
      maddeler: [
        {
          sira: 1,
          soru: 'İK Değerlendirmesi',
          cevap: 'Değerlendirildi',
          kontrolPuani: evaluation.puan || 0,
          maxPuan: Math.abs(evaluation.puan || 0),
          kontrolYorumu: evaluation.aciklama || '',
          toplamPuan: evaluation.puan || 0,
        },
      ],
    };
  }

  /**
   * Format Quality Control evaluation details
   */
  static formatQualityEvaluationDetails(qualityEvaluation) {
    return {
      id: qualityEvaluation._id,
      tip: 'quality_control',
      checklistAdi:
        qualityEvaluation.sablon?.ad || 'Kalite Kontrol Değerlendirmesi',
      kategori: 'Kalite Kontrol',
      durum: 'tamamlandi',
      tamamlanmaTarihi: qualityEvaluation.createdAt,
      puanlamaTarihi: qualityEvaluation.createdAt,
      puanlar: {
        toplamPuan: qualityEvaluation.toplamPuan || 0,
        kontrolToplamPuani: qualityEvaluation.toplamPuan || 0,
        genelToplam: qualityEvaluation.toplamPuan || 0,
      },
      puanlayanKullanici: qualityEvaluation.degerlendirenKullanici
        ? {
          ad: qualityEvaluation.degerlendirenKullanici.ad,
          soyad: qualityEvaluation.degerlendirenKullanici.soyad,
        }
        : null,
      maddeler: (qualityEvaluation.puanlamalar || []).map(
        (puanlama, index) => ({
          sira: index + 1,
          soru: puanlama.maddeBaslik || '',
          cevap: 'Değerlendirildi',
          kontrolPuani: puanlama.puan || 0,
          maxPuan: puanlama.maksimumPuan || 0,
          kontrolYorumu: puanlama.aciklama || '',
          toplamPuan: puanlama.puan || 0,
          resimUrl: puanlama.fotograflar?.[0] || '',
        }),
      ),
    };
  }

  /**
   * Format general statistics
   */
  static formatGeneralStats(data, scoresByCategory, days) {
    const {
      checklistTasks,
      workTasks,
      qualityEvaluations,
      hrScores,
      controlScores,
    } = data;

    const hrTotalScore = hrScores.reduce((total, hrScore) => {
      return (
        total +
        (hrScore.checklistPuanlari?.length || 0) +
        (hrScore.mesaiKayitlari?.length || 0) +
        (hrScore.devamsizlikKayitlari?.length || 0)
      );
    }, 0);

    const toplamGorevSayisi =
      checklistTasks.length +
      workTasks.length +
      qualityEvaluations.length +
      hrTotalScore +
      controlScores.length;

    const tamamlananGorevSayisi =
      checklistTasks.filter(
        t => t.durum === 'tamamlandi' || t.durum === 'onaylandi',
      ).length +
      workTasks.filter(t => t.durum === 'tamamlandi').length +
      qualityEvaluations.length +
      hrTotalScore +
      controlScores.length; // Kontrol puanları tamamlanmış sayılır

    const bekleyenGorevSayisi =
      checklistTasks.filter(t => t.durum === 'bekliyor').length +
      workTasks.filter(t => t.durum === 'bekliyor').length;

    const toplamPuan = Object.values(scoresByCategory).reduce(
      (sum, cat) => sum + cat.puan,
      0,
    );

    return {
      toplamGorevSayisi,
      tamamlananGorevSayisi,
      bekleyenGorevSayisi,
      iseBagliGorevSayisi: workTasks.length,
      toplamPuan,
      gunlukOrtalama: Math.round(toplamPuan / parseInt(days)),
    };
  }

  /**
   * Format score breakdown for detailed view
   */
  static formatScoreBreakdown(data) {
    const { checklistTasks, workTasks, qualityEvaluations } = data;

    const breakdown = [
      // Format checklist tasks
      ...checklistTasks.map(task => {
        const maksimumPuan =
          task.checklist?.maddeler?.reduce((toplam, madde) => {
            return toplam + (madde.puan || 0);
          }, 0) || 0;

        return {
          _id: task._id,
          tip: 'checklist',
          gorevTarihi: task.tamamlanmaTarihi,
          checklistAdi: task.checklist?.ad || 'Bilinmeyen Checklist',
          makinaAdi: task.makina
            ? `${task.makina.ad} (${task.makina.makinaNo})`
            : 'Makina Yok',
          toplamPuan: task.kontrolToplamPuani || 0,
          maxPuan: maksimumPuan,
          durum: task.durum,
          onaylayanBirim: task.onaylayan
            ? `${task.onaylayan.ad} ${task.onaylayan.soyad}`
            : 'Onaylanmamış',
          onaylayanKisi: task.puanlayanKullanici
            ? `${task.puanlayanKullanici.ad} ${task.puanlayanKullanici.soyad}`
            : 'Puanlanmamış',
          maddeler: (task.maddeler || []).map((madde, index) => ({
            maddeId: index + 1,
            soru: madde.soru || '',
            alinanPuan: madde.kontrolPuani || 0,
            maxPuan: madde.maxPuan || 0,
            kontrolYorumu: madde.kontrolYorumu || '',
            kontrolTarihi: task.kontrolTarihi || task.tamamlanmaTarihi,
          })),
        };
      }),

      // Format work tasks
      ...workTasks.map(task => {
        const maksimumPuan =
          task.checklist?.maddeler?.reduce((toplam, madde) => {
            return toplam + (madde.puan || 0);
          }, 0) || 0;

        return {
          _id: task._id,
          tip: 'worktask',
          gorevTarihi: task.tamamlanmaTarihi,
          checklistAdi: task.checklist?.ad || 'İşe Bağlı Görev',
          makinaAdi: task.makina
            ? `${task.makina.ad} (${task.makina.envanterKodu})`
            : 'Makina Yok',
          toplamPuan: task.kontrolToplamPuani || 0,
          maxPuan: maksimumPuan,
          durum: task.durum,
          onaylayanBirim: task.onaylayanKullanici
            ? `${task.onaylayanKullanici.ad} ${task.onaylayanKullanici.soyad}`
            : 'Onaylanmamış',
          onaylayanKisi: task.puanlayanKullanici
            ? `${task.puanlayanKullanici.ad} ${task.puanlayanKullanici.soyad}`
            : 'Puanlanmamış',
          kalipBilgisi: task.indirilenKalip
            ? `${task.indirilenKalip.ad} (${task.indirilenKalip.envanterKodu})`
            : null,
          maddeler: (task.maddeler || []).map((madde, index) => ({
            maddeId: index + 1,
            soru: madde.soru || '',
            alinanPuan: madde.kontrolPuani || 0,
            maxPuan: madde.maxPuan || 0,
            kontrolYorumu: madde.kontrolYorumu || '',
            kontrolTarihi: task.kontrolTarihi || task.tamamlanmaTarihi,
          })),
        };
      }),

      // Format quality evaluations
      ...qualityEvaluations.map(evaluation => ({
        _id: evaluation._id,
        tip: 'quality_control',
        gorevTarihi: evaluation.createdAt,
        checklistAdi: evaluation.sablon?.ad || 'Kalite Kontrol Değerlendirmesi',
        makinaAdi: 'Kalite Kontrol Değerlendirmesi',
        toplamPuan: evaluation.toplamPuan || 0,
        maxPuan: evaluation.maksimumPuan || 0,
        durum: 'onaylandi',
        onaylayanBirim: 'Kalite Kontrol Departmanı',
        onaylayanKisi: evaluation.degerlendirenKullanici
          ? `${evaluation.degerlendirenKullanici.ad} ${evaluation.degerlendirenKullanici.soyad}`
          : 'Kalite Kontrol',
        maddeler: (evaluation.puanlamalar || []).map((puanlama, index) => ({
          maddeId: index + 1,
          soru: puanlama.maddeBaslik || '',
          alinanPuan: puanlama.puan || 0,
          maxPuan: puanlama.maksimumPuan || 0,
          kontrolYorumu: puanlama.aciklama || '',
          kontrolTarihi: evaluation.createdAt,
        })),
      })),
    ];

    // Sort by date (newest first)
    breakdown.sort(
      (a, b) =>
        new Date(b.gorevTarihi).getTime() - new Date(a.gorevTarihi).getTime(),
    );

    return breakdown;
  }
}

module.exports = MyActivityFormatters;
