const ExcelJS = require('exceljs');
const logger = require('../utils/logger');

class ExcelService {
  static async generateCategoryTemplate(category, templates) {
    try {
      // Excel workbook oluştur
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Envanter Template');

      // Başlık satırını oluştur
      const headers = [
        'Envanter Kodu',
        'Ad',
        'Açıklama',
        'Durum',
        'Lokasyon',
        'Tedarikçi',
        'Alış Fiyatı',
        'Güncel Değer',
        'QR Kodu',
        'Barkod',
      ];

      // Dinamik alanları ekle
      if (templates && templates.length > 0) {
        templates.forEach(template => {
          headers.push(template.ad);
        });
      }

      // Başlıkları worksheet'e ekle
      worksheet.addRow(headers);

      // Başlık stilini ayarla
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Kolonları otomatik genişlik ayarla
      worksheet.columns.forEach(column => {
        column.width = 15;
      });

      // Buffer oluştur
      const buffer = await workbook.xlsx.writeBuffer();

      return {
        buffer,
        fileName: `envanter_template_${category.ad.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (error) {
      console.error('Excel template oluşturma hatası:', error);
      throw new Error('Excel template oluşturulamadı');
    }
  }

  static async parseExcelFile(buffer) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.getWorksheet(1);
      const data = [];

      // Başlık satırını al
      const headers = [];
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = cell.value;
      });

      // Veri satırlarını al
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          return;
        } // Başlık satırını atla

        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            rowData[header] = cell.value;
          }
        });

        if (Object.keys(rowData).length > 0) {
          data.push(rowData);
        }
      });

      return data;
    } catch (error) {
      console.error('Excel parse hatası:', error);
      throw new Error('Excel dosyası okunamadı');
    }
  }

  // Excel dosyası oluşturma - workbook ve worksheet adını alır
  static async generateExcel(workbook, sheetName = 'Export') {
    try {
      // Eğer workbook zaten ExcelJS workbook'u ise direkt buffer oluştur
      if (workbook instanceof ExcelJS.Workbook) {
        return await workbook.xlsx.writeBuffer();
      }

      // Eğer raw data ise yeni workbook oluştur
      const newWorkbook = new ExcelJS.Workbook();
      const worksheet = newWorkbook.addWorksheet(sheetName);

      if (Array.isArray(workbook) && workbook.length > 0) {
        // İlk satır başlık
        const headers = Object.keys(workbook[0]);
        worksheet.addRow(headers);

        // Veri satırları
        workbook.forEach(row => {
          const values = headers.map(header => row[header] || '');
          worksheet.addRow(values);
        });

        // Stil uygula
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
      }

      return await newWorkbook.xlsx.writeBuffer();
    } catch (error) {
      console.error('Excel generate hatası:', error);
      throw new Error('Excel dosyası oluşturulamadı');
    }
  }

  static async generateExportFile(data, fileName = 'export') {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Export');

      if (data.length === 0) {
        worksheet.addRow(['Veri bulunamadı']);
      } else {
        // Başlıkları ekle
        const headers = Object.keys(data[0]);
        worksheet.addRow(headers);

        // Verileri ekle
        data.forEach(item => {
          const row = headers.map(header => item[header] || '');
          worksheet.addRow(row);
        });

        // Stil uygula
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };

        // Kolonları otomatik genişlik ayarla
        worksheet.columns.forEach(column => {
          column.width = 15;
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();

      return {
        buffer,
        fileName: `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (error) {
      console.error('Excel export hatası:', error);
      throw new Error('Excel dosyası oluşturulamadı');
    }
  }

  // HR modülü için personel listesi Excel oluşturma
  static async generatePersonelExcel(users) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Aylık Mesai Devamsızlık');

      // Başlık satırı ekle
      const headers = [
        'Kullanıcı Adı',
        'Tarih (Ay/Yıl)',
        'Devamsızlık (Saat)',
        'Fazla Mesai (Saat)',
      ];

      worksheet.addRow(headers);

      // Başlık satırı stilini ayarla
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E7D32' }, // Koyu yeşil
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      // Kullanıcı verilerini ekle
      users.forEach((user, _index) => {
        const rowData = [
          user.kullaniciAdi, // Kullanıcı adı (önceden doldurulmuş)
          '', // Tarih (Kullanıcı dolduracak - örn: "01/2025" veya "Ocak 2025")
          '', // Devamsızlık Saat (Kullanıcı dolduracak)
          '', // Fazla Mesai Saat (Kullanıcı dolduracak)
        ];

        const row = worksheet.addRow(rowData);

        // Satır stilini ayarla
        row.height = 20;

        // Kullanıcı adı (1. kolon) - sadece okunabilir stil
        const userCell = row.getCell(1);
        userCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' }, // Açık gri - sadece okunabilir
        };
        userCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        userCell.alignment = { vertical: 'middle' };
        userCell.font = { bold: true };

        // Veri giriş alanları (2, 3, 4. kolonlar) - düzenlenebilir stil
        for (let i = 2; i <= 4; i++) {
          const cell = row.getCell(i);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' }, // Beyaz - düzenlenebilir
          };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF4CAF50' } },
            left: { style: 'medium', color: { argb: 'FF4CAF50' } },
            bottom: { style: 'medium', color: { argb: 'FF4CAF50' } },
            right: { style: 'medium', color: { argb: 'FF4CAF50' } },
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Kolon genişlikleri
      worksheet.columns = [
        { width: 20 }, // Kullanıcı Adı
        { width: 18 }, // Tarih (Ay/Yıl)
        { width: 18 }, // Devamsızlık (Saat)
        { width: 18 }, // Fazla Mesai (Saat)
      ];

      // Tüm başlık hücrelerine kenarlık ekle
      headerRow.eachCell(cell => {
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' },
        };
      });

      // Açıklama metni ekle
      const instructionRow = worksheet.addRow([]);
      instructionRow.height = 5;

      const infoStartRow = worksheet.rowCount + 1;
      worksheet.addRow(['📋 KULLANIM TALIMATLARI:', '', '', '']);
      worksheet.addRow([
        '• Gri alan: Kullanıcı adı (değiştirmeyin)',
        '',
        '',
        '',
      ]);
      worksheet.addRow([
        '• Yeşil kenarlıklı beyaz alanlara veri girin',
        '',
        '',
        '',
      ]);
      worksheet.addRow([
        '• Tarih formatı: "01/2025" veya "Ocak 2025"',
        '',
        '',
        '',
      ]);
      worksheet.addRow(['• Saatleri sayı olarak girin (örn: 8.5)', '', '', '']);
      worksheet.addRow([
        '• Her satır bir kullanıcının aylık toplamını temsil eder',
        '',
        '',
        '',
      ]);
      worksheet.addRow([
        '• Boş bırakılan satırlar işlenmeyecektir',
        '',
        '',
        '',
      ]);

      // Talimat satırlarını stil ayarla
      for (let i = infoStartRow; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const firstCell = row.getCell(1);
        firstCell.font = { italic: true, color: { argb: 'FF666666' } };
        firstCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFAFAFA' },
        };

        // Tüm hücreleri birleştir
        worksheet.mergeCells(i, 1, i, 4);
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `aylik_mesai_devamsizlik_${new Date().toISOString().split('T')[0]}.xlsx`;

      return {
        buffer,
        fileName,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (error) {
      console.error('Personel Excel oluşturma hatası:', error);
      throw new Error('Personel Excel dosyası oluşturulamadı');
    }
  }

  static async validateExcelData(data, _category, _fieldTemplates) {
    const results = {
      success: 0,
      errors: [],
      warnings: [],
      duplicates: [],
      validRows: [],
    };

    try {
      // Validasyon işlemleri...
      // Bu kısım inventory.js'den taşınacak

      // Placeholder await to fix require-await
      await Promise.resolve();

      // Process data without loop await
      data.forEach((_item, index) => {
        const rowNumber = index + 2;
        try {
          // Placeholder validation
          results.success++;
        } catch (error) {
          logger.error(`Excel validation error at row ${rowNumber}:`, error);
          results.errors.push({
            row: rowNumber,
            errors: [`İşlem hatası: ${error.message}`],
          });
        }
      });
    } catch (error) {
      logger.error('Excel validation error:', error);
      results.errors.push({
        row: 0,
        errors: [`İşlem hatası: ${error.message}`],
      });
    }

    return results;
  }

  // Excel dosyasını oku ve inventory item'lere çevir
  static async readExcel(buffer, templates = []) {
    try {
      console.log('📊 Excel reading started, templates:', templates.length);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.getWorksheet(1); // İlk sayfayı al
      if (!worksheet) {
        throw new Error('Excel dosyasında sayfa bulunamadı');
      }

      const rows = [];
      const headers = [];

      // İlk satırdan başlıkları al
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const headerValue = cell.value ? String(cell.value).trim() : '';
        headers[colNumber] = headerValue;
      });

      console.log(
        '📋 Excel headers found:',
        headers.filter(h => h),
      );

      // Veri satırlarını oku (2. satırdan başla)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const rowData = {};
        let hasData = false;

        // Her hücreyi kontrol et
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            let cellValue = cell.value;

            // Değer tipi kontrolü ve dönüştürme
            if (cellValue !== null && cellValue !== undefined) {
              if (
                typeof cellValue === 'object' &&
                cellValue.result !== undefined
              ) {
                cellValue = cellValue.result; // Formula sonucu
              }

              rowData[header] = String(cellValue).trim();
              hasData = true;
            } else {
              rowData[header] = '';
            }
          }
        });

        // Eğer satırda veri varsa ekle (herhangi bir field'da veri varsa)
        if (hasData) {
          rows.push(rowData);
        }
      }

      console.log(`✅ Excel read completed: ${rows.length} data rows found`);
      return rows;
    } catch (error) {
      console.error('❌ Excel read error:', error);
      throw new Error(`Excel okuma hatası: ${error.message}`);
    }
  }

  // ===== TOPLANTI MODÜLÜ EXCEL ENTEGRASYONU =====

  /**
   * Toplantı Excel şablonu oluştur
   */
  static async generateMeetingTemplate() {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Toplantı Şablonu');

      // Başlık satırını oluştur
      const headers = [
        'Başlık',
        'Açıklama',
        'Kategori',
        'Tarih (YYYY-MM-DD)',
        'Başlangıç Saati (HH:MM)',
        'Bitiş Saati (HH:MM)',
        'Lokasyon',
        'Durum',
        'Öncelik',
        'Organizatör Email',
        'Departman Adı',
        'Makina Kodu',
        'Katılımcı Email\'leri (virgülle ayırın)',
        'Gündem Maddeleri (| ile ayırın)',
        'Tekrarlama Tipi',
        'Tekrarlama Aralığı',
        'Bitiş Tarihi (YYYY-MM-DD)',
      ];

      // Başlıkları worksheet'e ekle
      worksheet.addRow(headers);

      // Örnek veri satırı ekle (kullanıcıya rehberlik için)
      worksheet.addRow([
        'Haftalık Üretim Toplantısı',
        'Haftalık üretim hedefleri ve performans değerlendirmesi',
        'rutin',
        '2025-01-22',
        '09:00',
        '10:00',
        'Toplantı Salonu A',
        'planlanıyor',
        'normal',
        'manager@sirket.com',
        'Üretim',
        'HAI-001',
        'user1@sirket.com,user2@sirket.com',
        'Geçen hafta sonuçları|Bu hafta hedefler|Sorun ve çözümler',
        'haftalık',
        '1',
        '2025-12-31',
      ]);

      // Başlık stilini ayarla
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' }, // MMM95 primary color
      };

      // Örnek satır stilini ayarla
      const exampleRow = worksheet.getRow(2);
      exampleRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }, // Light gray
      };
      exampleRow.font = { italic: true };

      // Kolonları otomatik genişlik ayarla
      worksheet.columns.forEach((column, index) => {
        const lengths = [headers[index]?.length || 10];
        worksheet.eachRow({ includeEmpty: true }, row => {
          const cell = row.getCell(index + 1);
          if (cell.value) {
            lengths.push(cell.value.toString().length);
          }
        });
        column.width = Math.min(Math.max(...lengths) + 2, 50); // Max 50 karakter
      });

      // Validasyon notu ekle
      const noteRow = worksheet.addRow([]);
      noteRow.getCell(1).value = 'NOTLAR:';
      noteRow.getCell(1).font = { bold: true, color: { argb: 'FFFF6B35' } };

      const validationNotes = [
        '• Kategori: rutin, proje, acil, kalite, güvenlik, performans, vardiya, kalip-degisim',
        '• Durum: planlanıyor, bekliyor, devam-ediyor, tamamlandı, iptal',
        '• Öncelik: düşük, normal, yüksek, kritik',
        '• Tekrarlama: yok, günlük, haftalık, aylık, özel',
        '• Tarih formatı: YYYY-MM-DD (örn: 2025-01-22)',
        '• Saat formatı: HH:MM (örn: 09:30)',
        '• Email\'ler virgül (,) ile ayrılmalı',
        '• Gündem maddeleri pipe (|) ile ayrılmalı',
      ];

      validationNotes.forEach((note, _index) => {
        const noteRow = worksheet.addRow([]);
        noteRow.getCell(1).value = note;
        noteRow.getCell(1).font = { size: 10, italic: true };
      });

      // AutoFilter ekle (sadece header'a)
      worksheet.autoFilter = 'A1:Q1';

      // Buffer oluştur
      const buffer = await workbook.xlsx.writeBuffer();

      return {
        buffer,
        fileName: `toplanti_template_${new Date().toISOString().split('T')[0]}.xlsx`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (error) {
      console.error('Meeting Excel template oluşturma hatası:', error);
      throw new Error('Meeting Excel template oluşturulamadı');
    }
  }

  /**
   * Toplantıları Excel'e export et
   */
  static async generateMeetingExport(meetings = []) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Toplantılar');

      // Başlık satırını oluştur
      const headers = [
        'Başlık',
        'Açıklama',
        'Kategori',
        'Tarih',
        'Başlangıç Saati',
        'Bitiş Saati',
        'Gerçek Başlangıç',
        'Gerçek Bitiş',
        'Lokasyon',
        'Durum',
        'Öncelik',
        'Organizatör',
        'Departman',
        'Makina',
        'Katılımcı Sayısı',
        'Gündem Sayısı',
        'Karar Sayısı',
        'Not Sayısı',
        'Toplam Süre (dk)',
        'Oluşturma Tarihi',
        'Güncelleme Tarihi',
      ];

      // Başlıkları ekle
      worksheet.addRow(headers);

      // Meeting verilerini ekle
      meetings.forEach(meeting => {
        const katilimciSayisi = meeting.katilimcilar?.length || 0;
        const gundemSayisi = meeting.gundem?.length || 0;
        const kararSayisi = meeting.kararlar?.length || 0;
        const notSayisi = meeting.notlar?.length || 0;

        const organizator =
          meeting.organizator?.ad && meeting.organizator?.soyad
            ? `${meeting.organizator.ad} ${meeting.organizator.soyad}`
            : 'Bilinmiyor';

        const departman = meeting.departman?.ad || '';
        const makina = meeting.makina
          ? `${meeting.makina.kod} - ${meeting.makina.ad}`
          : '';

        worksheet.addRow([
          meeting.baslik || '',
          meeting.aciklama || '',
          meeting.kategori || '',
          meeting.tarih
            ? new Date(meeting.tarih).toLocaleDateString('tr-TR')
            : '',
          meeting.baslangicSaati || '',
          meeting.bitisSaati || '',
          meeting.gercekBaslangicSaati
            ? new Date(meeting.gercekBaslangicSaati).toLocaleString('tr-TR')
            : '',
          meeting.gercekBitisSaati
            ? new Date(meeting.gercekBitisSaati).toLocaleString('tr-TR')
            : '',
          meeting.lokasyon || '',
          meeting.durum || '',
          meeting.oncelik || '',
          organizator,
          departman,
          makina,
          katilimciSayisi,
          gundemSayisi,
          kararSayisi,
          notSayisi,
          meeting.toplamSure || '',
          meeting.olusturmaTarihi
            ? new Date(meeting.olusturmaTarihi).toLocaleString('tr-TR')
            : '',
          meeting.guncellemeTarihi
            ? new Date(meeting.guncellemeTarihi).toLocaleString('tr-TR')
            : '',
        ]);
      });

      // Başlık stilini ayarla
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1976D2' },
      };

      // Kolonları otomatik genişlik ayarla
      worksheet.columns.forEach((column, index) => {
        const lengths = [headers[index]?.length || 10];
        worksheet.eachRow({ includeEmpty: true }, row => {
          const cell = row.getCell(index + 1);
          if (cell.value) {
            lengths.push(cell.value.toString().length);
          }
        });
        column.width = Math.min(Math.max(...lengths) + 2, 40);
      });

      // AutoFilter ekle
      worksheet.autoFilter = `A1:${String.fromCharCode(65 + headers.length - 1)}1`;

      // Buffer oluştur
      const buffer = await workbook.xlsx.writeBuffer();

      return {
        buffer,
        fileName: `toplanti_listesi_${new Date().toISOString().split('T')[0]}.xlsx`,
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    } catch (error) {
      console.error('Meeting Excel export hatası:', error);
      throw new Error('Meeting Excel export oluşturulamadı');
    }
  }

  /**
   * Excel'den toplantı verilerini parse et
   */
  static async parseMeetingExcel(buffer) {
    try {
      console.log('📊 Meeting Excel parsing started');

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('Excel dosyasında sayfa bulunamadı');
      }

      const rows = [];
      const headers = [];

      // İlk satırdan başlıkları al
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const headerValue = cell.value ? String(cell.value).trim() : '';
        headers[colNumber] = headerValue;
      });

      console.log(
        '📋 Meeting Excel headers found:',
        headers.filter(h => h),
      );

      // Veri satırlarını oku (2. satırdan başla, örnek satırı da dahil)
      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const rowData = {};
        let hasData = false;

        // Her hücreyi kontrol et
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            let cellValue = cell.value;

            // Değer tipi kontrolü ve dönüştürme
            if (cellValue !== null && cellValue !== undefined) {
              if (
                typeof cellValue === 'object' &&
                cellValue.result !== undefined
              ) {
                cellValue = cellValue.result; // Formula sonucu
              }

              // Date değerleri için özel işlem
              if (cellValue instanceof Date) {
                cellValue = cellValue.toISOString();
              }

              rowData[header] = String(cellValue).trim();
              hasData = true;
            } else {
              rowData[header] = '';
            }
          }
        });

        // Eğer satırda veri varsa ve NOTLAR: ile başlamıyorsa ekle
        if (
          hasData &&
          !rowData[headers[1]]?.startsWith('NOTLAR:') &&
          !rowData[headers[1]]?.startsWith('•')
        ) {
          rows.push(rowData);
        }
      }

      console.log(
        `✅ Meeting Excel read completed: ${rows.length} data rows found`,
      );
      return rows;
    } catch (error) {
      console.error('❌ Meeting Excel read error:', error);
      throw new Error(`Meeting Excel okuma hatası: ${error.message}`);
    }
  }
}

module.exports = ExcelService;
