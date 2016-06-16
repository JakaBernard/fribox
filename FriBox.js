if (!process.env.PORT) {
    process.env.PORT = 8080;
}

var mime = require('mime');
var formidable = require('formidable');
var http = require('http');
var fs = require('fs-extra');
var util = require('util');
var path = require('path');

var dataDir = "./data/";

var streznik = http.createServer(function(zahteva, odgovor) {
   if (zahteva.url == '/') {
       posredujOsnovnoStran(odgovor);
   } else if (zahteva.url == '/datoteke') { 
       posredujSeznamDatotek(odgovor);
   } else if (zahteva.url.startsWith('/brisi')) { 
       izbrisiDatoteko(odgovor, dataDir + zahteva.url.replace("/brisi", "")); 
   } else if (zahteva.url.startsWith('/poglej')) { 
       posredujStaticnoVsebino(odgovor, dataDir + zahteva.url.replace("/poglej", ""), ""); //drugi parameter je: kaj naj posreduje datadir==kjer so datoteke, +zahteva.url... je pa datoteka, ki jo hocmo
   } else if (zahteva.url.startsWith('/prenesi')) { 
       posredujStaticnoVsebino(odgovor, dataDir + zahteva.url.replace("/prenesi", ""), "application/octet-stream"); //tale ta zadnji string je content type
   } else if (zahteva.url == "/nalozi") {
       naloziDatoteko(zahteva, odgovor);
   } else {
       posredujStaticnoVsebino(odgovor, './public' + zahteva.url, "");
   }
});

function izbrisiDatoteko(odgovor, datoteka) {
    odgovor.writeHead(200, {'Content-Type': 'text/plain'});
    fs.unlink(datoteka, function(napaka){
        if (napaka) {
           posredujNapako404(odgovor);
        } else {
            odgovor.write('Datoteka izbrisana');
            odgovor.end();
        }
    })
}

function posredujOsnovnoStran(odgovor) {
    posredujStaticnoVsebino(odgovor, './public/fribox.html', "");
}

function posredujStaticnoVsebino(odgovor, absolutnaPotDoDatoteke, mimeType) {
        fs.exists(absolutnaPotDoDatoteke, function(datotekaObstaja) {
            if (datotekaObstaja) {
                fs.readFile(absolutnaPotDoDatoteke, function(napaka, datotekaVsebina) {
                    if (napaka) {
                        //Posreduj napako
                        posredujNapako500(odgovor); //ce obstaja je naceloma server kriv, ker je pac pokvarjen al neki
                    } else {
                        posredujDatoteko(odgovor, absolutnaPotDoDatoteke, datotekaVsebina, mimeType);
                    }
                })
            } else {
                //Posreduj napako
                posredujNapako404(odgovor);  //odjemalc kriv, ker je dal zahtevo, ki je streznik ne more izpolnit
            }
        })
}

function posredujDatoteko(odgovor, datotekaPot, datotekaVsebina, mimeType) {
    if (mimeType == "") {
        odgovor.writeHead(200, {'Content-Type': mime.lookup(path.basename(datotekaPot))});    
    } else {
        odgovor.writeHead(200, {'Content-Type': mimeType});
    }
    
    odgovor.end(datotekaVsebina);
}

function posredujSeznamDatotek(odgovor) {
    odgovor.writeHead(200, {'Content-Type': 'application/json'});
    fs.readdir(dataDir, function(napaka, datoteke) {
        if (napaka) {
            //Posreduj napako
            posredujNapako500(odgovor); //streznik kriv, nima seznama al neki
        } else {
            var rezultat = [];
            for (var i=0; i<datoteke.length; i++) {
                var datoteka = datoteke[i];
                var velikost = fs.statSync(dataDir+datoteka).size;    
                rezultat.push({datoteka: datoteka, velikost: velikost});
            }
            
            odgovor.write(JSON.stringify(rezultat));
            odgovor.end();      
        }
    })
}

function naloziDatoteko(zahteva, odgovor) {
    var form = new formidable.IncomingForm();
 
    form.parse(zahteva, function(napaka, polja, datoteke) {
        util.inspect({fields: polja, files: datoteke});
    });
 
    form.on('end', function(fields, files) {
        var zacasnaPot = this.openedFiles[0].path;
        var datoteka = this.openedFiles[0].name;
        fs.copy(zacasnaPot, dataDir + datoteka, function(napaka) {  
            if (napaka) {
                //Posreduj napako
                posredujNapako500();  //ker je streznik zadolzen, da preverja, kaj mu dojemalec posilja
            } else {
                posredujOsnovnoStran(odgovor);        
            }
        });
    });
}

streznik.listen(process.env.PORT, function(){
    console.log("IT'S ALIIIIIVEEEE!!! (aka strežnik je pognan ...)")
})

//Napake
function posredujNapako404(odgovor) {
    odgovor.writeHead(404, {'Content-Type': 'text/plain'});
    odgovor.write('Napaka 404: Vira ni mogoče najti!');
    odgovor.end();
}

function posredujNapako500(odgovor) {
    odgovor.writeHead(500, {'Content-Type': 'text/plain'});
    odgovor.write('Napaka 500: Prišlo je do napake na strežniku!');
    odgovor.end();
}