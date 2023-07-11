// coding: utf-8

// NASTAVENÍ

// API uživatelské jméno a heslo :: automatické přihlášení. Toto uložení jména a hesla není bezpečné - kdokoli, kdo má ke stránce přistup, si může zobrazit zdrojový kód a jméno i heslo si přečíst.
var APIuser = "";
var APIpass = "";

// Zamknutá čísla :: čárkou oddělený seznam zkratek (klapek), které nejde editovat
// př. var lockedNumbers = "1,7" // zakáže čísla 1 a 7
var lockedNumbers = "";

// Skrytí zamknutých čísel :: true = nezobrazovat vůbec, false = zobrazit, ale zakázat úpravy
// př. var hideLockedNumbers = true // nezobrazí vůbec
var hideLockedNumbers = true;

// Povolené linky :: čárkou oddělený seznam linek, které jsou uživateli dostupné
// Pokud je pole prázdné, tak jsou všechny linky povolené
// př. var allowedLines = "300100,300200"; // Povolí jen linku 300100 a 300200
var allowedLines = "";

// Povolit animace :: true = povolit, false = zakázat
// př. var enableAnimations = false; // zakáže animace
var enableAnimations = true;

// Přednastavené číslo pro callback
// př. var defaultCallbackNumber = "0085023815827"; // nastaví výchozí číslo pro callback na 0085023815827
var defaultCallbackNumber = "";

// Přednastavená linka pro callback
// př. var defaultCallbackLine = "623400"; // nastaví výchozí linku pro callback na 623400
var defaultCallbackLine = "";

// Počet položek na stránku
// př. var pageLength = 24; // nastaví počet položek na stránku na 24
var pageLength = 100;


// Disable caching of AJAX responses (so the data is properly updated)
$.ajaxSetup({
	cache: false
});

// Incompatible browser warning
if (window.navigator.userAgent.indexOf("MSIE") == -1) {
	document.write("<style type='text/css'>#warningIE {display:none;}</style>");
	$("#warningIE").hide();
}

// Initialize helper variables
var number;
var array;

if (enableAnimations) {
	var setDuration = 300;
} else {
	var setDuration = 0;
}

var allNumbers = [];
var allNames = [];
var allShortcuts = [];

var page = 1;
var totalPages = 1;
var totalCalls = 1;
var fromDate;
var toDate;
var callHistory = [];
var smsHistory = [];
var redirectedCalls = [];

var statsLine = -10;

var preload = false;


//temporary values

var selectedLine;
var selectedContact;
var selectedContactNumber;
var selectedContactName

function isTouchDevice() {
	return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

// Detect if user is logged in
function loggedIn() {
	// Is the data in localStorage?
	if (localStorage.getItem('username') !== null && localStorage.getItem('password') !== null || (APIuser != "" && APIpass != "")) {
		if (localStorage.getItem('username') !== null && localStorage.getItem('password') !== null) {
			APIuser = localStorage.getItem('username');
			APIpass = localStorage.getItem('password');
		}

		// Is the data valid?
		$.ajax({
			url: 'https://www.odorik.cz/api/v1/lines',
			type: 'GET',
			data: {
				user: APIuser,
				password: APIpass
			},
			success: function (result) {
				// Check if there are any errors
				if (result.indexOf("error") == -1) {
					// No errors
				} else {
					// Logout and try again
					logout();
				}
			}
		});
		return true;
	} else {
		return false;
	}
}

// Show login dialog
function logInDialog() {
	// Initialitze helper variable
	badlogin = false;
	// Show the dialog
	$('#loginModal').modal({
		closable: false,
		duration: setDuration,
		blurring: true,
		onApprove: function () {
			// Animate button
			$("#loginModal .button").addClass("loading");

			// Get values from fields
			APIuser = $('input[name="login-name"]').val();
			APIpass = $('input[name="login-pass"]').val();

			// Connect to API
			$.ajax({
				url: 'https://www.odorik.cz/api/v1/lines',
				type: 'GET',
				data: {
					user: APIuser,
					password: APIpass
				},
				success: function (result) {
					// Stop button animation
					$("#loginModal .button").removeClass("loading");
					// Check if there are any errors
					if (result.indexOf("error") == 0) {
						// Show error animations
						$("#loginModal").transition('shake', setDuration + "ms");
						if (badlogin)
							$('#badLogin').transition("pulse", setDuration + "ms");
						else {
							$('#badLogin').transition("fade", setDuration + "ms");
							badlogin = true;
						}
					} else {
						// Hide and log in
						$('#loginModal').modal('hide');
						init();

						localStorage.setItem('username', APIuser);
						//localStorage.setItem('password', APIpass); // TODO Save password is not secure
					}
				}
			});

			return false;
		}
	}).modal('show');
}

// Show logout confirmation modal
function logoutModal() {
	openDialog('logout-user');
}

// Log out the user
function logout() {
	localStorage.removeItem('username');
	localStorage.removeItem('password');
	window.close();
	location.reload();
}

// Initialize date
function initDate() {
	if (typeof localStorage.lastDate == "undefined") {
		$('#reportrange span').html(moment().subtract(29, 'days').format('DD.MM.YYYY') + ' - ' + moment().format('DD.MM.YYYY'));
	}
	else {
		if (localStorage.lastDate == "today") {
			$('#reportrange span').html(moment().format('DD.MM.YYYY') + ' - ' + moment().format('DD.MM.YYYY'));
		}
		else {
			$('#reportrange span').html(localStorage.lastDate);
		}
	}

	fromDate = moment($('#reportrange span').text().split(" - ")[0], 'DD.MM.YYYY').toISOString();
	toDate = moment($('#reportrange span').text().split(" - ")[1], 'DD.MM.YYYY').add(1, "days").toISOString();
}
initDate();

// Initialize dropdown with section selection
function initDropdown() {
	var firstRun = true;
	$('.ui.dropdown').dropdown();
	$("#statistics-line").dropdown({
		onChange: function (value, text, $selectedItem) {
			if (value != "all") {
				statsLine = value;
			}
			else {
				statsLine = -10;
			}
			loadStatistics();
		}
	});
	$('#categorySelector').dropdown({
		onChange: function (value, text, $selectedItem) {
			if (!firstRun) {

				if (value == "logout") {
					logoutModal();

					$(".ui.dropdown").dropdown("set selected", localStorage.prevCategory);

				} else {
					localStorage.setItem("prevCategory", value);
					$('#categorySelector').addClass("loading");
				}
				switch (value) {
					case "speedDials":
						loadContacts();
						break;
					case "callHistory":
						loadCalls();
						break;
					case "smsHistory":
						loadSms();
						break;
					case "activeCalls":
						loadActiveCalls();
						break
					case "lines":
						loadLines();
						break;
					case "simCards":
						loadSimCards();
						break;
					case "mobileData":
						loadMobileData();
						break;
					case "statistics":
						loadStatistics();
				}
			}
			else {
				firstRun = false;
			}
		}
	});
}
initDropdown();

if (typeof localStorage.order == "undefined") {
	$("select[name=call-order]").val("newest");
	localStorage.order = "newest"
}

if (localStorage.order == "newest") {
	$("select[name=call-order]").val("newest");
}
else {
	$("select[name=call-order]").val("oldest");
}

// Is user logged in?
if (loggedIn()) {
	init(); // Load page
} else {
	logInDialog(); // Show login dialog
}

// Initialization
function init() {
	$("#loadingDimmer").dimmer("show");
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/balance',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass
		}
	}).done(function (data, textStatus, xhr) {
		$("#credit").html("<b>Kredit: </b>" + data + "&nbsp;Kč");
	});

	updateLines();
	$("input[name=call-number]").val(defaultCallbackNumber);

	if (typeof localStorage.prevCategory == "undefined") {
		localStorage.setItem("prevCategory", "speedDials");
	}

	// Load contacts/calls

	preload = true;
	loadContacts();

	$(".ui.dropdown").dropdown("set selected", localStorage.prevCategory);
	$("." + localStorage.prevCategory + "Content").show();

	switch (localStorage.prevCategory) {
		case "speedDials":
			loadContacts();
			break;
		case "statistics":
			loadStatistics();
			break;
		case "smsHistory":
			loadSms();
			break;
		case "activeCalls":
			loadActiveCalls();
			break;
		case "lines":
			loadLines();
			break;
		case "simCards":
			loadSimCards();
			break;
		case "mobileData":
			loadMobileData();
			break;
		default:
			$(".callHistoryContent").show();
			loadCalls();
	}
}

