# Odorik
Jde o single page application, která používá pouze HTML, CSS, JavaScript a [Odorik API](http://www.odorik.cz/w/api). Můžete si ji tedy stáhnout, a následně ji spouštět lokálně nebo ji umístit na své webové stránky. Bezpečně ji můžete používat ale i spuštěním přímo na stránce [heptau.github.io/odorik/](https://heptau.github.io/odorik/), kde navíc bude vždy nejnovější verze.

Pro přihlášení můžete použít bud SIP jmého a SIP heslo, kdy máte přístup jen k údajům konkrétního čísla a nebo můžete použít API jméno a API heslo, které najdete po přihlášení v [Nastavení účtu -> Api heslo](https://www.odorik.cz/ucet/nastaveni_uctu) a potom máte přístup ke všem linkám. Po zobrazení aplikace ve webovém prohlížeči si ji také můžete přidat do aplikací (na plochu), protože jde o 
Progresive Web Application (PWA).

V hlavičce web stránky najdete nastavení, díky kterému si můžete funkčnost upravit. Pokud ovšem zakážete nebo omezíte nějak funkčnost této aplikace, uživatel bude moci stále použít neomezenou verzi aplikace a zobrazovat, nastavovat nebo měnit i údaje, které na svém webu zakážete.

## Nastavení v hlavičce
API uživatelské jméno a heslo - automatické přihlášení. Toto uložení jména a hesla není bezpečné - kdokoli, kdo má ke stránce přistup, si může zobrazit zdrojový kód a jméno i heslo si přečíst.

    var APIuser = "1234560";
    var APIpass = "abc9de99";

Povolit sekci rychlé kontakty

    var enableSpeedDials = false; // zakáže sekci rychlých kontaktů

Povolit sekci historie volání

    var enableCallHisory = false; // zakáže sekci historie volání

Povolit sekci statistik volání

    var enableStatistics = false; // zakáže sekci statistik volání

>Musí být povolena alespoň jedna sekce

Zamknutá čísla - čárkou oddělený seznam zkratek (klapek), které nejde editovat

    var lockedNumbers = "1,7"; // zakáže čísla 1 a 7

Skrytí zamknutých čísel - nezobrazovat vůbec, nebo zobrazit, ale zakázat úpravy

    var hideLockedNumbers = true; // nezobrazí je vůbec 

Povolit přidávání nových čísel

    var enableAdding = false; // zakáže přidávání

Povolit upravování nových čísel

    var enableEditing = true; // povolí úpravy

Povolit mazání čísel

    var enableRemoving = false; // zakáže mazání

Povolit callback

    var enableCallback = false; // zakáže callback

Povolit políčko rychlého callbacku

    var enableQuickCallback = false; // zakáže políčko rychlého callbacku

Povolit odhlašovaní uživatele

    var enableLogout = false; // zakáže odhlašování

Povolit import/export

    var enableLogout = false; // zakáže import/export

Povolit úpravu přímo v tabulce - dvojklikem na číslo jej můžete přímo upravit

    var enableInlineEditing = false; // zakáže úpravy přímo v tabulce

Povolit animace

    var enableAnimations = false; // zakáže animace

Přednastavené číslo pro callback

    var defaultCallbackNumber = "0085023815827"; // nastaví výchozí číslo pro callback na 0085023815827

Počet položek na stránku

    var pageLength = 24; // nastaví počet položek na stránku na 24
