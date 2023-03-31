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
						//localStorage.setItem('password', APIpass);  // TODO Save password is not secure
					}
				}
			});

			return false;
		}
	}).modal('show');
}

// Show logout confirmation modal
function logoutModal() {
	$('#logoutModal').modal({
		blurring: true,
		duration: setDuration,
		onApprove: function () {
			logout();
		}
	}).modal('show');
}

// Log out the user
function logout() {
	localStorage.removeItem('username');
	localStorage.removeItem('password');
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

					if ((enableContacts && !enableCallHistory && !enableStatistics) || localStorage.prevCategory == "speedDials") {
						$(".ui.dropdown").dropdown("set selected", "speedDials");
					}
					else if ((enableStatistics && !enableCallHistory) || localStorage.prevCategory == "statistics") {
						$(".ui.dropdown").dropdown("set selected", "statistics");
					}
					else if ((enableSmsHistory && !enableCallHistory) || localStorage.prevCategory == "smsHistory") {
						$(".ui.dropdown").dropdown("set selected", "smsHistory");
					}
					else {
						$(".ui.dropdown").dropdown("set selected", "callHistory");
					}

				} else {
					localStorage.setItem("prevCategory", value);
					$('#categorySelector').addClass("loading");
				}
				if (value == "speedDials") {
					reloadContacts();
				}
				if (value == "callHistory") {
					loadCalls();
				}
				if (value == "smsHistory") {
					loadSms();
				}
				if (value == "statistics") {
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
	reloadContacts();

	if ((enableContacts && !enableCallHistory && !enableStatistics) || localStorage.prevCategory == "speedDials") {
		$(".ui.dropdown").dropdown("set selected", "speedDials");
		$(".callHistoryContent").hide();
		$(".smsHistoryContent").hide();
		$(".statisticsContent").hide();
		$(".speedDialsContent").show();
		reloadContacts();
	}
	else if ((enableStatistics && !enableCallHistory) || localStorage.prevCategory == "statistics") {
		$(".ui.dropdown").dropdown("set selected", "statistics");
		$(".callHistoryContent").hide();
		$(".smsHistoryContent").hide();
		$(".speedDialsContent").hide();
		$(".statisticsContent").show();
		loadStatistics();
	}
	else if ((enableSmsHistory && !enableCallHistory) || localStorage.prevCategory == "smsHistory") {
		$(".ui.dropdown").dropdown("set selected", "smsHistory");
		$(".callHistoryContent").hide();
		$(".speedDialsContent").hide();
		$(".statisticsContent").hide();
		$(".smsHistoryContent").show();
		loadSms();
	}
	else {
		$(".ui.dropdown").dropdown("set selected", "callHistory");
		$(".smsHistoryContent").hide();
		$(".speedDialsContent").hide();
		$(".statisticsContent").hide();
		$(".callHistoryContent").show();
		loadCalls();
	}
}

// Shows the "dimmer" element - for displaying error messages
function dim(status, text) {
	if (status == true) {
		$('#dimmer h1 i').removeClass("warning");
		$('#dimmer h1 i').removeClass("sign");
		$('#dimmer h1 i').removeClass("checkmark");
		$('#dimmer h1 i').addClass("checkmark");
	} else {
		$('#dimmer h1 i').removeClass("warning");
		$('#dimmer h1 i').removeClass("sign");
		$('#dimmer h1 i').removeClass("checkmark");
		$('#dimmer h1 i').addClass("warning");
		$('#dimmer h1 i').addClass("sign");
	}
	$('#dimmer small').html(text);
	setTimeout("$('#dimmer').dimmer('show');", 800)
	setTimeout("$('#dimmer').dimmer('hide');", 2100);
}


/* CONTACTS SECTION */