// Shows the "dimmer" element - for displaying error messages
function dim(status, text) {
	$('#dimmer h1 i').removeClass("warning sign checkmark");
	if (status == true) {
		$('#dimmer h1 i').addClass("checkmark");
	} else {
		$('#dimmer h1 i').addClass("warning sign");
	}
	$('#dimmer small').html(text);
	setTimeout("$('#dimmer').dimmer('show');", 800)
	setTimeout("$('#dimmer').dimmer('hide');", 2100);
}


// CONTACTS SECTION

// Reload list
function loadContacts() {
	allShortcuts = [];
	allNumbers = [];
	allNames = [];

	$.ajax({
		url: 'https://www.odorik.cz/api/v1/speed_dials.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass
		},
		success: function (result) {
			outstring = "";
			for (var i = 0; i < result.length; i++) {
				allNumbers.push(result[i].number);
				allShortcuts.push(result[i].shortcut);
				allNames.push(result[i].name);

				if (editableLine("main", result[i].shortcut)) {
					outstring
						+= '<tr onclick="simulateContextMenu(event)" oncontextmenu="contactContextMenu(event, \'' + result[i].shortcut + '\', \'' + result[i].number + '\', \'' + result[i].name + '\'); return false;">'
						+ '<td class="table-name-' + result[i].shortcut + '">' + result[i].name + '</td>'
						+ '<td class="table-num-' + result[i].shortcut + '">' + unifyPhoneNo(result[i].number) + '</td>'
						+ '<td class="center table-short-' + result[i].shortcut + '">' + result[i].shortcut + '</td>'
						+ '<td>'
						+ '</td></tr>';
				} else {
					if (hideLockedNumbers == false) {
						outstring
							+= '<tr>'
							+ '<td class="table-name-' + result[i].shortcut + '">' + result[i].name + '</td>'
							+ '<td class="table-num-' + result[i].shortcut + '">' + unifyPhoneNo(result[i].number) + '</td>'
							+ '<td class="center table-short-' + result[i].shortcut + '">' + result[i].shortcut + '</td>'
							+ '<td>'
							+ '</td></tr>';
					}
				}
			}
			$("#tableContacts").html(outstring);


			if (preload == false) {
				if ($(".ui.container").css("display") == "none") {
					$("#loadingDimmer").dimmer("hide");
					$("#loadingDimmer").remove();
					$(".ui.container").transition("fade", setDuration + "ms");
				}

				$('#categorySelector').removeClass("loading");

				$("section").hide();
				$(".dynamic").hide();
				$(".speedDialsContent").show();
			}
			else {
				preload = false;
			}
		}
	});
}


// Remove Contact
function deleteContactModal(line, id) {
	selectedContact = id;
	selectedLine = line;
	openDialog('delete-contact');
}

function contactContextMenu(event, shortcut, number, name) {
	selectedContact = shortcut;
	selectedContactNumber = number;
	selectedContactName = name;
	openDialog('contactContextMenu');

	var dialog = document.getElementById('contactContextMenu');

	if (!isTouchDevice()) {
		var mouseX = event.clientX;
		var mouseY = event.clientY;

		var dialogWidth = dialog.offsetWidth;
		var dialogHeight = dialog.offsetHeight;

		var windowWidth = window.innerWidth;
		var windowHeight = window.innerHeight;

		var dialogLeft = 2 * ((windowWidth / 2) - windowWidth + mouseX);
		var dialogTop = 2 * ((windowHeight / 2) - windowHeight + mouseY);

		// Omezení pozicování dialogu, aby zůstal uvnitř okna
		if (dialogLeft < 2 * ((windowWidth / 2) - windowWidth) + dialogWidth + 40) {
			dialogLeft = 2 * ((windowWidth / 2) - windowWidth) + dialogWidth + 40;
		} else
		if (dialogLeft + dialogWidth + 40> windowWidth) {
			dialogLeft = windowWidth - dialogWidth - 40;
		}

		if (dialogTop < 2 * ((windowHeight / 2) - windowHeight) + dialogHeight + 40) {
			dialogTop = 2 * ((windowHeight / 2) - windowHeight) + dialogHeight + 40;
		} else if (dialogTop + dialogHeight + 40 > windowHeight) {
			dialogTop = windowHeight - dialogHeight - 40;
		}

		dialog.style.left = dialogLeft + 'px';
		dialog.style.top = dialogTop + 'px';
	}
}


function deleteContact() {
	if (selectedLine == "main") {
		requestURL = 'https://www.odorik.cz/api/v1/speed_dials/' + selectedContact + '.json';
	} else {
		requestURL = "https://www.odorik.cz/api/v1/lines/" + selectedLine + '/speed_dials/' + selectedContact + '.json';
	}

	document.getElementById("delete-contact").close();

	$.ajax({
		url: requestURL,
		type: 'DELETE',
		data: {
			user: APIuser,
			password: APIpass
		},
		success: function (result) {
			if (typeof result.errors != "undefined") {
				parseErrors(result);
			}
			setTimeout("loadContacts();", 500);
		}
	});
}


function splitContactName(fullname) {
	var name = (fullname.match(/^([^<]*)/)?.[1]?.trim()) || '';
	var surname = (fullname.match(/<b>(.*?)<\/b>/)?.[1]) || '';
	var note = (fullname.match(/<i>(.*?)<\/i>/)?.[1]) || '';
	return {
		name: name,
		surname: surname,
		note: note
	};
}

// Edit Contact
function editContact(line, id, name, number) {
	$('#edit-shortcut').val(id);
	$('#edit-name').val(splitContactName(name).name);
	$('#edit-surname').val(splitContactName(name).surname);
	$('#edit-note').val(splitContactName(name).note);
	$('#edit-number').val(unifyPhoneNo(number));

	$('#editModal').modal({
		duration: setDuration,
		blurring: true,
		onApprove: function () {
			if (line == "main") {
				requestURL = 'https://www.odorik.cz/api/v1/speed_dials/' + id + '.json';
			} else {
				requestURL = "https://www.odorik.cz/api/v1/lines/" + line + '/speed_dials/' + id + '.json';
			}

			var name = $('#edit-name').val().trim();
			var surname = $('#edit-surname').val().trim();
			var note = $('#edit-note').val().trim();

			var fullname = (
					(name !== '' ? name : '')
					+ (surname !== '' ? ' <b>' + surname + '</b>' : '')
					+ (note !== '' ? ' <i>' + note + '</i>' : '')
				).trim();

			$.ajax({
				url: requestURL,
				type: 'PUT',
				data: {
					user: APIuser,
					password: APIpass,
					shortcut: +$('#edit-shortcut').val(),
					name: fullname,
					number: sipPhoneNo($('#edit-number').val())
				},
				success: function (result) {
					if (typeof result.errors != "undefined") {
						parseErrors(result);
					}
					setTimeout("loadContacts();", 500);
				}
			});
		}
	}).modal('show');
}

