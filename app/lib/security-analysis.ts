// MEVCUT GÜVENLİK AÇIKLARI ANALİZİ

export const securityIssues = {
  // 1. SABİT KULLANICI ID'Sİ
  authentication: {
    issue: "Sabit user ID kullanılıyor",
    risk: "YÜKSEK",
    location: "app/lib/auth.ts",
    problem: `return "user-id" // Tüm kullanıcılar aynı ID'yi kullanıyor!`,
    impact: "Tüm kullanıcılar birbirinin verilerini görebilir",
  },

  // 2. ŞİFRE KONTROLÜ YOK
  passwordSecurity: {
    issue: "Şifre doğrulama yok",
    risk: "YÜKSEK",
    location: "app/lib/auth.ts",
    problem: `return true // Her şifre kabul ediliyor!`,
    impact: "Herkes herhangi bir hesaba girebilir",
  },

  // 3. SESSION YÖNETİMİ YOK
  sessionManagement: {
    issue: "Gerçek session yönetimi yok",
    risk: "YÜKSEK",
    location: "middleware.ts",
    problem: "Sadece cookie varlığı kontrol ediliyor",
    impact: "Session hijacking mümkün",
  },

  // 4. VERİ ŞİFRELEME YOK
  dataEncryption: {
    issue: "Hassas veriler şifrelenmemiş",
    risk: "ORTA",
    location: "Veritabanı",
    problem: "Finansal veriler plain text",
    impact: "Veri sızıntısında tam erişim",
  },

  // 5. INPUT VALİDASYON EKSİK
  inputValidation: {
    issue: "Yetersiz input doğrulama",
    risk: "ORTA",
    location: "API routes",
    problem: "SQL injection riski",
    impact: "Veritabanı manipülasyonu",
  },
}
