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
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'resurse', 'ico', 'favicon.ico'));
});

// Task 4.16: Returnarea erorii 403 la accesarea unui folder din /resurse
app.use('/resurse', (req, res, next) => {
    if (!path.extname(req.path)) {
        return afisareEroare(res, 403);
    }
    next();
});

// Task 4.17: Returnarea erorii 400 la cererea unui fișier .ejs
app.get('/*.ejs', (req, res) => {
    afisareEroare(res, 400);
});

// Task 4.8: Prima pagină accesibilă prin mai multe căi
app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index', { ip: req.ip });
});

// Task 4.9: Route general pentru orice pagină - trebuie să fie ultimul
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

// Task 4.1: Serverul ascultă pe portul 8080
app.listen(8080, () => {
    console.log('Server pornit pe http://localhost:8080');
});