// Add Contact
function addContact() {
	$('#addModal').modal({
		duration: setDuration,
		blurring: true,
		onApprove: function () {
			requestURL = 'https://www.odorik.cz/api/v1/speed_dials.json';

			var name = $('#add-name').val().trim();
			var surname = $('#add-surname').val().trim();
			var note = $('#add-note').val().trim();

			var fullname = (
					(name !== '' ? name : '')
					+ (surname !== '' ? ' <b>' + surname + '</b>' : '')
					+ (note !== '' ? ' <i>' + note + '</i>' : '')
				).trim();

			$.ajax({
				url: requestURL,
				type: 'POST',
				data: {
					user: APIuser,
					password: APIpass,
					shortcut: +$('#add-shortcut').val(),
					name: fullname,
					number: sipPhoneNo($('#add-number').val())
				},
				success: function (result) {
					if (typeof result.errors != "undefined") {
						parseErrors(result);
					}
					setTimeout("loadContacts();", 500);
				}
			});
		}
	}).modal('show');
}

// Parse errors
function parseErrors(resp) {
	var error = resp.errors[0];
	if (error.indexOf("unauthorized") >= 0) {
		showError("Nejste autorizováni k provedení této operace.");
	}
	if (error.indexOf("invalid_number") >= 0) {
		showError("Neplatné číslo.");
	}
	if (error.indexOf("invalid_shortcut") >= 0) {
		showError("Neplatná zkratka.");
	}
	if (error.indexOf("name_too_long") >= 0) {
		showError("Název je příliš dlouhý.");
	}
	if (error.indexOf("shortcut_already_used") >= 0) {
		showError("Zkratka je již použita.");
	}
	if (error.indexOf("speed_dials_full") >= 0) {
		showError("Rychlé kontakty jsou už plné.");
	}
}

// Display errors
function showError(message) {
	dim(false, message);
}

// Detect uneditable lines
function editableLine(line, number) {
	return $.inArray(number + "", lockedNumbers.split(",")) == -1;
}

function inlineEdit(id) {
	$(".edited").each(function () {
		$(this).text($(this).find("input").val());
	});
	//console.log($('.table-name-' + id).text());
	$(".edited").removeClass("edited");
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/speed_dials/' + id + '.json',
		type: 'PUT',
		data: {
			user: APIuser,
			password: APIpass,
			shortcut: $('.table-short-' + id).text(),
			name: $('.table-name-' + id).text(),
			number: $('.table-num-' + id).text()
		},
		success: function (result) {
			if (typeof result.errors != "undefined") {
				parseErrors(result);
			}
			setTimeout("loadContacts();", 500);
		}
	});
}

// Call back
function callBack(number, shortcut, name) {
	if (typeof shortcut !== "undefined") {
		$('input[name="call-target"]').val(number
			+ " - zk. " + shortcut
			+ " (" + (splitContactName(name).name + ' ' + splitContactName(name).surname + ' ' + splitContactName(name).note).trim() + ")");
	} else {
		$('input[name="call-target"]').val(number);
	}

	if (defaultCallbackLine != "") {
		$('select[name="call-line"]').dropdown("set selected", defaultCallbackLine);
	}

	$('#callModal').modal({
		duration: setDuration,
		blurring: true,
		onApprove: function () {
			$('#callModal form').submit();
			//Return false as to not close modal dialog
			return false;
		}
	}).modal('show');

	//form validation and submit
	$('#callModal form').form({
		fields: {
			callNumber: {
				identifier: 'call-number',
				rules: [{
					type: 'regExp[/^((\\*[0-9]{6})|([0-9]{2,3})|([0-9]{9,16}))$/]'
				}]
			}
		}
	})
		.api({
			url: 'https://www.odorik.cz/api/v1/callback',
			method: 'POST',
			data: {
				user: APIuser,
				password: APIpass,
				recipient: number,
			},
			beforeSend: function (settings) {
				settings.data.caller = $('input[name="call-number"]').val()
				if ($('select[name="call-line"]').val() != "none") {
					settings.data.line = $('select[name="call-line"]').val();
				}
				return settings;
			},
			onComplete: function (response) {
				$('#callModal').modal('hide');
				if (response && response.indexOf("error") != 0) dim(true, "Callback objednán");
				else if (response) dim(false, "Došlo k chybě. Zkontrolujte zadané číslo.");
				else dim(false, "Došlo k chybě. Nelze se připojit k Odorik API.");
			},
		});
}

// Quick Callback input box
$("input[name=quick-input]").keypress(function (e) {
	if (e.which == 13) {
		callBack($("input[name=quick-input]").val());
	}
});
$("#quick-button").click(function (event) {
	callBack($("input[name=quick-input]").val());
});

var textFile = null,
	makeTextFile = function (text) {
		var data = new Blob([text], { type: 'text/plain' });

		// If we are replacing a previously generated file we need to
		// manually revoke the object URL to avoid memory leaks.
		if (textFile !== null) {
			window.URL.revokeObjectURL(textFile);
		}

		textFile = window.URL.createObjectURL(data);

		// returns a URL you can use as a href
		return textFile;
	};

// Import/Export modal
function importExportModal() {
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/speed_dials.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass
		},
		success: function (result) {
			array = result;
			outstring = '\ufeff'; // EF BB BF = BOM
			for (var i = 0; i < result.length; i++) {
				outstring += "BEGIN:VCARD\r\n";
				outstring += "VERSION:3.0\r\n";
				outstring += "FN:" + result[i].name + "\r\n";
				outstring += "TEL;TYPE=CELL:" + result[i].number + "\r\n";
				outstring += "NOTE:" + result[i].shortcut + "\r\n";
				outstring += "END:VCARD\r\n";
			}
			$("#exportButton").attr("href", makeTextFile(outstring));
		}
	});

	$('#importExportModal').modal({
		duration: setDuration,
		blurring: true
	}).modal('show');
}

// Read file
$("#importButton").click(function () {
	$("#importButton").addClass("loading");
	$("#fileinput").trigger("click");
	if (window.File && window.FileReader && window.FileList && window.Blob) {
		$("#fileinput").change(function (event) {
			var reader = new FileReader();
			reader.onload = function (e) {
				var text = reader.result;
				if (text.indexOf("VCARD") > 0) {
					importVCard(text);
				}
				else {
					alert("Toto není platný soubor vCard");
				}
			}

			reader.readAsText(event.target.files[0], "utf-8");
		});
	} else {
		dim(false, "Váš prohlížeč nepodporuje tuto funkci. Aktualizujte jej.");
	}
});

// Parse vCard
function parse(input) {
	var Re1 = /^(version|fn|title|org|note):(.+)$/i;
	var Re2 = /^([^:;]+);([^:]+):(.+)$/;
	var ReKey = /item\d{1,2}\./;
	var fields = {};

	input.split(/\r\n|\r|\n/).forEach(function (line) {
		var results, key;

		if (Re1.test(line)) {
			results = line.match(Re1);
			key = results[1].toLowerCase();
			fields[key] = results[2];
		} else if (Re2.test(line)) {
			results = line.match(Re2);
			key = results[1].replace(ReKey, '').toLowerCase();

			var meta = {};
			results[2].split(';')
				.map(function (p, i) {
					var match = p.match(/([a-z]+)=(.*)/i);
					if (match) {
						return [match[1], match[2]];
					} else {
						return ["TYPE" + (i === 0 ? "" : i), p];
					}
				})
				.forEach(function (p) {
					meta[p[0]] = p[1];
				});

			if (!fields[key]) fields[key] = [];

			fields[key].push({
				meta: meta,
				value: results[3].split(';')
			})
		}
	});

	return fields;
};

// Helper function for replacing strings
function replaceAll(find, replace, str) {
	return str.replace(new RegExp(find, 'g'), replace);
}

// Unify phone number formats
function unifyPhoneNo(phoneNumber) {
	const regexPattern = /^(\+|00)(2[1-69][0-9]|3[578][0-9]|42[0-9]|5[09][0-9]|6[7-9][0-9]|8[0578][0-9]|9[679][0-9]|[2-689][0-9]|[017])(.*)$/;
	const replaced = phoneNumber.trim().replace(/\t/g, ' ');
	const result = replaced.replace(regexPattern, '+$2 $3');
	return result;
}

