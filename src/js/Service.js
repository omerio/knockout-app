/**
 * Service model
 * @param {Object} service - a service
 */
function Service(service) {

	ko.mapping.fromJS(service, {}, this);

	this.edit = ko.observable(false);

	/**
	 * Start editing a service
	 * @param  {Object} service - a service object
	 * @param  {Event} event - DOM event
	 */
	this.startEdit = function (service, event) {
		if (service.stopping) {
			clearTimeout(service.stopping);
		}
		service.edit(true);

		var element = event.target;
		switch (element.tagName) {
		case "SPAN":
			$(element).next().focus();
			break;
		case "INPUT":
			$(element).focus();
			break;
		}
	};

	/**
	 * Stop editing a service
	 * @param  {Object} service - a service object
	 */
	this.stopEdit = function (service) {
		service.stopping = setTimeout(function () {
			service.edit(false);
		}, 200);
	};
}