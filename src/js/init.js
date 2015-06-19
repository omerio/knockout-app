/**
 * document onload
 */
$(function () {
	toastr.options.extendedTimeOut = 100; //1000;
	toastr.options.timeOut = 1000;
	toastr.options.fadeOut = 250;
	toastr.options.fadeIn = 250;
	var admin = new CustomerAdmin($('.container')[0]);
	//ko.applyBindings(admin, $('.container')[0]);
	admin.load();
});