function sipPhoneNo(phoneNumber) {
	// Odstranění bílých znaků
	phoneNumber = phoneNumber.replace(/\s/g, '');
	// Převod "+" na "00" na začátku
	phoneNumber = phoneNumber.replace(/^\+/, '00');
	// Ponechání pouze číselných znaků
	phoneNumber = phoneNumber.replace(/\D/g, '');
	// Doplnění "00420" na začátek (pokud nezačíná "00")
	if (!phoneNumber.startsWith('00')) {
		phoneNumber = '00420' + phoneNumber;
	}
	return phoneNumber;
}

function toSymbol(str) {
	switch (String(str).toLowerCase()) {
		case "active":
		case "true":
		case "yes":
		case "on":
			return "✅";
		case "inactive":
		case "false":
		case "no":
		case "off":
			return "❌";
		case "warning":
			return "⚠️";
		case "error":
			return "❗️";
		case "info":
			return "ℹ️";
		case "blocked":
			return "⛔";
		case "null":
		case "none":
		case "undefined":
	 		return "🔹"; //➖
		default:
			return str;
	}
}

function formatNumber(number) {
	const str = number.toString();
	const parts = [];

	for (let i = str.length; i > 0; i -= 3) {
		parts.unshift(str.substring(Math.max(0, i - 3), i));
	}

	const formattedParts = parts.map(part => `<span>${part}</span>`);
	return formattedParts.join("");
}

function removeNonUCS2Chars(text) {
	var cleanedText = '';
	for (var i = 0; i < text.length; i++) {
		var charCode = text.charCodeAt(i);

		// Kontrola surrogátních párů UTF-16
		if (charCode < 0xD800 || charCode > 0xDFFF) {
		cleanedText += text[i];
		}
	}
	return cleanedText;
}

function optimiseSMS(sms) {
	var smsPreview = '';
	sms = removeNonUCS2Chars(sms);
	if (sms.normalize("NFD").replace(/[\u0300-\u036f]/g, "").length <= 70) {
		smsPreview = sms; //removeNonUCS2Chars(sms)
		var smsLength = sms.normalize("NFD").replace(/[\u0300-\u036f]/g, "").length;
	}
	else {
		sms = sms.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
		var GSMCharset = "@£$¥èéùìòÇØøÅå\u0394_Øø\u03A6ÆæßÉ !\"#¤%&amp;'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà€{}|~[]\\^\n";

		for (var i = 0; i < sms.length; i++) {
			var char = sms.charAt(i);
			var charIndex = GSMCharset.indexOf(char);
			if (charIndex !== -1) {
				//smsPreview += String.fromCharCode(charIndex);
				smsPreview += sms[i];
			}
		}
		var smsLength = smsPreview.length + smsPreview.replace(/[^€{}|~[\]\\^]/g, '').length;
	}

	document.getElementById('sms-preview').value = smsPreview;
	document.getElementById('sms-char-count').textContent = smsLength;
	document.getElementById('sms-count').textContent = (smsLength > 1 && smsLength < 161) ? 1 : Math.ceil(smsLength / 153);
}

function sendSMS() {
	var sms = document.getElementById('sms-preview').value;
	var recipient = sipPhoneNo(document.getElementById('sms-recipient').value);
	//var sender = document.getElementById('sms-sender').value;

	$.ajax({
		url: 'https://www.odorik.cz/api/v1/sms',
		type: 'POST',
		data: {
			user: APIuser,
			password: APIpass,
			recipient: recipient,
			message: sms
		},
		success: function (result) {
			if (typeof result.errors != "undefined") {
				//alert(result);
				parseErrors(result);
			} else {
				document.getElementById("compose-sms").close();
				reloadSms();
			}
		}
	})
}

// Separate into individual contacts
function separate(input) {
	card = [];
	array = input.split("END:VCARD");
	for (i = 0; i < array.length; i++) {
		card[i] = parse(array[i] + "END:VCARD");
	}
	return card;
}

// Import Wizard modal
function importVCard(input) {
	// Clear table
	$("#tableImport").html("");
	// Initialize helper variables
	var usedShortcuts = [];
	var usedNumbers = [];
	var contacts = separate(replaceAll("TEL:", "TEL;TYPE=HOME:", input));
	var totalCount = 0;
	// Loop through individual contacts
	for (i = 0; i < contacts.length; i++) {
		contact = contacts[i];
		// Check if number and name is set
		if (typeof contact.tel != "undefined" && typeof contact.fn != "undefined") {
			// Loop through specific phone numbers
			for (a = 0; a < contact.tel.length; a++) {
				if ($.inArray(unifyPhoneNo(contact.tel[a].value[0]), usedNumbers) == -1) {
					usedNumbers.push(unifyPhoneNo(contact.tel[a].value[0]));
					totalCount += 1;
					var shortcut = "";
					// Check if the shortcut is defined and if not, define it
					if (typeof contact.note == "undefined" || isNaN(contact.note)) {
						shortcut = totalCount;
						while ($.inArray(shortcut, allShortcuts) > -1 || $.inArray(shortcut, usedShortcuts) > -1 || shortcut < 200 && shortcut > 99) {
							shortcut = shortcut + 1;
						}
					} else {
						shortcut = contact.note;
					}
					usedShortcuts.push(shortcut);
					// Add a description
					var type = "";
					if (contact.tel.length > 1) {
						//console.log("multiple");
						//console.log(contact.tel[a].meta);
						switch (contact.tel[a].meta.TYPE) {
							case "HOME":
								type = " (domů)";
								break;
							case "WORK":
								type = " (práce)";
								break;
							case "CELL":
								type = " (mobil)";
								break;
							case "FAX":
								type = " (fax)";
								break;
						}
					}
					// Warn against conflicts in shortcuts
					var warning = "";
					if ($.inArray(Number(shortcut), allShortcuts) > -1) {
						warning = "error";
					}
					// Append to table
					$("#tableImport").append("<tr class='" + warning + "'><td><div class='ui transparent left icon fluid " + warning + " input'><i style='display: none' class='remove icon'></i><input class='shortuctImport' id='import-shortuct" + i + "' type='number' min='1' value='" + shortcut + "'></div></td>" + "<td><div class='ui transparent fluid input'><input id='import-name" + i + "' value='" + contact.fn + type + "'></div></td>" + "<td><div class='ui transparent fluid input'><input id='import-number" + i + "' type='tel' value='" + unifyPhoneNo(contact.tel[a].value[0]) + "'></div></td></tr>");
				}
			}
			// Check for change in shortcuts and hide conflict warnings
			$(".shortuctImport").change(function () {
				if ($.inArray(Number($(this).val()), allShortcuts) == -1) {
					$(this).parent().removeClass("error");
					$(this).parent().parent().removeClass("error");
					$(this).parent().parent().find("i").hide();
				}
				else {
					$(this).parent().addClass("error");
					$(this).parent().parent().addClass("error");
					$(this).parent().parent().find("i").show();
				}
			});
		}
	}
	$("#importButton").removeClass("loading");
	// Show modal with table

	$("#importWizardModal").modal({
		duration: setDuration,
		onApprove: function () {
			// Loop through entries and save them
			for (i = 0; i < contacts.length; i++) {
				if (typeof $("#import-shortuct" + i).val() != "undefined") {
					$.ajax({
						url: 'https://www.odorik.cz/api/v1/speed_dials.json',
						type: 'POST',
						data: {
							user: APIuser,
							password: APIpass,
							shortcut: $("#import-shortuct" + i).val(),
							name: $("#import-name" + i).val(),
							number: $("#import-number" + i).val()
						},
					});
				}
			}
			setTimeout("loadContacts();", 1200);
		}
	}).modal("show");
}

$("#addModal input").keypress(function (e) {
	if (e.which == 13) {
		$("#addModal .positive").click();
	}
});

$("#editModal input").keypress(function (e) {
	if (e.which == 13) {
		$("#editModal .positive").click();
	}
});

$("#loginModal input").keypress(function (e) {
	if (e.which == 13) {
		$("#loginModal .positive").click();
	}
});


