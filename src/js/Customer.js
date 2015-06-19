/**
 * Customer model
 * @param {Object} customer - a customer
 */
function Customer(customer) {
	ko.mapping.fromJS(customer, {
		'services': {
			create: function (options) {
				return new Service(options.data);
			}
		}
	}, this);
	this.edit = ko.observable(false);

}