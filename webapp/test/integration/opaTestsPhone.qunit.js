/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"purchaserequisitionapproval/test/integration/PhoneJourneys"
	], function() {
		QUnit.start();
	});
});