// CALL HISTORY SECTION

var cb = function (start, end, label) {
	fromDate = start.toISOString();
	toDate = end.toISOString();
	$('#reportrange span').html(start.format('DD.MM.YYYY') + ' - ' + end.format('DD.MM.YYYY'));
	if (moment().format('DD.MM.YYYY') == start.format('D.MM.YYYY')) {
		localStorage.setItem("lastDate", "today");
	}
	else {
		localStorage.setItem("lastDate", start.format('DD.MM.YYYY') + ' - ' + end.format('DD.MM.YYYY'));
	}
	if (localStorage.prevCategory == "statistics") {
		loadStatistics();
	}
	else if (localStorage.prevCategory == "smsHistory") {
		loadSms();
	}
	else {
		loadCalls();
	}
};

var optionSet = {
	startDate: moment($('#reportrange span').text().split(" - ")[0], 'DD.MM.YYYY'),
	endDate: moment($('#reportrange span').text().split(" - ")[1], 'DD.MM.YYYY'),
	dateLimit: {
		days: 60
	},
	showDropdowns: true,
	showWeekNumbers: true,
	timePicker: false,
	timePickerIncrement: 1,
	timePicker12Hour: true,
	ranges: {
		'Dnes': [moment(), moment()],
		'Včera': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
		'Předevčírem': [moment().subtract(2, 'days'), moment().subtract(2, 'days')],
		'Posledních 7 dní': [moment().subtract(6, 'days'), moment()],
		'Posledních 30 dní': [moment().subtract(29, 'days'), moment()],
		'Tento měsíc': [moment().startOf('month'), moment().endOf('month')],
		'Minulý měsíc': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
		'Posledních 60 dní': [moment().subtract(59, 'days'), moment()],
	},
	opens: 'right',
	buttonClasses: ['ui compact button'],
	applyClass: 'primary small',
	cancelClass: 'small',
	format: 'DD.MM.YYYY',
	separator: ' - ',
	locale: {
		applyLabel: 'Uložit',
		cancelLabel: 'Zrušit',
		fromLabel: 'Od',
		toLabel: 'Do',
		customRangeLabel: 'Vlastní',
		weekLabel: 'T',
		daysOfWeek: ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'],
		monthNames: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'],
		firstDay: 1
	}
};

$('#reportrange').daterangepicker(optionSet, cb);

Array.prototype.diff = function (a) {
	return this.filter(function (i) { return a.indexOf(i) < 0; });
};

// Reload Calls
function reloadCalls() {
	if (page < 1) {
		page = 1;
	}

	var startRange = Number((page - 1) * pageLength);
	var endRange = page * pageLength;
	var data = callHistory.slice(startRange, endRange);

	$("#nextPage").toggleClass("disabled", data.length != pageLength);
	$("#prevPage").toggleClass("disabled", page <= 1);

	populateCallsTable(data);
}

function loadCalls() {
	callHistory = [];
	callsAmount(function (data, textStatus, xhr) {
		totalCalls = xhr.getResponseHeader('Odorik-Pages');
		var dataSet = {
			user: APIuser,
			password: APIpass,
			from: fromDate,
			to: toDate,
			page_size: 5000
		};
		if ($("select[name=line-filter]").val() != "all") {
			dataSet.line = $("select[name=line-filter]").val();
		}
		if ($("select[name=state-filter]").val() != "all") {
			dataSet.status = $("select[name=state-filter]").val();
		}
		if ($("select[name=direction-filter]").val() != "all") {
			dataSet.direction = $("select[name=direction-filter]").val();
		}
		if ($("select[name=price-filter]").val() != "all") {
			if ($("select[name=price-filter]").val() == "free") {
				dataSet.min_price = "0";
				dataSet.max_price = "0";
			}
			else {
				dataSet.min_price = "0";
				dataSet.max_price = "1000";
			}
		}

		$.ajax({
			url: 'https://www.odorik.cz/api/v1/calls.json',
			type: 'GET',
			data: dataSet
		}).done(function (data, textStatus, xhr) {
			if ($("select[name=call-order]").val() == "newest") {
				try {
					data = data.reverse();
				}
				catch (err) {
					// data jsou nulová - neobrátíme je
				}
			}

			var finalData = [];

			for (var i = 0; i < data.length; i++) {
				if ($.inArray(data[i].line + "", allowedLines.split(",")) != -1 || allowedLines == "") {
					if (data[i].direction != "redirected") {
						finalData.push(data[i]);
					}
					else {
						if ($.inArray(data[i].redirection_parent_id, redirectedCalls) == -1) {
							redirectedCalls.push(data[i].redirection_parent_id);
						}
					}
				}
			}

			data = finalData;

			callHistory = callHistory.concat(data);

			if ($(".ui.container").css("display") == "none") {
				$("#loadingDimmer").dimmer("hide");
				$("#loadingDimmer").remove();
				$(".ui.container").transition("fade", setDuration + "ms");
			}

			$('#categorySelector').removeClass("loading");
			$("section").hide();
			$(".dynamic").hide();
			$(".callHistoryContent").show();

			reloadCalls();
		});
	});
}

function populateCallsTable(result) {
	outstring = "";
	for (var i = 0; i < result.length; i++) {
		outstring += '<tr class="';
		if (result[i].status == "missed") {
			outstring += "error";
		}
		outstring += '"';
		outstring += ' data-id="' + result[i].id + '" ';
		if (result[i].redirection_parent_id != "" && typeof result[i].redirection_parent_id != "undefined") {
			outstring += ' data-redirection-id="' + result[i].redirection_parent_id + '"';
		}
		outstring += '><td>';

		if ($.inArray(result[i].id.toString(), redirectedCalls) != -1) {
			outstring += '<a onclick="redirectionsModal(' + "'" + result[i].id + "','" + result[i].date + "'" + ');" class="ui teal ribbon label"><i class="forward mail icon"></i></a>';
		}

		outstring += '<span class="hasClickPopup" data-html="<b>ID:</b> ' + result[i].id + '">';

		switch (result[i].direction) {
			case "redirected":
				outstring += '<i class="forward mail icon"></i>Přesměrovaný';
				break;
			case "in":
				outstring += '<i class="sign in icon"></i>Příchozí';
				break;
			case "out":
				outstring += '<i class="sign out icon"></i>Odchozí';
				break;
		}

		if (result[i].status == "missed") {
			outstring += " nepřijatý";
		}

		outstring += '</span> ';
		var price = result[i].price.toString().substr(0, result[i].price.toString().indexOf(".") + 3);
		var callLength = ~~(result[i].length / 60) + "&nbsp;min " + (result[i].length % 60) + "&nbsp;s";
		if (result[i].length < 60)
			callLength = (result[i].length % 60) + "&nbsp;s";
		outstring += '</td><td class="hasClickPopup" data-html="' + moment(result[i].date).format("DD.MM.YYYY H:mm:ss") + '">'
			+ moment(result[i].date).format("DD.MM.YYYY H:mm:ss") + '</td><td>'
			+ getSpeedDialName(result[i].source_number) + '</td><td class="hasPopup" data-html="<b>Podrobnosti:</b> '
			+ result[i].destination_name + '">'
			+ getSpeedDialName(result[i].destination_number) + '</td><td class="right hasPopup" data-html="<b>Délka vyzvánění:</b> '
			+ result[i].ringing_length + '&nbsp;s">'
			+ callLength + '</td><td class="right hasPopup" data-html="<b>Minutová sazba:</b> '
			+ result[i].price_per_minute + '&nbsp;Kč<br><b>Zbylý kredit:</b> '
			+ result[i].balance_after + '&nbsp;Kč">'
			+ price + '&nbsp;Kč</td><td class="center">' + result[i].line + '</td></tr>';
	}
	$("#tableCalls").html(outstring);
	$(".hasClickPopup").popup({ on: "click" });
	$(".hasPopup").popup();
	$("#pageNumber").text(page + " z " + Math.ceil(callHistory.length / pageLength));
}

