// ============================================================
// BÖLÜM 1: MODÜL YÜKLEME
// Node.js'in built-in olmayan 3 paketini projeye dahil ediyoruz
// ============================================================
const express = require('express');  // Web sunucusu framework'ü - route, middleware, istek/cevap yönetimi
const path = require('path');        // Dosya yollarını işletim sistemine göre düzgün birleştirir (Windows: \, Linux: /)
const fs = require('fs');            // Dosya sistemi - okuma, yazma, klasör oluşturma, varlık kontrolü

// ============================================================
// BÖLÜM 2: EXPRESS UYGULAMASINI OLUŞTUR
// Boş bir Express uygulaması. Tüm ayarlar, route'lar, middleware'ler buna eklenir
// ============================================================
const app = express();

// ============================================================
// BÖLÜM 3: ÖNEMLİ SİSTEM YOLLARINI KONSOLA YAZDIR
// Geliştirme sırasında hangi klasörde olduğumuzu görmek için
// ============================================================
console.log('__dirname:', __dirname);       // Bu dosyanın BULUNDUĞU klasör - her zaman aynıdır, değişmez
console.log('__filename:', __filename);     // Bu dosyanın tam yolu (dosya adıyla birlikte)
console.log('process.cwd():', process.cwd()); // Node'un ÇALIŞTIRILDIĞI klasör - cd ile değişebilir
// ÖNEMLİ: __dirname ve process.cwd() her zaman aynı olmayabilir!
// Örnek: cd /tmp && node /home/app/index.js → __dirname=/home/app, cwd=/tmp

// ============================================================
// BÖLÜM 4: EJS TEMPLATE MOTORUNU AYARLA
// .ejs dosyalarını HTML'e çevirecek motoru ve dosyaların yerini belirt
// ============================================================
app.set('view engine', 'ejs');                           // Template motoru = EJS (Embedded JavaScript)
app.set('views', path.join(__dirname, 'views'));         // EJS dosyaları proje/views/ klasöründe aranacak

// ============================================================
// BÖLÜM 5: STATİK DOSYA KLASÖRÜNÜ TANIMLA
// CSS, JS, resim, font gibi değişmeyen dosyalar buradan servis edilir
// ============================================================
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));
// Tarayıcı /resurse/css/style.css istediğinde → otomatik olarak proje/resurse/css/style.css gönderilir
// Tarayıcı /resurse/imagini/logo.png istediğinde → proje/resurse/imagini/logo.png gönderilir
// express.static = dosyaları otomatik servis eden middleware

// ============================================================
// BÖLÜM 6: GLOBAL HATA NESNESİ
// Uygulamanın her yerinden erişilebilen, tüm hata bilgilerini tutan depo
// ============================================================
const obGlobal = {
    obErori: null  // Başlangıçta boş, initErori() ile doldurulacak
};

