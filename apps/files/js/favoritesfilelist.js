/*
 * Copyright (c) 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */
(function(OCA) {

	/**
	 * @class OCA.Files.FavoritesFileList
	 * @augments OCA.Files.FavoritesFileList
	 *
	 * @classdesc Favorites file list.
	 * Displays the list of files marked as favorites
	 *
	 * @param $el container element with existing markup for the #controls
	 * and a table
	 * @param [options] map of options, see other parameters
	 */
	var FavoritesFileList = function($el, options) {
		this.initialize($el, options);
	};
	FavoritesFileList.prototype = _.extend({}, OCA.Files.FileList.prototype,
		/** @lends OCA.Files.FavoritesFileList.prototype */ {
		appName: 'Favorites',

		_clientSideSort: true,

		/**
		 * @private
		 */
		initialize: function($el, options) {
			OCA.Files.FileList.prototype.initialize.apply(this, arguments);
			if (this.initialized) {
				return;
			}
		},

		updateEmptyContent: function() {
			var dir = this.getCurrentDirectory();
			if (dir === '/') {
				// root has special permissions
				this.$el.find('#emptycontent').toggleClass('hidden', !this.isEmpty);
				this.$el.find('#filestable thead th').toggleClass('hidden', this.isEmpty);
			}
			else {
				OCA.Files.FileList.prototype.updateEmptyContent.apply(this, arguments);
			}
		},

		getDirectoryPermissions: function() {
			return OC.PERMISSION_READ | OC.PERMISSION_DELETE;
		},

		updateStorageStatistics: function() {
			// no op because it doesn't have
			// storage info like free space / used space
		},

		reload: function() {
			this.showMask();
			if (this._reloadCall) {
				this._reloadCall.abort();
			}
			this._reloadCall = $.ajax({
				url: OC.linkToOCS('apps/files/api/v1') + 'favorites',
				/* jshint camelcase: false */
				data: {
					format: 'json'
				},
				type: 'GET',
				beforeSend: function(xhr) {
					xhr.setRequestHeader('OCS-APIREQUEST', 'true');
				}
			});
			var callBack = this.reloadCallback.bind(this);
			return this._reloadCall.then(callBack, callBack);
		},

		reloadCallback: function(result) {
			delete this._reloadCall;
			this.hideMask();

			if (result.ocs && result.ocs.data) {
				this.setFiles(this._makeFiles(result.ocs.data));
			}
			else {
				// TODO: error handling
			}
		}
	});

	OCA.Files.FavoritesFileList = FavoritesFileList;
})(OCA);