// Get name of the contact
function getSpeedDialName(number) {
	if ($.inArray(number, allNumbers) != -1) {
		return allNames[$.inArray(number, allNumbers)] + " (" + unifyPhoneNo(number) + ")";
	}
	else {
		return unifyPhoneNo(number);
	}
}

// Redirections dialog
function redirectionsModal(id, time) {
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/calls.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass,
			from: moment(time).subtract(2, "hours").toISOString(),
			to: moment(time).add(2, "hours").toISOString(),
			direction: "redirected"
		}
	}).done(function (data, textStatus, xhr) {
		outstring = "";
		var result = data;
		for (var i = 0; i < result.length; i++) {
			if (result[i].redirection_parent_id == id) {
				outstring += '<tr class="';
				if (result[i].status == "missed") {
					outstring += "error";
				}
				outstring += '">';
				outstring += '<td class="hasPopup" data-html="' + moment(result[i].date).format("DD.MM.YYYY H:mm:ss") + '">' + moment(result[i].date).format("DD.MM.YYYY H:mm:ss") + '</td><td>' + getSpeedDialName(result[i].source_number) + '</td><td class="hasPopup" data-html="<b>Podrobnosti:</b> ' + result[i].destination_name + '">' + getSpeedDialName(result[i].destination_number) + '</td><td class="right hasPopup" data-html="<b>Délka vyzvánění:</b> ' + result[i].ringing_length + '&nbsp;s">' + result[i].length + '&nbsp;s</td><td class="right hasPopup" data-html="<b>Minutová sazba:</b> ' + result[i].price_per_minute + '&nbsp;Kč<br><b>Zbylý kredit:</b> ' + result[i].balance_after + '&nbsp;Kč">' + result[i].price + '&nbsp;Kč</td><td class="center">' + result[i].line + '</td></tr>';
			}
		}

		$("#tableRedirects").html(outstring);
		$(".hasPopup").popup();
		$("#redirectionsModal").modal({
			duration: setDuration,
			blurring: true
		}).modal('show');
	});
}

// Filter dialog
function filterModal() {
	$("#filterModal").modal({
		duration: setDuration,
		blurring: true,
		onApprove: function () {
			localStorage.setItem("order", $("select[name=call-order]").val());

			if (localStorage.prevCategory == "smsHistory") {
				loadSms();
			}
			else {
				loadCalls();
			}

		}
	}).modal('show');
}

// Update lines
function updateLines() {
	if (allowedLines != "") {
		$("select[name=line-filter]").parent().addClass("disabled");
	}
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/lines.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass,
		},
		success: function (result) {
			array = result;
			for (var i = 0; i < result.length; i++) {
				$("select[name=line-filter]").append('<option value="' + result[i].id + '">' + result[i].id + ': ' + result[i].name + '</option>');
				$("select[name=call-line]").append('<option value="' + result[i].id + '">' + result[i].id + ': ' + result[i].name + '</option>');
				$("#statistics-line .menu").append('<div class="item" data-value="' + result[i].id + '">' + result[i].id + ': ' + result[i].name + '</div>');
			}
		}
	});
}

// Get total amount of calls
function callsAmount(finishedFunction) {
	var dataSet = {
		user: APIuser,
		password: APIpass,
		from: fromDate,
		to: toDate,
		page_size: 1,
		page: page
	};
	if ($("select[name=line-filter]").val() != "all") {
		dataSet.line = $("select[name=line-filter]").val();
	}
	if ($("select[name=state-filter]").val() != "all") {
		dataSet.status = $("select[name=state-filter]").val();
	}
	if ($("select[name=direction-filter]").val() != "all") {
		dataSet.direction = $("select[name=direction-filter]").val();
	}
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/calls.json',
		type: 'GET',
		data: dataSet
	}).done(finishedFunction);
}


// SMS HISTORY

// Reload SMS
function reloadSms() {
	if (page < 1) {
		page = 1;
	}

	var startRange = Number((page - 1) * pageLength);
	var endRange = page * pageLength;
	var data = smsHistory.slice(startRange, endRange);

	$("#nextSmsPage").toggleClass("disabled", data.length != pageLength);
	$("#prevSmsPage").toggleClass("disabled", page <= 1);

	populateSmsTable(data);
}

function loadSms() {
	smsHistory = [];
	callsAmount(function (data, textStatus, xhr) {
		totalCalls = xhr.getResponseHeader('Odorik-Pages');
		var dataSet = {
			user: APIuser,
			password: APIpass,
			from: fromDate,
			to: toDate,
			page_size: 5000
		};
		if ($("select[name=line-filter]").val() != "all") {
			dataSet.line = $("select[name=line-filter]").val();
		}
		if ($("select[name=state-filter]").val() != "all") {
			dataSet.status = $("select[name=state-filter]").val();
		}
		if ($("select[name=direction-filter]").val() != "all") {
			dataSet.direction = $("select[name=direction-filter]").val();
		}
		if ($("select[name=price-filter]").val() != "all") {
			if ($("select[name=price-filter]").val() == "free") {
				dataSet.min_price = "0";
				dataSet.max_price = "0";
			}
			else {
				dataSet.min_price = "0";
				dataSet.max_price = "1000";
			}
		}

		$.ajax({
			url: 'https://www.odorik.cz/api/v1/sms.json',
			type: 'GET',
			data: dataSet
		}).done(function (data, textStatus, xhr) {
			if ($("select[name=call-order]").val() == "newest") {
				try {
					data = data.reverse();
				}
				catch (err) {
					// data jsou nulová - neobrátíme je
				}
			}

			var finalData = [];

			for (var i = 0; i < data.length; i++) {
				if ($.inArray(data[i].line + "", allowedLines.split(",")) != -1 || allowedLines == "") {
					if (data[i].direction != "redirected") {
						finalData.push(data[i]);
					}
					else {
						if ($.inArray(data[i].redirection_parent_id, redirectedCalls) == -1) {
							redirectedCalls.push(data[i].redirection_parent_id);
						}
					}
				}
			}

			data = finalData;

			smsHistory = smsHistory.concat(data);

			if ($(".ui.container").css("display") == "none") {
				$("#loadingDimmer").dimmer("hide");
				$("#loadingDimmer").remove();
				$(".ui.container").transition("fade", setDuration + "ms");
			}

			$('#categorySelector').removeClass("loading");
			$("section").hide();
			$(".dynamic").hide();
			$(".smsHistoryContent").show();

			reloadSms();
		});
	});
}

function populateSmsTable(result) {
	outstring = "";
	for (var i = 0; i < result.length; i++) {
		outstring += '<tr data-id="' + result[i].id + '" ';
		if (result[i].redirection_parent_id != "" && typeof result[i].redirection_parent_id != "undefined") {
			outstring += ' data-redirection-id="' + result[i].redirection_parent_id + '"';
		}
		outstring += '><td>';

		if ($.inArray(result[i].id.toString(), redirectedCalls) != -1) {
			outstring += '<a onclick="redirectionsModal(' + "'" + result[i].id + "'" + ',' + "'" + result[i].date + "'" + ');" class="ui teal ribbon label"><i class="forward mail icon"></i></a>';
		}

		outstring += '<span class="hasClickPopup" data-html="<b>ID:</b> ' + result[i].id + '">';

		if (result[i].direction == "redirected") {
			outstring += '<i class="forward mail icon"></i>Přesměrovaný';
		}
		else if (result[i].direction == "in") {
			outstring += '<i class="sign in icon"></i>Příchozí';
		}
		else if (result[i].direction == "out") {
			outstring += '<i class="sign out icon"></i>Odchozí';
		}


		outstring += '</span> ';
		var price = result[i].price.toString().substr(0, result[i].price.toString().indexOf(".") + 3);
		var callLength = ~~(result[i].length / 60) + "&nbsp;min " + (result[i].length % 60) + "&nbsp;s";
		if (result[i].length < 60)
			callLength = (result[i].length % 60) + "&nbsp;s";
		outstring += '</td><td class="hasClickPopup" data-html="' + moment(result[i].date).format("DD.MM.YYYY H:mm:ss") + '">' + moment(result[i].date).format("DD.MM.YYYY H:mm:ss") + '</td><td>'
			+ getSpeedDialName(result[i].source_number) + '</td><td>'
			+ getSpeedDialName(result[i].destination_number) + '</span></td><td class="right hasPopup" data-html="'
			+ '<b>Zbylý kredit:</b> '
			+ result[i].balance_after + '&nbsp;Kč">'
			+ price + '&nbsp;Kč</td><td class="center">' + result[i].line + '</td></tr>';
	}
	$("#tableSms").html(outstring);
	$(".hasClickPopup").popup({ on: "click" });
	$(".hasPopup").popup();
	$("#pageSmsNumber").text(page + " z " + Math.ceil(smsHistory.length / pageLength));
}


