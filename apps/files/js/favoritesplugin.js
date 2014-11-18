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
	 * @class OCA.Files.FavoritesPlugin
	 * @augments OCA.Files.FavoritesPlugin
	 *
	 * @classdesc Favorites plugin
	 * Registers the favorites file list and file actions.
	 */
	var FavoritesPlugin = function() {
	};
	FavoritesPlugin.prototype = {
		name: 'Favorites',

		apply: function(app) {
			var self = this;
			var fileActions = OCA.Files.fileActions;
			var urlParams = OC.Util.History.parseUrlQuery();

			// register favorite list for sidebar section
			this.favoritesFileList = new OCA.Files.FavoritesFileList(
				$('#app-content-favorites'), {
					scrollContainer: $('#app-content'),
					dragOptions: dragOptions,
					folderDropOptions: folderDropOptions,
					fileActions: fileActions,
					allowLegacyActions: true,
					scrollTo: urlParams.scrollto
				}
			);

			// register "star" action
			fileActions.registerAction({
				name: 'favorite',
				displayName: 'Favorite',
				mime: 'all',
				permissions: OC.PERMISSION_READ,
				render: function(actionSpec, isDefault, context) {
					// TODO: use proper icon
					var $file = context.$file;
					var starState = '&#x2606;';
					if ($file.data('favorite') === true) {
						starState = '&#x2605;';
					}
					var $icon = $('<a href="#" class="action action-favorite permanent">' + starState + '</a>');
					$file.find('td.favorite').prepend($icon);
					return $icon;
				},
				actionHandler: function(fileName, context) {
					var dir = context.dir || context.fileList.getCurrentDirectory();
					self.tag(dir + '/' + fileName, OC.TAG_FAVORITE);
				}
			});

			var oldInitialize = OCA.Files.FileList.prototype.initialize;
			OCA.Files.FileList.prototype.initialize = function() {
				var result = oldInitialize.apply(this, arguments);
				// accomodate for the extra "favorite" column
				var $header = this.$el.find('#headerName');
				$header.attr('colspan', $header.attr('colspan') || 1 + 1);
				return result;
			};

			// extend row prototype
			var oldCreateRow = OCA.Files.FileList.prototype._createRow;
			OCA.Files.FileList.prototype._createRow = function(fileData) {
				var $tr = oldCreateRow.apply(this, arguments);
				if (fileData.favorite === true) {
					$tr.attr('data-favorite', true);
				}
				$tr.prepend('<td class="favorite"></td>');
				return $tr;
			};
		},

		/**
		 * Tag the given file or folder.
		 *
		 * @param {String} fileName path to the file or folder to tag
		 * @param {String} tagName name of the tag
		 * @param {boolean} [unTag] true to remove the tag, false to add
		 */
		tag: function(fileName, tagName, unTag) {
			// crude ajax for now
			var params = {
				path: fileName
			};
			$.ajax({
				url: OC.linkToOCS('apps/files/api/v1') + 'tags/' +
					encodeURIComponent(tagName) +
					OC.buildQueryString(params),
				data: {
					format: 'json'
				},
				type: unTag ? 'DELETE' : 'POST',
				beforeSend: function(xhr) {
					xhr.setRequestHeader('OCS-APIREQUEST', 'true');
				}
			});
		}
	};

	OCA.Files.FavoritesPlugin = FavoritesPlugin;
})(OCA);

$(document).ready(function() {
	// FIXME: HACK: do not init when running unit tests, need a better way
	if (!window.TESTING && !_.isUndefined(OCA.Files.App)) {
		OCA.Files.App.registerPlugin(new OCA.Files.FavoritesPlugin());
	}
});