// Reload list
function reloadContacts() {
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
			array = result;
			outstring = "";
			for (var i = 0; i < result.length; i++) {
				allNumbers.push(result[i].number);
				allShortcuts.push(result[i].shortcut);
				allNames.push(result[i].name);
				if (editableLine("main", result[i].shortcut)) {
					outstring += '<tr><td class="center table-short-' + result[i].shortcut + '">' + result[i].shortcut + '</td>' + '<td class="table-name-' + result[i].shortcut + '">' + result[i].name + '</td><td class="table-num-' + result[i].shortcut + '">' + result[i].number.replace(/^00/, "+") + '</td><td>';

					if (enableEditing || enableRemoving || enableCallback)
						outstring += '<div class="ui icon buttons">';

					if (enableRemoving)
						outstring += '<button aria-label="smazat" class="ui red button" onclick="removeContact(\'main\', \'' + result[i].shortcut + '\')"><i class="delete icon"></i></button>';

					if (enableEditing)
						outstring += '<button aria-label="upravit" class="ui blue button" onclick="editContact(\'main\', \'' + result[i].shortcut + '\',\'' + result[i].name + '\',\'' + result[i].number + '\')"><i class="edit icon"></i></button>';

					if (enableCallback)
						outstring += '<button aria-label="zavolat" class="ui green button" onclick="callBack(\'' + result[i].number + '\',\'' + result[i].shortcut + '\',\'' + result[i].name + '\')"><i class="call icon"></i></button>';

					if (enableEditing || enableRemoving || enableCallback)
						outstring += '</div>'

					outstring += '</td></tr>';
				} else {
					if (hideLockedNumbers == false) {
						outstring += '<tr><td class="center table-short-' + result[i].shortcut + '">' + result[i].shortcut + '</td>' + '<td class="table-name-' + result[i].shortcut + '">' + result[i].name + '</td><td class="table-num-' + result[i].shortcut + '">' + result[i].number.replace(/^00/, "+") + '</td><td>';
						outstring += '<div class="ui icon buttons">' + '<button aria-label="smazat" class="ui red button" disabled><i class="delete icon"></i></button>' + '<button aria-label="upravit" class="ui blue button" disabled><i class="edit icon"></i></button>' + '<button aria-label="zavolat" class="ui green button" disabled><i class="call icon"></i></button></div>';
						outstring += '</td></tr>';
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

				$(".statisticsContent").hide();
				$(".callHistoryContent").hide();
				$(".smsHistoryContent").hide();
				$(".speedDialsContent").show();
			}
			else {
				preload = false;
			}

			if (enableInlineEditing) {
				$("#tableContacts td").dblclick(function () {
					$(".edited").each(function () {
						$(this).text($(this).find("input").attr("data-original"));
					});
					$(".edited").removeClass("edited");
					$(this).addClass("edited");

					var currData = $(this).text();

					$(this).html("<div class='ui icon fluid input'><input type='text' data-original='' id='inlineInput' value=''><i id='inlineSubmit' class='link checkmark icon'></i></div>");

					$("#inlineInput").attr("value", currData);
					$("#inlineInput").attr("data-original", currData);

					var id = $(this).attr("class").replace(" edited", "").split("-")[2];

					$("#inlineInput").keypress(function (e) {
						if (e.which == 13) {
							inlineEdit(id);
						}
					});
					$("#inlineSubmit").click(function () {
						inlineEdit(id);
					});
				});
			}
		}
	});
}

// Remove Contact
function removeContact(line, id) {
	$('#deleteModal').modal({
		duration: setDuration,
		blurring: true,
		onApprove: function () {
			if (line == "main") {
				requestURL = 'https://www.odorik.cz/api/v1/speed_dials/' + id + '.json';
			} else {
				requestURL = "https://www.odorik.cz/api/v1/lines/" + line + '/speed_dials/' + id + '.json';
			}
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
					setTimeout("reloadContacts();", 500);
				}
			});
		}
	}).modal('show');
}