function loadActiveCalls() {
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/active_calls.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass
		}
	}).done(function (data, textStatus, xhr) {
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			outString += "<tr><td class='center'>" + data[i].id + "</td><td>" + unifyPhoneNo(data[i].source_number) + "</td><td>" + unifyPhoneNo(data[i].destination_number) + "</td><td>" + data[i].destination_name + "</td><td>" + moment(data[i].start_date).format("DD.MM.YYYY H:mm:ss") + "</td><td>" + moment(data[i].answer_date).format("DD.MM.YYYY H:mm:ss") + "</td><td class='right'>" + data[i].price_per_minute + "</td><td class='center'>" + data[i].line + "</td></tr>"
		}
		$("#activeCalls").html(outString);
	});

	if ($(".ui.container").css("display") == "none") {
		$("#loadingDimmer").dimmer("hide");
		$("#loadingDimmer").remove();
		$(".ui.container").transition("fade", setDuration + "ms");
	}
	$('#categorySelector').removeClass("loading");
	$("section").hide();
	$(".dynamic").hide();
	$(".activeCallsContent").show();
}


function loadLines() {
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/lines.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass
		}
	}).done(function (data, textStatus, xhr) {
		//console.log(data);
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			outString += "<tr><td class='center hasClickPopup' data-html='<b>SIP password:</b> " + data[i].sip_password + "'>" + data[i].id + "</td><td>" + data[i].name + "</td><td>" + unifyPhoneNo(data[i].caller_id) + "</td><td class='center'>" + toSymbol(data[i].public_name) + "</td><td class='center'>" + toSymbol(data[i].backup_number) + "</td><td class='center'>" + toSymbol(data[i].active_822) + "</td><td class='center'>" + toSymbol(data[i].active_cz_restriction) + "</td><td class='center'>" + toSymbol(data[i].active_iax) + "</td><td class='center'>" + toSymbol(data[i].active_password) + "</td><td class='center'>" + toSymbol(data[i].active_pin) + "</td><td class='center'>" + toSymbol(data[i].active_ping) + "</td><td class='center'>" + toSymbol(data[i].active_rtp) + "</td><td class='center'>" + toSymbol(data[i].active_sip) + "</td><td class='center'>" + toSymbol(data[i].active_anonymous) + "</td><td class='center'>" + toSymbol(data[i].active_greeting) + "</td><td class='center'>" + toSymbol(data[i].missed_call_email) + "</td><td class='center'>" + toSymbol(data[i].recording_email) + "</td><td class='center'>" + toSymbol(data[i].voicemail_email) + "</td><td class='center'>" + toSymbol(data[i].backup_number_email) + "</td><td class='center'>" + data[i].incoming_call_name_format + "</td><td class='center'>" + data[i].incoming_call_number_format + "</td></tr>"
		}
		$("#lines").html(outString);
		$(".hasClickPopup").popup({ on: "click" });
	});

	if ($(".ui.container").css("display") == "none") {
		$("#loadingDimmer").dimmer("hide");
		$("#loadingDimmer").remove();
		$(".ui.container").transition("fade", setDuration + "ms");
	}
	$('#categorySelector').removeClass("loading");
	$("section").hide();
	$(".dynamic").hide();
	$(".linesContent").show();
}


function loadSimCards() {
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/sim_cards.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass
		}
	}).done(function (data, textStatus, xhr) {
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			outString += "<tr><td class='center'>" + data[i].id + "</td><td>" + data[i].sim_number + "</td><td class='center'>" + toSymbol(data[i].state) + "</td><td class='center'>" + data[i].changes_in_progress + "</td><td class='right'>" + toSymbol(data[i].data_package) + "</td><td class='right'>" + toSymbol(data[i].data_package_for_next_month) + "</td><td class='number'>" + formatNumber(toSymbol(data[i].data_bought_total)) + "</td><td class='number'>" + formatNumber(toSymbol(data[i].data_used)) + "</td><td class='center'>" + toSymbol(data[i].voice_package) + "</td><td class='center'>" + toSymbol(data[i].voice_package_for_next_month) + "</td><td class='center'>" + toSymbol(data[i].package_delayed_billing) + "</td><td class='center'>" + toSymbol(data[i].package_delayed_billing_for_next_month) + "</td><td class='center' title='" + data[i].missed_calls_register + "'>" + toSymbol(data[i].missed_calls_register) + "</td><td class='center' title='" + data[i].mobile_data + "'>" + toSymbol(data[i].mobile_data) + "</td><td class='center' title='" + data[i].lte + "'>" + toSymbol(data[i].lte) + "</td><td class='center' title='" + data[i].lte_for_next_month + "'>" + toSymbol(data[i].lte_for_next_month) + "</td><td class='center'>" + data[i].roaming + "</td><td class='center' title='" + data[i].premium_services + "'>" + toSymbol(data[i].premium_services) + "</td></tr>"
		}
		$("#simCards").html(outString);
	});


	if ($(".ui.container").css("display") == "none") {
		$("#loadingDimmer").dimmer("hide");
		$("#loadingDimmer").remove();
		$(".ui.container").transition("fade", setDuration + "ms");
	}
	$('#categorySelector').removeClass("loading");
	$("section").hide();
	$(".dynamic").hide();
	$(".simCardsContent").show();
}


function loadMobileData() {
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/sim_cards/mobile_data.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass,
			from: fromDate,
			to: toDate
		}
	}).done(function (data, textStatus, xhr) {
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			outString += "<tr><td class='center'>" + data[i].id + "</td><td>" + moment(data[i].date).format("DD.MM.YYYY H:mm:ss") + "</td><td class='number'>" + formatNumber(data[i].bytes_up) + "</td><td class='number'>" + formatNumber(data[i].bytes_down) + "</td><td class='number'>" + formatNumber(data[i].bytes_total) + "</td><td class='number'>" + formatNumber(data[i].price) + "</td><td class='number'>" + formatNumber(data[i].price_per_mb) + "</td><td>" + unifyPhoneNo(data[i].phone_number) + "</td></tr>"
		}
		$("#mobileData").html(outString);
	});

	if ($(".ui.container").css("display") == "none") {
		$("#loadingDimmer").dimmer("hide");
		$("#loadingDimmer").remove();
		$(".ui.container").transition("fade", setDuration + "ms");
	}
	$('#categorySelector').removeClass("loading");
	$("section").hide();
	$(".dynamic").hide();
	$(".mobileDataContent").show();
}


