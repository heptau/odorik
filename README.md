# Odorik Connect

**Odorik Connect** je progresivní webová aplikace (PWA), která slouží jako moderní klientské rozhraní pro služby [Odorik.cz](https://www.odorik.cz/). Aplikace je postavena čistě na technologiích **HTML, CSS a JavaScript** a komunikuje přímo s [Odorik API](https://odorik.80.cz/swagger/).

Můžete ji používat online, nainstalovat si ji na mobilní zařízení, nebo ji hostovat na vlastním serveru.

## 🚀 Možnosti použití

### 1. Online verze (doporučeno)
Nejnovější verzi aplikace naleznete vždy na adrese:
👉 **[odorik.80.cz](https://odorik.80.cz/)**

### 2. Instalace do mobilu (PWA)
Po otevření stránky v prohlížeči na mobilním telefonu (Android/iOS) můžete aplikaci přidat na plochu ("Přidat na úvodní obrazovku"). Aplikace se poté bude chovat jako nativní aplikace.

### 3. Vlastní instalace
Jelikož se jedná o čistý frontend bez backendových závislostí, stačí stáhnout zdrojové kódy a umístit je na libovolný webhosting, nebo spustit lokálně.

---

## 🔑 Přihlášení

Pro vstup do aplikace máte dvě možnosti:

1.  **API přihlášení (Správce)**
    *   **Údaje:** API jméno a API heslo.
    *   **Kde je najdu:** Po přihlášení na webu Odorik v sekci [Nastavení účtu -> Api heslo](https://www.odorik.cz/ucet/nastaveni_uctu).
    *   **Přístup:** Umožňuje plnou správu všech linek pod účtem.

2.  **SIP přihlášení (Uživatel linky)**
    *   **Údaje:** SIP jméno (číslo linky) a SIP heslo.
    *   **Přístup:** Omezený přístup pouze k datům a historii konkrétní linky.

---

## ⚙️ Konfigurace

V souboru `odorik.js` (nebo v jeho modernizované verzi) naleznete konfigurační sekci, kterou můžete upravit podle svých potřeb:

```javascript
const CONFIG = {
    // Předvyplnění přihlašovacích údajů (nedoporučuje se pro veřejné weby)
    APIuser: "",
    APIpass: "",

    // Zamčení konkrétních čísel/linek pro editaci
    lockedNumbers: "1,7",

    // Skrytí zamčených čísel (true = skrýt, false = zobrazit ale needitovat)
    hideLockedNumbers: true,

    // Seznam povolených linek (prázdné = všechny dostupné)
    allowedLines: "300100,300200",

    // ... další nastavení
};
```

---

## ⚠️ Bezpečnostní upozornění

Aplikace běží kompletně ve vašem prohlížeči (client-side). Veškerá omezení funkcí nastavená v `odorik.js` (např. `lockedNumbers` nebo `allowedLines`) slouží pouze pro úpravu uživatelského rozhraní (UI).

**Pamatujte:**
Pokud uživateli omezíte funkce v této aplikaci, neznamená to, že má zablokovaný přístup k API. Znalý uživatel může stále provádět akce (zobrazovat historii, měnit nastavení) přímo přes oficiální web Odorik.cz nebo pomocí jiné aplikace využívající stejné přihlašovací údaje.

---

**Technologie:** HTML5, CSS3, JavaScript (ES6+), Semantic UI, jQuery.