// ============================================================
// BÖLÜM 7: verificaErori() - erori.json DOSYASINI KAPSAMLI DOĞRULA
// Sunucu başlamadan önce hata kataloğunun düzgün olduğundan emin ol
// 7 farklı kontrol yapar, hata bulursa konsola yazar veya sunucuyu kapatır
// ============================================================
function verificaErori() {
    
    // 7.1: erori.json dosyası var mı? Yoksa sunucu başlamasın
    const caleJson = path.join(__dirname, 'erori.json');
    if (!fs.existsSync(caleJson)) {
        console.error('EROARE: Fisierul erori.json nu exista. Aplicatia se inchide.');
        process.exit(1);  // Kod 1 = hata ile çıkış
    }

    // 7.2: Dosyayı string olarak oku (henüz JSON.parse yapmadık)
    const continut = fs.readFileSync(caleJson, 'utf8');

    // 7.3: Aynı obje içinde tekrarlayan özellik var mı kontrol et
    // Regex ile tüm { ... } bloklarını bul
    const obiecte = continut.match(/\{[^{}]*\}/g) || [];
    for (const obiect of obiecte) {
        const proprietatiObiect = {};  // Bu objede gördüğümüz özellikleri takip et
        const liniiObiect = obiect.split('\n');  // Objeyi satırlara böl
        for (const linie of liniiObiect) {
            const match = linie.match(/"(\w+)"\s*:/);  // "ozellik": pattern'ini yakala
            if (match) {
                const prop = match[1];  // Özellik adını al
                if (proprietatiObiect[prop]) {
                    // Bu özellik bu objede daha önce görüldü → TEKRAR VAR
                    console.error(`EROARE: Proprietatea "${prop}" apare de mai multe ori in acelasi obiect.`);
                } else {
                    proprietatiObiect[prop] = true;  // İlk kez görüldü olarak işaretle
                }
            }
        }
    }

    // 7.4: String'i JavaScript nesnesine çevir (artık obje olarak erişebiliriz)
    const dateErori = JSON.parse(continut);

    // 7.5: Zorunlu 3 ana özellik var mı? Yoksa sunucu başlamasın
    if (!dateErori.info_erori) {
        console.error('EROARE: Proprietatea "info_erori" lipseste din erori.json.');
        process.exit(1);
    }
    if (!dateErori.cale_baza) {
        console.error('EROARE: Proprietatea "cale_baza" lipseste din erori.json.');
        process.exit(1);
    }
    if (!dateErori.eroare_default) {
        console.error('EROARE: Proprietatea "eroare_default" lipseste din erori.json.');
        process.exit(1);
    }

    // 7.6: Varsayılan hatanın alt özellikleri (titlu, text, imagine) var mı?
    if (dateErori.eroare_default) {
        if (!dateErori.eroare_default.titlu) {
            console.error('EROARE: "eroare_default" nu are proprietatea "titlu".');
        }
        if (!dateErori.eroare_default.text) {
            console.error('EROARE: "eroare_default" nu are proprietatea "text".');
        }
        if (!dateErori.eroare_default.imagine) {
            console.error('EROARE: "eroare_default" nu are proprietatea "imagine".');
        }
    }

    // 7.7: cale_baza'da belirtilen klasör gerçekten var mı?
    if (dateErori.cale_baza) {
        const caleBaza = path.join(__dirname, dateErori.cale_baza);
        if (!fs.existsSync(caleBaza)) {
            console.error(`EROARE: Folderul "${dateErori.cale_baza}" specificat in cale_baza nu exista.`);
        }
    }

    // 7.8: Her hatanın resim dosyası gerçekten o klasörde var mı?
    if (dateErori.info_erori && dateErori.cale_baza) {
        for (const eroare of dateErori.info_erori) {
            const caleImagine = path.join(__dirname, dateErori.cale_baza, eroare.imagine);
            if (!fs.existsSync(caleImagine)) {
                console.error(`EROARE: Imaginea "${eroare.imagine}" pentru eroarea ${eroare.identificator} nu exista in "${dateErori.cale_baza}".`);
            }
        }
    }

    // 7.9: Aynı hata kodundan (örneğin iki tane 404) var mı?
    if (dateErori.info_erori) {
        const identificatori = {};  // Görülen ID'leri takip et
        for (const eroare of dateErori.info_erori) {
            if (identificatori[eroare.identificator]) {
                console.error(`EROARE: Identificatorul "${eroare.identificator}" apare de mai multe ori. Proprietati: titlu="${eroare.titlu}", text="${eroare.text}", imagine="${eroare.imagine}".`);
            } else {
                identificatori[eroare.identificator] = true;
            }
        }
    }
}

// ============================================================
// BÖLÜM 8: UYGULAMA KLASÖRLERİNİ OLUŞTUR
// Uygulamanın çalışması için gerekli 4 klasörü garanti altına al
// ============================================================
const vect_foldere = ['temp', 'logs', 'backup', 'fisiere_uploadate'];
// temp: geçici dosyalar, logs: kayıt dosyaları, backup: yedekler, fisiere_uploadate: kullanıcı yüklemeleri

for (const folder of vect_foldere) {
    const cale = path.join(__dirname, folder);  // proje/temp, proje/logs gibi
    if (!fs.existsSync(cale)) {                 // Klasör yoksa
        fs.mkdirSync(cale);                     // Oluştur
        console.log(`Folder creat: ${folder}`); // Bilgi ver
    }
    // Varsa hiçbir şey yapma, devam et
}

// ============================================================
// BÖLÜM 9: initErori() - HATA SİSTEMİNİ YÜKLE
// erori.json dosyasını oku, resim yollarını düzelt, global objeye kaydet
// ============================================================
function initErori() {
    // 9.1: erori.json dosyasını oku ve JavaScript objesine çevir
    const dateErori = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'erori.json'), 'utf8')
    );
    
    // 9.2: Her hatanın resim yolunu düzelt
    // JSON'da sadece "404.png" yazar → "/resurse/imagini/erori/404.png" haline getir
    dateErori.info_erori = dateErori.info_erori.map(e => ({
        ...e,                                          // Tüm mevcut özellikleri koru (spread)
        imagine: '/' + dateErori.cale_baza + '/' + e.imagine  // Resim yolunu güncelle
    }));
    
    // 9.3: İşlenmiş veriyi global objeye kaydet (her yerden erişilebilir)
    obGlobal.obErori = dateErori;
}
initErori();  // Hemen çalıştır, sunucu başlamadan hatalar hazır olsun

