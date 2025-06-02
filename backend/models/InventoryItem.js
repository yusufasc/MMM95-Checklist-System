const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  kategoriId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryCategory',
    required: true,
  },
  envanterKodu: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  ad: {
    type: String,
    required: true,
    trim: true,
  },
  aciklama: {
    type: String,
    trim: true,
  },

  // Dinamik alanlar - fieldTemplate'e göre doldurulur
  dinamikAlanlar: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Durum ve lokasyon bilgileri
  durum: {
    type: String,
    enum: ['aktif', 'bakim', 'arizali', 'hurda', 'yedek', 'kirada'],
    default: 'aktif',
  },
  lokasyon: {
    type: String,
    trim: true,
  },
  departman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  sorumluKisi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Fotoğraflar ve belgeler
  resimler: [
    {
      url: String,
      aciklama: String,
      yuklemeTarihi: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  belgeler: [
    {
      ad: String,
      url: String,
      tip: String,
      boyut: Number,
      yuklemeTarihi: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Maliyet bilgileri
  alisFiyati: {
    type: Number,
    default: 0,
  },
  guncelDeger: {
    type: Number,
    default: 0,
  },
  amortismanOrani: {
    type: Number,
    default: 0,
  },
  tedarikci: {
    type: String,
    trim: true,
  },
  garantiBitisTarihi: {
    type: Date,
  },

  // Bakım ve onarım bilgileri (bakım modülü entegrasyonu için)
  sonBakimTarihi: {
    type: Date,
  },
  sonrakiBakimTarihi: {
    type: Date,
  },
  bakimPeriyodu: {
    type: Number, // gün cinsinden
    default: 30,
  },
  bakimSorumlusu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  kullanimSaati: {
    type: Number,
    default: 0,
  },
  bakimMaliyeti: {
    type: Number,
    default: 0,
  },

  // Kullanım istatistikleri
  kullanimIstatistikleri: {
    toplamKullanimSaati: {
      type: Number,
      default: 0,
    },
    aylikKullanimSaati: [
      {
        ay: String, // YYYY-MM formatında
        saat: Number,
      },
    ],
    arizaSayisi: {
      type: Number,
      default: 0,
    },
    sonArizaTarihi: Date,
  },

  // QR kod ve barkod
  qrKodu: {
    type: String,
    unique: true,
    sparse: true,
  },
  barkod: {
    type: String,
    unique: true,
    sparse: true,
  },

  // Excel import bilgileri
  excelImportBilgisi: {
    dosyaAdi: String,
    importTarihi: Date,
    satirNo: Number,
  },

  // Etiketler ve sınıflandırma
  etiketler: [
    {
      type: String,
      trim: true,
    },
  ],
  oncelikSeviyesi: {
    type: String,
    enum: ['dusuk', 'orta', 'yuksek', 'kritik'],
    default: 'orta',
  },

  // Veri kalitesi ve validasyon
  dataKalitesi: {
    eksiksizlikSkoru: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    sonKontrolTarihi: Date,
    kontrolEdenKullanici: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },

  // Audit trail
  degisiklikGecmisi: [
    {
      alan: String,
      eskiDeger: mongoose.Schema.Types.Mixed,
      yeniDeger: mongoose.Schema.Types.Mixed,
      degistirenKullanici: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      degisiklikTarihi: {
        type: Date,
        default: Date.now,
      },
      aciklama: String,
    },
  ],

  // Sistem alanları
  aktif: {
    type: Boolean,
    default: true,
  },
  olusturanKullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  olusturmaTarihi: {
    type: Date,
    default: Date.now,
  },
  guncellemeTarihi: {
    type: Date,
    default: Date.now,
  },
});

// Index'ler
InventoryItemSchema.index({ kategoriId: 1, durum: 1 });
InventoryItemSchema.index({ envanterKodu: 1 });
InventoryItemSchema.index({ qrKodu: 1 }, { sparse: true });
InventoryItemSchema.index({ barkod: 1 }, { sparse: true });
InventoryItemSchema.index({ etiketler: 1 });
InventoryItemSchema.index({ lokasyon: 1 });
InventoryItemSchema.index({ sonrakiBakimTarihi: 1 });

// QR kodu otomatik oluştur
InventoryItemSchema.pre('save', function (next) {
  this.guncellemeTarihi = Date.now();

  // QR kodu yoksa oluştur
  if (!this.qrKodu) {
    this.qrKodu = `INV-${this.envanterKodu}-${Date.now()}`;
  }

  next();
});

// Veri kalitesi skorunu hesapla
InventoryItemSchema.methods.hesaplaDataKalitesiSkoru = function () {
  let skor = 0;
  let toplamAlan = 0;

  // Zorunlu alanları kontrol et
  const zorunluAlanlar = ['ad', 'kategoriId', 'envanterKodu'];
  zorunluAlanlar.forEach(alan => {
    toplamAlan++;
    if (this[alan]) {
      skor++;
    }
  });

  // Dinamik alanları kontrol et
  if (this.dinamikAlanlar) {
    const dinamikAlanSayisi = this.dinamikAlanlar.size || 0;
    toplamAlan += dinamikAlanSayisi;
    skor += dinamikAlanSayisi;
  }

  // Opsiyonel ama önemli alanlar
  const opsiyonelOnemliAlanlar = ['aciklama', 'lokasyon', 'sorumluKisi'];
  opsiyonelOnemliAlanlar.forEach(alan => {
    toplamAlan++;
    if (this[alan]) {
      skor++;
    }
  });

  this.dataKalitesi.eksiksizlikSkoru = toplamAlan > 0 ? Math.round((skor / toplamAlan) * 100) : 0;
  this.dataKalitesi.sonKontrolTarihi = new Date();
};

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);
