sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library"
], function (BaseController, JSONModel, formatter, mobileLibrary) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
    var string_filter = "";
    var filters = [];


	return BaseController.extend("purchaserequisitionapproval.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit : function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy : false,
				delay : 0,
				lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

            this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
            
            //SETTING UP DEVICE MODEL TYPE
            this.createDeviceModel();
        },

        updateCountPosition:function(){

            var TablePositionNumItem = this.getView().byId("TablePosition").getItems().length;
            var Jsonmodel = {

                countPosition: TablePositionNumItem
            };
            var oModel = new sap.ui.model.json.JSONModel(Jsonmodel);    
            this.getView().setModel(oModel, "tabFilterModel");                   

        },
        
        createDeviceModel: function () {
		var device = sap.ui.Device;
		var oModel = new sap.ui.model.json.JSONModel(device);
		this.getView().setModel(oModel, "deviceModel");
    },
    
    	onPressShowMore: function (oEvent) {
        var path = oEvent.getSource().getParent().getParent().getBindingContextPath();
        var position = this.getView().getModel("extendedJsonModel").getProperty(path);
		position.showAllRows = !position.showAllRows;
		this.getView().getModel("extendedJsonModel").refresh(true);

		//var position = this.getView().getModel().getProperty(path);
		//position.showAllRows = !position.showAllRows;
		//this.getView().getModel().refresh(true);
    },

     checkBlocks: function(successCallback){
		var purchaseRequisition = sap.ui.getCore().PurchaseRequisition;
		sap.ui.core.BusyIndicator.show();
		var extendedModel = this.getOwnerComponent().getModel();
		extendedModel.read("/CheckBlocksSet(PurchaseRequisition='" + purchaseRequisition + "')", {
			success: function (result) {
				sap.ui.core.BusyIndicator.hide();
                //successCallback();
                alert('ok');
			}.bind(this),
			error: function (e) {
				sap.ui.core.BusyIndicator.hide();
				var message = JSON.parse(e.responseText).error.message.value;
				sap.m.MessageBox.error(message);
			}
		});
	},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress : function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},


		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished : function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched : function (oEvent) {
            
            //LOCAL VARIABLES DEFINITION
            var sObjectId        =  oEvent.getParameter("arguments").objectId;
            var sinstanceId      =  oEvent.getParameter("arguments").instanceId;

			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getModel().metadataLoaded().then( function() {
				var sObjectPath = this.getModel().createKey("ExtendedPropertiesRdaSet", {
                    SAP__Origin:'',                    
                    InstanceID: sinstanceId,
                    TaskDefinitionID:'',
                    PurchaseRequisition :  sObjectId
                    
				});
				this._bindView("/" + sObjectPath);
            }.bind(this));
            
            sap.ui.getCore().PurchaseRequisition = sObjectId;
            this.ReadApproverSetModel(sObjectId, sinstanceId);
            this.ReadRdaAttachment(sObjectId, sinstanceId);
        },
        
         ReadRdaAttachment: function(sObjectId, sinstanceId){

            //VARIABLES DEFINITION
            var oModel               = this.getOwnerComponent().getModel("TASKPROCESSING");
            var PurchaseRequisition  =  sObjectId;
            var InstanceID           =  sinstanceId;
            var TaskDefinitionID     =  'TS00008267_WS90000007_0000000361';
            var SAP__Origin          =  '/IWPGW/BWF';

            //CLEARING FILTER VARIABLES
               filters = [];

               var InstanceFilter = new sap.ui.model.Filter("SAP__Origin", sap.ui.model.FilterOperator.EQ, SAP__Origin);
               filters.push(InstanceFilter);

               var InstanceFilter2 = new sap.ui.model.Filter("InstanceID", sap.ui.model.FilterOperator.EQ, InstanceID);
               filters.push(InstanceFilter2);

               //var InstanceFilter3 = new sap.ui.model.Filter("TaskDefinitionID", sap.ui.model.FilterOperator.EQ, TaskDefinitionID);
               //filters.push(InstanceFilter3);
               sap.ui.getCore().this = this;

               oModel.read("/TaskCollection(SAP__Origin='%2FIWPGW%2FBWF',InstanceID='" + InstanceID + "')/Attachments", {
						success: function (result) {
                              var json={  Attachments : result.results,
                                          AttachmentsCount: result.results.length };
                              var jsonModel = new sap.ui.model.json.JSONModel(json);
                              sap.ui.getCore().this.getOwnerComponent().setModel(jsonModel, "detail");

						},
						error: function (e) {
							sap.ui.core.BusyIndicator.hide();
							alert("Errore di comunicazione con il database.");
						}
					});



        },



         

        ReadApproverSetModel: function(sObjectId, sinstanceId){

            //VARIABLES DEFINITION
            var PurchaseRequisition  =  sObjectId;
            var InstanceID           =  sinstanceId;
            var TaskDefinitionID     =  'TS00008267_WS90000007_0000000361';
            var SAP__Origin         =  '/IWPGW/BWF';

               var InstanceFilter = new sap.ui.model.Filter("SAP__Origin", sap.ui.model.FilterOperator.EQ, SAP__Origin);
               filters.push(InstanceFilter);

               var InstanceFilter2 = new sap.ui.model.Filter("InstanceID", sap.ui.model.FilterOperator.EQ, InstanceID);
               filters.push(InstanceFilter2);

               var InstanceFilter3 = new sap.ui.model.Filter("TaskDefinitionID", sap.ui.model.FilterOperator.EQ, TaskDefinitionID);
               filters.push(InstanceFilter3);

               //var InstanceFilter4 = new sap.ui.model.Filter("PurchaseRequisition", sap.ui.model.FilterOperator.EQ, PurchaseRequisition);
               //filters.push(InstanceFilter4);

                var extendedModel = this.getOwnerComponent().getModel();
				extendedModel.read("/ExtendedPropertiesRdaSet", {
						urlParameters: {
							$expand: "Positions,ApprovingSteps"
                        },
                        filters: [filters],
						success: function (result) {
                            sap.ui.core.BusyIndicator.hide();
                            var numOcc = result.results.length - 1;
							var replaceBackslashes = function (string) {
								var stringArray = string.split("\\n");
								return stringArray.join("\n");
                            };
                            
                            if (result.results[numOcc].HeaderNote != undefined){
                            result.results[numOcc].HeaderNote = replaceBackslashes(result.results[numOcc].HeaderNote);
                            }
                            
                            if(result.results[numOcc].ApprRejNote != undefined){
                            result.results[numOcc].ApprRejNote = replaceBackslashes(result.results[numOcc].ApprRejNote);
                            }

							for (var i = 0; i < result.results[numOcc].Positions.results.length; i++) {
							 	// format the itemText
								result.results[numOcc].Positions.results[i].ItemText = replaceBackslashes(result.results[numOcc].Positions.results[i].ItemText);

								// by default we wont show all the rows
								result.results[numOcc].Positions.results[i].showAllRows = false;
							}
							
							this.extendedJsonModel = new sap.ui.model.json.JSONModel(result.results[numOcc]);
							this.getView().setModel(this.extendedJsonModel, "extendedJsonModel");
							
							this.flowGenerator(result.results[numOcc].ApprovingSteps.results);
						}.bind(this),
						error: function (e) {
							sap.ui.core.BusyIndicator.hide();
							alert("Errore di comunicazione con il database.");
						}
					});




        },

        	flowGenerator: function(approvers){
		var nodes = [];
		var lines = [];
		var approversData = {
			nodes: nodes,
			lines: lines
		};
		
		approvers.sort((el,el2)=>(el.Step-el2.Step));
		
		for(var i = 0; i < approvers.length; i++){
			var nodeToModify = nodes.find(function(el){
				return el.key === approvers[i].Step;
			});
			
			if(!nodeToModify){
				nodeToModify = {
					key: approvers[i].Step,
					title: approvers[i].StepName,
					icon: approvers[i].Status ? "sap-icon://accept" : "sap-icon://pending",
					status: approvers[i].Status ? "Success" : "Warning",
					attributes: []
				}
				nodes.push(nodeToModify);
			}
			
			if(approvers[i].Status){
				nodeToModify.icon = "sap-icon://accept";
				nodeToModify.status = "Success";
			}
			
			nodeToModify.attributes.push({
				label: "",
				value: approvers[i].ApprovingDate + ( approvers[i].ApprovingDate ? " - " : "") + approvers[i].Name, //+ " (" + approvers[i].Approver + ")",
				icon: approvers[i].Status ? "sap-icon://accept" : ""
			});
		}
		
		for(i = 1; i < nodes.length; i++){
			lines.push({
				from: nodes[i-1].key,
				to: nodes[i].key,
			});
		}
		
		
		var testModel = new sap.ui.model.json.JSONModel(approversData);
		this.getView().setModel(testModel, "flowModel");
	},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView : function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path : sObjectPath,
				events: {
					change : this._onBindingChange.bind(this),
					dataRequested : function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange : function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.PurchaseRequisition,
				sObjectName = oObject.PurchaseRequisition,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded : function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout",  this.getModel("appView").getProperty("/previousLayout"));
			}
		}
	});

});