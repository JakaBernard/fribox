window.addEventListener('load', function() {
	//stran nalozena
	
	var prizgiCakanje = function() {
		document.querySelector(".loading").style.display = "block";
	}
	
	var ugasniCakanje = function() {
		document.querySelector(".loading").style.display = "none";
	}
	
	document.querySelector("#nalozi").addEventListener("click", prizgiCakanje);
	
	//Pridobi seznam datotek
	var pridobiSeznamDatotek = function(event) {
		prizgiCakanje();
		var xhttp = new XMLHttpRequest(); //tuki pripravmo ajax zahtevo
		xhttp.onreadystatechange = function() {  //ko bo bomo tole dobili s streznika (stanje 4, status 200)
			if (xhttp.readyState == 4 && xhttp.status == 200) {  //tole je template, ne sprasujemo zakaj
				var datoteke = JSON.parse(xhttp.responseText);  //je pri nas, shranimo iz sprem. v datoteko
				
				var datotekeHTML = document.querySelector("#datoteke");  //sprehosmo se cez datoteke, jih dodajamo kot vrstice
				
				for (var i=0; i<datoteke.length; i++) {
					var datoteka = datoteke[i];
					
					var velikost = datoteka.velikost;
					var enota = "B";
					
					if(velikost > 1024) {  //TUKEJ SPREMINJAMO IZPIS VELIKOSTI DATOTEKE, DA NI VSE V NAVADNIH BYTIH
						velikost = Math.round(velikost/1024);
						enota = "kiB";
					}
					
					if(velikost > 1024) {
						velikost = Math.round(velikost/1024);
						enota = "MiB";
					}
					
					if(velikost > 1024) {
						velikost = Math.round(velikost/1024);
						enota = "GiB";
					}
					
					
					//kiB, MiB, GiB, zaokrozevanje --> Math.round(...)
					//to tudi izpisemo na strani
					datotekeHTML.innerHTML += " \
						<div class='datoteka senca rob'> \
							<div class='naziv_datoteke'> " + datoteka.datoteka + "  (" + velikost + " " + enota + ") </div> \
							<div class='akcije'> \
							| <span><a href='/poglej/" + datoteka.datoteka + "' target='_blank'>Poglej</a></span> \
							| <span><a href='/prenesi/" + datoteka.datoteka + "' target='_self'>Prenesi</a></span> \
							| <span akcija='brisi' datoteka='"+ datoteka.datoteka +"'>Izbriši</span> </div> \
					    </div>";	//_blank - hocemo v novem zavihku
				}
				
				if (datoteke.length > 0) {
					//document.querySelector("span[akcija=brisi]").addEventListener("click", brisi); //na gumbe damo evente, ko kdo klikne na njih & query selector deluje samo na prvo zadevo, tako da lohka zbrises samo prvo datoteko
					var brisanje = document.querySelectorAll("span[akcija=brisi]"); //mamo zdej sprem, po teh elementih se sprehodimo
					for(var i = 0; i < brisanje.length; i++) {
						brisanje[i].addEventListener("click", brisi);
					}
				}
				ugasniCakanje();
			
			}
		};
		xhttp.open("GET", "/datoteke", true); //to datoteko, ki smo jo zgradili, jo pripravimo da jo pošljemo strežniku (true => zahteva je asinhrona)
		xhttp.send(); //dejansko posljemo
	}
	pridobiSeznamDatotek();
	
	var brisi = function(event) {
		prizgiCakanje();
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4 && xhttp.status == 200) {
				if (xhttp.responseText == "Datoteka izbrisana") {
					window.location = "/";
				} else {
					alert("Datoteke ni bilo možno izbrisati!");
				}
			}
			ugasniCakanje();
		};
		xhttp.open("GET", "/brisi/"+this.getAttribute("datoteka"), true);
		xhttp.send();
	}

});