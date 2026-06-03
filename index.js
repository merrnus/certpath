const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Task 4.3: Afișarea căilor importante
console.log('__dirname:', __dirname);
console.log('__filename:', __filename);
console.log('process.cwd():', process.cwd());
// __dirname = calea folderului fișierului curent (întotdeauna același)
// process.cwd() = calea de unde a fost pornit procesul Node (poate diferi)
// Nu sunt întotdeauna același lucru

// Task 4.4: Setarea motorului de template EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Task 4.6: Definirea folderului de resurse statice
app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

// Task 4.11: Variabila globală cu obiectul erorilor
const obGlobal = {
    obErori: null
};

// BONUS Etapa 4: Verificarea datelor din erori.json
function verificaErori() {
    // 1. Verificam daca exista fisierul erori.json
    const caleJson = path.join(__dirname, 'erori.json');
    if (!fs.existsSync(caleJson)) {
        console.error('EROARE: Fisierul erori.json nu exista. Aplicatia se inchide.');
        process.exit(1);
    }

    // Citim continutul fisierului ca string
    const continut = fs.readFileSync(caleJson, 'utf8');

    // 6. Verificam daca o proprietate apare de mai multe ori in acelasi obiect
const obiecte = continut.match(/\{[^{}]*\}/g) || [];
for (const obiect of obiecte) {
    const proprietatiObiect = {};
    const liniiObiect = obiect.split('\n');
    for (const linie of liniiObiect) {
        const match = linie.match(/"(\w+)"\s*:/);
        if (match) {
            const prop = match[1];
            if (proprietatiObiect[prop]) {
                console.error(`EROARE: Proprietatea "${prop}" apare de mai multe ori in acelasi obiect.`);
            } else {
                proprietatiObiect[prop] = true;
            }
        }
    }
}

    const dateErori = JSON.parse(continut);

    // 2. Verificam daca exista proprietatile principale
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

    // 3. Verificam proprietatile din eroare_default
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

    // 4. Verificam daca exista folderul specificat in cale_baza
    if (dateErori.cale_baza) {
        const caleBaza = path.join(__dirname, dateErori.cale_baza);
        if (!fs.existsSync(caleBaza)) {
            console.error(`EROARE: Folderul "${dateErori.cale_baza}" specificat in cale_baza nu exista.`);
        }
    }

    // 5. Verificam daca exista fisierele imagine asociate erorilor
    if (dateErori.info_erori && dateErori.cale_baza) {
        for (const eroare of dateErori.info_erori) {
            const caleImagine = path.join(__dirname, dateErori.cale_baza, eroare.imagine);
            if (!fs.existsSync(caleImagine)) {
                console.error(`EROARE: Imaginea "${eroare.imagine}" pentru eroarea ${eroare.identificator} nu exista in "${dateErori.cale_baza}".`);
            }
        }
    }

    // 7. Verificam daca exista mai multi identificatori identici
    if (dateErori.info_erori) {
        const identificatori = {};
        for (const eroare of dateErori.info_erori) {
            if (identificatori[eroare.identificator]) {
                console.error(`EROARE: Identificatorul "${eroare.identificator}" apare de mai multe ori. Proprietati: titlu="${eroare.titlu}", text="${eroare.text}", imagine="${eroare.imagine}".`);
            } else {
                identificatori[eroare.identificator] = true;
            }
        }
    }
}

// Task 4.20: Crearea folderelor necesare aplicației
const vect_foldere = ['temp', 'logs', 'backup', 'fisiere_uploadate'];
for (const folder of vect_foldere) {
    const cale = path.join(__dirname, folder);
    if (!fs.existsSync(cale)) {
        fs.mkdirSync(cale);
        console.log(`Folder creat: ${folder}`);
    }
}

// Task 4.11: Funcția de inițializare a erorilor din JSON
function initErori() {
    const dateErori = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'erori.json'), 'utf8')
    );
    dateErori.info_erori = dateErori.info_erori.map(e => ({
        ...e,
        imagine: '/' + dateErori.cale_baza + '/' + e.imagine
    }));
    obGlobal.obErori = dateErori;
}
initErori();

// Task 4.12: Funcția de afișare a erorilor
function afisareEroare(res, identificator, titlu, text, imagine) {
    const erori = obGlobal.obErori;
    let eroare = erori.info_erori.find(e => e.identificator === identificator);

    let date;
   if (eroare) {
    date = {
        titlu: titlu || eroare.titlu,
        text: text || eroare.text,
        imagine: imagine || eroare.imagine
    };
        if (eroare.status) res.status(identificator);
    } else {
        date = {
            titlu: titlu || erori.eroare_default.titlu,
            text: text || erori.eroare_default.text,
            imagine: imagine || path.join(__dirname, erori.cale_baza, erori.eroare_default.imagine)
        };
    }

    res.render('pagini/eroare', date);
}

// Task 4.18: Trimiterea favicon-ului la cerere directă
//favicon route
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'resurse', 'ico', 'favicon.ico'));
});

app.get('/test-eroare', (req, res) => {
    afisareEroare(res, 500);
});  

// Task 4.16: Returnarea erorii 403 la accesarea unui folder din /resurse
//error folder resurse
app.use('/resurse', (req, res, next) => {
    if (!path.extname(req.path)) {
        return afisareEroare(res, 403);
    }
    next();
});

// Task 4.17: Returnarea erorii 400 la cererea unui fișier .ejs
//error .ejs
app.get('/*.ejs', (req, res) => {
    afisareEroare(res, 400);
});

// Task 4.8: Prima pagină accesibilă prin mai multe căi
//static
app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index', { ip: req.ip });
});


// Task 4.9: Route general pentru orice pagină - trebuie să fie ultimul
//general
app.get('/*', (req, res) => {
    const pagina = req.params[0];
    res.render(`pagini/${pagina}`, { ip: req.ip }, (err, rezultat) => {
        if (err) {
            // Task 4.10: Tratarea erorilor de randare
            if (err.message.startsWith('Failed to lookup view')) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res);
            }
        } else {
            res.send(rezultat);
        }
    });
});


verificaErori();
initErori();

// Task 4.1: Serverul ascultă pe portul 8080
app.listen(8080, () => {
    console.log('Server pornit pe http://localhost:8080');
});

/* Node.js → index.js çalıştırır
index.js → Express kullanır
Express → EJS kullanır
EJS → .ejs dosyalarını HTML'e çevirir */

/* App Store = npmjs.com (kütüphaneler burada duruyor)
App Store uygulaması = npm (indirme aracı)
Uygulama = express, ejs gibi kütüphaneler
Telefon = Node.js (çalışma ortamı) */

/*Kullanıcı /yokboylesayfa yazar
→ Express genel route karşılar (index.js)
→ res.render('pagini/yokboylesayfa') dener
→ EJS dosyayı arar, bulamaz
→ callback'e "Failed to lookup view" hatası gelir
→ index.js afisareEroare(res, 404) çağırır
→ afisareEroare obGlobal.obErori'den 404 verisini alır
→ res.render('pagini/eroare', {titlu, text, imagine}) çağırır
→ EJS eroare.ejs'i render eder
→ HTML tarayıcıya gönderilir */