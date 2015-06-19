/**
 * Custom Knockout components
 * A service-credits component
 */
ko.components.register('service-credits', {
	template: {
		//element: 'service-credits-template'
		fromUrl: 'serviceCredits.html'
	},
	viewModel: function (params) {

		this.customer = params.customer;
		this.serviceNames = ['Website Templates', 'Stock Images', 'Sound Tracks', 'Screen Savers', 'Wordpress Themes'];

		this.addService = function () {
			console.log('Add Service');
			if (!this.customer().services) {
				this.customer().services = ko.observableArray();
			}
			this.customer().services.push(new Service({
				"name": "",
				"credit": "1"
			}));
		};

		/**
		 * Put any jQuery UI initialisation here or any code that
		 * needs to run after the component is rendered
		 * @param {Object} args
		 */
		this.afterRender = function (arg) {
			console.log('service-credits template rendered');
		};
	}
});

/**
 * Customer component template loader
 * @see http://knockoutjs.com/documentation/component-loaders.html
 */
var templateFromUrlLoader = {
	loadTemplate: function (name, templateConfig, callback) {
		if (templateConfig.fromUrl) {
			toastr.info("Loading template");
			// Uses jQuery's ajax facility to load the markup from a file
			var fullUrl = 'templates/' + templateConfig.fromUrl;
			$.get(fullUrl, function (markupString) {
				// We need an array of DOM nodes, not a string.
				// We can use the default loader to convert to the
				// required format.
				ko.components.defaultLoader.loadTemplate(name, markupString, callback);
				toastr.success("Template loaded successfully");
			});
		} else {
			// Unrecognized config format. Let another loader handle it.
			callback(null);
		}
	}
};

// Register it
ko.components.loaders.unshift(templateFromUrlLoader);