// Edit Contact
function editContact(line, id, name, number) {
	$('input[name="edit-shortcut"]').val(id);
	$('input[name="edit-name"]').val(name);
	$('input[name="edit-number"]').val(number);
	$('#editModal').modal({
		duration: setDuration,
		blurring: true,
		onApprove: function () {
			if (line == "main") {
				requestURL = 'https://www.odorik.cz/api/v1/speed_dials/' + id + '.json';
			} else {
				requestURL = "https://www.odorik.cz/api/v1/lines/" + line + '/speed_dials/' + id + '.json';
			}
			$.ajax({
				url: requestURL,
				type: 'PUT',
				data: {
					user: APIuser,
					password: APIpass,
					shortcut: $('input[name="edit-shortcut"]').val(),
					name: $('input[name="edit-name"]').val(),
					number: $('input[name="edit-number"]').val()
				},
				success: function (result) {
					if (typeof result.errors != "undefined") {
						parseErrors(result);
					}
					setTimeout("reloadContacts();", 500);
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
			$.ajax({
				url: requestURL,
				type: 'POST',
				data: {
					user: APIuser,
					password: APIpass,
					shortcut: $('input[name="add-shortcut"]').val(),
					name: $('input[name="add-name"]').val(),
					number: $('input[name="add-number"]').val()
				},
				success: function (result) {
					if (typeof result.errors != "undefined") {
						parseErrors(result);
					}
					setTimeout("reloadContacts();", 500);
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
		showError("Zkratka je už použitá.");
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
	console.log($('.table-name-' + id).text());
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
			setTimeout("reloadContacts();", 500);
		}
	});
}

// Call back
function callBack(number, shortcut, name) {
	if (typeof shortcut !== "undefined") {
		$('input[name="call-target"]').val(number + " - zk. " + shortcut + " (" + name + ")");
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
				else dim(false, "Došlo k chybě. Nelze se připojit na API Odorik.");
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
function unifyNumber(input) {
	input = replaceAll(" ", "", input);
	input = replaceAll("-", "", input);
	input = input.replace("+", "00");

	if (input.length != 6) {
		if (input.indexOf("00") != 0 && !isNaN(input.substr(0, 2))) {
			input = "00420" + input;
		}
	}

	return input;
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
				if ($.inArray(unifyNumber(contact.tel[a].value[0]), usedNumbers) == -1) {
					usedNumbers.push(unifyNumber(contact.tel[a].value[0]));
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
						console.log("multiple");
						console.log(contact.tel[a].meta);
						if (contact.tel[a].meta.TYPE == "HOME") {
							type = " (domů)"
						}
						if (contact.tel[a].meta.TYPE == "WORK") {
							type = " (práce)"
						}
						if (contact.tel[a].meta.TYPE == "CELL") {
							type = " (mobil)"
						}
						if (contact.tel[a].meta.TYPE == "FAX") {
							type = " (fax)"
						}
					}
					// Warn against conflicts in shortcuts
					var warning = "";
					if ($.inArray(Number(shortcut), allShortcuts) > -1) {
						warning = "error";
					}
					// Append to table
					$("#tableImport").append("<tr class='" + warning + "'><td><div class='ui transparent left icon fluid " + warning + " input'><i style='display: none' class='remove icon'></i><input class='shortuctImport' id='import-shortuct" + i + "' type='number' min='1' value='" + shortcut + "'></div></td>" + "<td><div class='ui transparent fluid input'><input id='import-name" + i + "' value='" + contact.fn + type + "'></div></td>" + "<td><div class='ui transparent fluid input'><input id='import-number" + i + "' type='tel' value='" + unifyNumber(contact.tel[a].value[0]) + "'></div></td></tr>");
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
			setTimeout("reloadContacts();", 1200);
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


/* CALL HISTORY SECTION */

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

	if (data.length == pageLength) {
		$("#nextPage").removeClass("disabled");
	}
	else {
		$("#nextPage").addClass("disabled");
	}
	if (page > 1) {
		$("#prevPage").removeClass("disabled");
	}
	else {
		$("#prevPage").addClass("disabled");
	}

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

			$(".speedDialsContent").hide();
			$(".statisticsContent").hide();
			$(".smsHistoryContent").hide();
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
			outstring += '<a onclick="redirectionsModal(' + "'" + result[i].id + "'" + ',' + "'" + result[i].date + "'" + ');" class="ui teal ribbon label"><i class="forward mail icon"></i></a>';
		}

		outstring += '<span class="hasClickPopup" data-html="<b>ID:</b> ' + result[i].id + '">';

		if (result[i].direction == "redirected") {
			outstring += '<i class="forward mail icon"></i> Přesměrovaný';
		}
		if (result[i].direction == "in") {
			outstring += '<i class="right arrow icon"></i> Příchozí';
		}
		if (result[i].direction == "out") {
			outstring += '<i class="left arrow icon"></i> Odchozí';
		}
		if (result[i].status == "missed") {
			outstring += " nepřijatý";
		}

		outstring += '</span> ';
		var price = result[i].price.toString().substr(0, result[i].price.toString().indexOf(".") + 3);
		var callLength = ~~(result[i].length / 60) + "&nbsp;min " + (result[i].length % 60) + "&nbsp;s";
		if (result[i].length < 60)
			callLength = (result[i].length % 60) + "&nbsp;s";
		outstring += '</td><td>' + moment(result[i].date).format("DD.MM.YYYY H:mm:ss") + '</td><td>'
			+ getSpeedDialName(result[i].source_number) + '</td><td><span class="hasPopup" data-html="<b>Podrobnosti:</b> '
			+ result[i].destination_name + '">'
			+ getSpeedDialName(result[i].destination_number) + '</span></td><td class="right"><span class="hasPopup" data-html="<b>Délka vyzvánění:</b> '
			+ result[i].ringing_length + '&nbsp;s">'
			+ callLength + '</span></td><td class="right"><span class="hasPopup" data-html="<b>Minutová sazba:</b> '
			+ result[i].price_per_minute + '&nbsp;Kč<br><b>Zbylý kredit:</b> '
			+ result[i].balance_after + '&nbsp;Kč">'
			+ price + '&nbsp;Kč</span></td><td class="center">' + result[i].line + '</td></tr>';
	}
	$("#tableCalls").html(outstring);
	$(".hasClickPopup").popup({ on: "click" });
	$(".hasPopup").popup();
	$("#pageNumber").text(page + " z " + Math.ceil(callHistory.length / pageLength));
}

// Get name of the contact
function getSpeedDialName(number) {
	if ($.inArray(number, allNumbers) != -1) {
		return allNames[$.inArray(number, allNumbers)] + " (" + number.replace(/^00/, "+") + ")";
	}
	else {
		return number.replace(/^00/, "+");
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
				outstring += '<td>' + moment(result[i].date).format("DD.MM.YYYY H:mm:ss") + '</td><td>' + getSpeedDialName(result[i].source_number) + '</td><td><span class="hasPopup" data-html="<b>Podrobnosti:</b> ' + result[i].destination_name + '">' + getSpeedDialName(result[i].destination_number) + '</span></td><td class="right"><span class="hasPopup" data-html="<b>Délka vyzvánění:</b> ' + result[i].ringing_length + '&nbsp;s">' + result[i].length + '&nbsp;s</span></td><td class="right"><span class="hasPopup" data-html="<b>Minutová sazba:</b> ' + result[i].price_per_minute + '&nbsp;Kč<br><b>Zbylý kredit:</b> ' + result[i].balance_after + '&nbsp;Kč">' + result[i].price + '&nbsp;Kč</span></td><td class="center">' + result[i].line + '</td></tr>';
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


/* SMS HISTORY */

// Reload SMS
function reloadSms() {
	if (page < 1) {
		page = 1;
	}

	var startRange = Number((page - 1) * pageLength);
	var endRange = page * pageLength;
	var data = smsHistory.slice(startRange, endRange);

	if (data.length == pageLength) {
		$("#nextSmsPage").removeClass("disabled");
	}
	else {
		$("#nextSmsPage").addClass("disabled");
	}
	if (page > 1) {
		$("#prevSmsPage").removeClass("disabled");
	}
	else {
		$("#prevSmsPage").addClass("disabled");
	}

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

			$(".speedDialsContent").hide();
			$(".statisticsContent").hide();
			$(".callHistoryContent").hide();
			$(".smsHistoryContent").show();

			reloadSms();
		});
	});
}

function populateSmsTable(result) {
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
			outstring += '<a onclick="redirectionsModal(' + "'" + result[i].id + "'" + ',' + "'" + result[i].date + "'" + ');" class="ui teal ribbon label"><i class="forward mail icon"></i></a>';
		}

		outstring += '<span class="hasClickPopup" data-html="<b>ID:</b> ' + result[i].id + '">';

		if (result[i].direction == "redirected") {
			outstring += '<i class="forward mail icon"></i> Přesměrovaný';
		}
		if (result[i].direction == "in") {
			outstring += '<i class="right arrow icon"></i> Příchozí';
		}
		if (result[i].direction == "out") {
			outstring += '<i class="left arrow icon"></i> Odchozí';
		}
		if (result[i].status == "missed") {
			outstring += " nepřijatý";
		}

		outstring += '</span> ';
		var price = result[i].price.toString().substr(0, result[i].price.toString().indexOf(".") + 3);
		var callLength = ~~(result[i].length / 60) + "&nbsp;min " + (result[i].length % 60) + "&nbsp;s";
		if (result[i].length < 60)
			callLength = (result[i].length % 60) + "&nbsp;s";
		outstring += '</td><td>' + moment(result[i].date).format("DD.MM.YYYY H:mm:ss") + '</td><td>'
			+ getSpeedDialName(result[i].source_number) + '</td><td>'
			+ getSpeedDialName(result[i].destination_number) + '</span></td><td class="right"><span class="hasPopup" data-html="'
			+ '<b>Zbylý kredit:</b> '
			+ result[i].balance_after + '&nbsp;Kč">'
			+ price + '&nbsp;Kč</span></td><td class="center">' + result[i].line + '</td></tr>';
	}
	$("#tableSms").html(outstring);
	$(".hasClickPopup").popup({ on: "click" });
	$(".hasPopup").popup();
	$("#pageSmsNumber").text(page + " z " + Math.ceil(smsHistory.length / pageLength));
}


/* STATISTICS SECTION */

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
		$("#incomingCount").text(data.incoming.count);
		$("#incomingLength").text(formatLength(data.incoming.length));
		$("#incomingPrice").text(formatPrice(data.incoming.price));

		$("#outgoingCount").text(data.outgoing.count);
		$("#outgoingLength").text(formatLength(data.outgoing.length));
		$("#outgoingPrice").text(formatPrice(data.outgoing.price));

		$("#redirectedCount").text(data.redirected.count);
		$("#redirectedLength").text(formatLength(data.redirected.length));
		$("#redirectedPrice").text(formatPrice(data.redirected.price));
	});

	$.ajax({
		url: 'https://www.odorik.cz/api/v1/call_statistics/by_destination.json',
		type: 'GET',
		data: dataSet
	}).done(function (data, textStatus, xhr) {
		console.log(data);
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			var direction = "Odchozí";
			if (data[i].direction == "redirected") {
				direction = "Přesměrované";
			}
			else if (data[i].direction == "in") {
				direction = "Příchozí";
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
		console.log(data);
		var outString = "";
		for (var i = 0; i < data.length; i++) {
			outString += "<tr><td>" + data[i].destination_number + "</td><td>" + data[i].count + "</td></tr>"
		}
		$("#missedStatistics").html(outString);
	});

	if ($(".ui.container").css("display") == "none") {
		$("#loadingDimmer").dimmer("hide");
		$("#loadingDimmer").remove();
		$(".ui.container").transition("fade", setDuration + "ms");
	}
	$('#categorySelector').removeClass("loading");
	$(".speedDialsContent").hide();
	$(".callHistoryContent").hide();
	$(".smsHistoryContent").hide();
	$(".statisticsContent").show();
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