function loadStatistics() {
	var formatPrice = function (input) {
		var price = parseFloat(input.toFixed(3));
		if (price > 10) {
			price = price.toFixed(2);
		}
		if (Math.round(price) == price) {
			price = Math.round(price);
		}
		return price;
	};
	var formatLength = function (input) {
		var length = (input / 60).toFixed(1);
		if (length > 5 || Math.round(length) == length) {
			length = Math.round(length);
		}
		return length;
	};
	var dataSet = {
		user: APIuser,
		password: APIpass,
		from: fromDate,
		to: toDate
	};
	if (statsLine != -10) {
		dataSet.line = statsLine;
	}
	$.ajax({
		url: 'https://www.odorik.cz/api/v1/call_statistics.json',
		type: 'GET',
		data: dataSet
	}).done(function (data, textStatus, xhr) {

		$("#totalStatistics").html(
				"<tr><td><i class='sign in icon'></i>Příchozí hovory</td><td class='center'>" + data.incoming.count + "</td><td class='right'>" + formatLength(data.incoming.length) + "&nbsp;min</td><td class='right'>" + formatPrice(data.incoming.price) + "&nbsp;Kč</td></tr>"
			+ "<tr><td><i class='sign out icon'></i>Odchozí hovory</td><td class='center'>" + data.outgoing.count + "</td><td class='right'>" + formatLength(data.outgoing.length) + "&nbsp;min</td><td class='right'>" + formatPrice(data.outgoing.price) + "&nbsp;Kč</td></tr>"
			+ "<tr><td><i class='external share icon'></i>Přesměrované hovory</td><td class='center'>" + data.redirected.count + "</td><td class='right'>" + formatLength(data.redirected.length) + "&nbsp;min</td><td class='right'>" + formatPrice(data.redirected.price) + "&nbsp;Kč</td></tr>"
			);
	});

	$.ajax({
		url: 'https://www.odorik.cz/api/v1/call_statistics/by_destination.json',
		type: 'GET',
		data: dataSet
	}).done(function (data, textStatus, xhr) {
		//console.log(data);
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			var direction = "<i class='sign in icon'></i>Odchozí";
			if (data[i].direction == "redirected") {
				direction = "<i class='external share icon'></i>Přesměrované";
			}
			else if (data[i].direction == "in") {
				direction = "<i class='sign out icon'></i>Příchozí";
			}
			outString += "<tr><td>" + data[i].destination + "</td><td class='center'>" + data[i].count + "</td><td class='right'>" + formatLength(data[i].length) + "&nbsp;min</td><td class='right'>" + formatPrice(data[i].price) + "&nbsp;Kč</td><td class='right'>" + data[i].price_per_minute + "&nbsp;Kč</td><td class='center'>" + direction + "</td></tr>";
		}
		$("#destinationStatistics").html(outString);
	});

	$.ajax({
		url: 'https://www.odorik.cz/api/v1/call_statistics/missed_calls.json',
		type: 'GET',
		data: dataSet
	}).done(function (data, textStatus, xhr) {
		//console.log(data);
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			outString += "<tr><td>" + data[i].destination_number + "</td><td>" + data[i].count + "</td></tr>"
		}
		$("#missedStatistics").html(outString);
	});

	$.ajax({
		url: 'https://www.odorik.cz/api/v1/active_calls.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass
		}
	}).done(function (data, textStatus, xhr) {
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			outString += "<tr><td>" + data[i].id + "</td><td>" + data[i].source_number + "</td><td>" + data[i].destination_number + "</td><td>" + data[i].destination_name + "</td><td>" + data[i].start_date + "</td><td>" + data[i].answer_date + "</td><td>" + data[i].price_per_minute + "</td><td>" + data[i].line + "</td></tr>"
		}
		$("#activeCalls").html(outString);
	});


	$.ajax({
		url: 'https://www.odorik.cz/api/v1/lines.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass
		}
	}).done(function (data, textStatus, xhr) {
		//console.log(data);
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			outString += "<tr><td>" + data[i].id + "</td><td>" + data[i].name + "</td><td>" + data[i].caller_id + "</td><td>" + data[i].public_name + "</td><td>" + data[i].backup_number + "</td><td>" + data[i].sip_password + "</td><td class='center'>" + toSymbol(data[i].active_822) + "</td><td class='center'>" + toSymbol(data[i].active_cz_restriction) + "</td><td class='center'>" + toSymbol(data[i].active_iax) + "</td><td class='center'>" + toSymbol(data[i].active_password) + "</td><td class='center'>" + toSymbol(data[i].active_pin) + "</td><td class='center'>" + toSymbol(data[i].active_ping) + "</td><td class='center'>" + toSymbol(data[i].active_rtp) + "</td><td class='center'>" + toSymbol(data[i].active_sip) + "</td><td class='center'>" + toSymbol(data[i].active_anonymous) + "</td><td class='center'>" + toSymbol(data[i].active_greeting) + "</td><td>" + data[i].missed_call_email + "</td><td>" + data[i].recording_email + "</td><td>" + data[i].voicemail_email + "</td><td>" + data[i].backup_number_email + "</td><td>" + data[i].incoming_call_name_format + "</td><td>" + data[i].incoming_call_number_format + "</td></tr>"
		}
		$("#lines").html(outString);
	});


	$.ajax({
		url: 'https://www.odorik.cz/api/v1/sim_cards.json',
		type: 'GET',
		data: {
			user: APIuser,
			password: APIpass
		}
	}).done(function (data, textStatus, xhr) {
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			outString += "<tr><td>" + data[i].id + "</td><td>" + data[i].sim_number + "</td><td>" + data[i].state + "</td><td>" + data[i].changes_in_progress + "</td><td>" + data[i].data_package + "</td><td>" + data[i].data_package_for_next_month + "</td><td>" + data[i].data_bought_total + "</td><td>" + data[i].data_used + "</td><td>" + data[i].voice_package + "</td><td>" + data[i].voice_package_for_next_month + "</td><td>" + data[i].package_delayed_billing + "</td><td>" + data[i].package_delayed_billing_for_next_month + "</td><td class='center'>" + toSymbol(data[i].missed_calls_register) + "</td><td class='center'>" + toSymbol(data[i].mobile_data) + "</td><td class='center'>" + toSymbol(data[i].lte) + "</td><td class='center'>" + toSymbol(data[i].lte_for_next_month) + "</td><td>" + data[i].roaming + "</td><td class='center'>" + toSymbol(data[i].premium_services) + "</td></tr>"
		}
		$("#simCards").html(outString);
	});


	if ($(".ui.container").css("display") == "none") {
		$("#loadingDimmer").dimmer("hide");
		$("#loadingDimmer").remove();
		$(".ui.container").transition("fade", setDuration + "ms");
	}
	$('#categorySelector').removeClass("loading");
	$("section").hide();
	$(".dynamic").hide();
	$(".statisticsContent").show();
}


function openDialog(dialog_id) {
	var dialog = document.getElementById(dialog_id);
	dialog.showModal();
	dialog.classList.remove('hide');
	dialog.classList.add('show');

	dialog.addEventListener('close', () => {
		dialog.classList.remove('show');
		dialog.classList.add('hide');
	});
};


document.addEventListener('click', (event) => {
	const dialog = document.querySelector('dialog');
	const dialogRect = dialog.getBoundingClientRect();
	const clickX = event.clientX;
	const clickY = event.clientY;
	if (clickX < dialogRect.left || clickX > dialogRect.right || clickY < dialogRect.top || clickY > dialogRect.bottom) {
			var openDlg = document.querySelector('dialog[open]');
			if (event.target === openDlg) {
				openDlg.close();
			}
	}
});


function copyToClipboard(text) {
	const el = document.createElement('textarea');
	el.value = text;
	document.body.appendChild(el);
	el.select();
	document.execCommand('copy');
	document.body.removeChild(el);
}

function simulateContextMenu(event) {
	if (isTouchDevice()) {
		event.preventDefault(); // Zamezí výchozímu chování

		var contextMenuEvent = new MouseEvent('contextmenu', {
			bubbles: true,
			cancelable: true,
			view: window
		});

		event.target.dispatchEvent(contextMenuEvent);
	}
}

if ('serviceWorker' in navigator) {
	window.addEventListener('load', function () {
		navigator.serviceWorker.register('service-worker.js').then(function (registration) {
			console.log('ServiceWorker registration successful with scope: ', registration.scope);
		}, function (err) {
			console.log('ServiceWorker registration failed: ', err);
		});
	});
};