// ============================================================
// BÖLÜM 10: afisareEroare() - HATA SAYFASINI GÖSTER
// İstenen hata koduna göre eroare.ejs sayfasını render eder
// Parametreler: res (cevap objesi), identificator (hata kodu), 
//                titlu, text, imagine (opsiyonel - özel değerler)
// ============================================================
function afisareEroare(res, identificator, titlu, text, imagine) {
    const erori = obGlobal.obErori;  // Global hata kataloğunu al
    
    // 10.1: Verilen ID'ye sahip hatayı dizide ara
    let eroare = erori.info_erori.find(e => e.identificator === identificator);

    let date;  // EJS'ye gönderilecek veri objesi
    
    if (eroare) {
        // 10.2: Hata BULUNDU - onun verilerini kullan
        // || operatörü: soldaki varsa onu al, yoksa (undefined/null) sağdakini al
        date = {
            titlu: titlu || eroare.titlu,        // Parametre verilmişse onu, yoksa JSON'dakini
            text: text || eroare.text,            // Aynı mantık
            imagine: imagine || eroare.imagine    // Aynı mantık
        };
        
        // 10.3: Eğer hatanın status özelliği true ise HTTP durum kodunu ayarla
        if (eroare.status) res.status(identificator);  // res.status(404) gibi
    } else {
        // 10.4: Hata BULUNAMADI - varsayılan hatayı kullan
        date = {
            titlu: titlu || erori.eroare_default.titlu,
            text: text || erori.eroare_default.text,
            imagine: imagine || path.join(__dirname, erori.cale_baza, erori.eroare_default.imagine)
        };
    }

    // 10.5: EJS ile hata sayfasını render et
    res.render('pagini/eroare', date);  // views/pagini/eroare.ejs dosyasını date verisiyle işle
}

// ============================================================
// BÖLÜM 11: FAVICON ROUTE'U
// Tarayıcı her sayfada otomatik olarak /favicon.ico ister
// ============================================================
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'resurse', 'ico', 'favicon.ico'));
    // Dosyayı olduğu gibi gönder, render yok
});

// ============================================================
// BÖLÜM 12: TEST ROUTE'U
// Hata sisteminin çalıştığını test etmek için özel route
// ============================================================
app.get('/test-eroare', (req, res) => {
    afisareEroare(res, 500);  // 500 hatasını göster (Sunucu Hatası)
});

// ============================================================
// BÖLÜM 13: KLASÖR ERİŞİM ENGELİ (403)
// /resurse klasörüne direkt erişimi engelle
// ============================================================
app.use('/resurse', (req, res, next) => {
    // path.extname: dosya uzantısını verir (.css, .js, .png gibi)
    // Uzantı YOKSA → klasör demektir → YASAK
    if (!path.extname(req.path)) {
        return afisareEroare(res, 403);  // 403 Forbidden - Erişim Yasak
    }
    // Uzantı VARSA → dosya demektir → devam et (express.static göndersin)
    next();
});

// ============================================================
// BÖLÜM 14: EJS DOSYALARINA DİREKT ERİŞİM ENGELİ (400)
// Kullanıcı tarayıcıdan .ejs dosyası isterse engelle
// ============================================================
app.get('/*.ejs', (req, res) => {
    afisareEroare(res, 400);  // 400 Bad Request - Geçersiz İstek
});

// ============================================================
// BÖLÜM 15: ANA SAYFA ROUTE'LARI
// 3 farklı URL aynı sayfayı göstersin
// ============================================================
app.get(['/', '/index', '/home'], (req, res) => {
    // ip değişkenini EJS'ye gönder ki sayfada gösterilebilsin
    res.render('pagini/index', { ip: req.ip });
});

// ============================================================
// BÖLÜM 16: GENEL ROUTE - EN SONDA OLMALI
// Yukarıdaki hiçbir route'a uymayan tüm istekleri yakalar
// ============================================================
app.get('/*', (req, res) => {
    const pagina = req.params[0];  // URL'deki sayfa adını al
    // Örnek: /despre → pagina = "despre"
    
    // EJS render'ı callback'li yapıyoruz ki hatayı yakalayabilelim
    res.render(`pagini/${pagina}`, { ip: req.ip }, (err, rezultat) => {
        if (err) {
            // 16.1: Hata oluştu
            if (err.message.startsWith('Failed to lookup view')) {
                // EJS dosyası bulunamadı → 404 (Sayfa Bulunamadı)
                afisareEroare(res, 404);
            } else {
                // Başka bir render hatası → 500 (Sunucu Hatası - varsayılan)
                afisareEroare(res);
            }
        } else {
            // 16.2: Başarılı → HTML'i gönder
            res.send(rezultat);
        }
    });
});

// ============================================================
// BÖLÜM 17: DOĞRULAMA VE BAŞLATMA
// Önce doğrulama yap, sonra hata sistemini yükle
// ============================================================
verificaErori();  // erori.json geçerli mi? Tüm kontrolleri yap
initErori();      // Hata sistemini yükle (zaten yukarıda çağrıldı ama garanti olsun)

// ============================================================
// BÖLÜM 18: SUNUCUYU DİNLEMEYE BAŞLAT
// ============================================================
app.listen(8080, () => {
    console.log('Server pornit pe http://localhost:8080');
    // Artık tarayıcıdan http://localhost:8080 yazarak erişilebilir
});