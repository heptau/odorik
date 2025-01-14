
let coreAssets = [
	'odorik-icon.png',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/button.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/card.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/container.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/dimmer.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/dropdown.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/form.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/grid.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/header.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/icon.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/input.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/label.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/loader.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/message.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/menu.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/modal.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/popup.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/reset.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/segment.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/site.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/statistic.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.14/components/transition.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-daterangepicker/3.0.5/daterangepicker.min.css',
	'https://cdnjs.cloudflare.com/ajax/libs/bootstrap-daterangepicker/3.0.5/daterangepicker.min.js',
	'https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.1.4/semantic.min.js',
	'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js',
	'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.4/jquery.min.js'
];

// On install, cache some stuff
self.addEventListener('install', function (event) {

	// Cache core assets
	event.waitUntil(caches.open('app').then(function (cache) {
		for (let asset of coreAssets) {
			cache.add(new Request(asset));
		}
		return cache;
	}));

});


self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request)
			.then(function(response) {
				if (response) {
					return response;
				}
				return fetch(event.request);
			}
		)
	);
});

