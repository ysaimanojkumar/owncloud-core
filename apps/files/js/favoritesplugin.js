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
					var isFavorite = $file.data('favorite') === true;
					var starState = isFavorite ? '&#x2605' : '&#x2606;';
					var $icon = $(
						'<a href="#" class="action action-favorite ' + (isFavorite ? 'permanent' : '') + '">' +
						starState + '</a>'
					);
					$file.find('td.favorite').prepend($icon);
					return $icon;
				},
				actionHandler: function(fileName, context) {
					var $actionEl = context.$file.find('.action-favorite');
					var $file = context.$file;
					var dir = context.dir || context.fileList.getCurrentDirectory();
					var tags = $file.attr('data-tags');
					if (_.isUndefined(tags)) {
						tags = '';
					}
					tags = tags.split('|');
					tags = _.without(tags, '');
					var isFavorite = tags.indexOf(OC.TAG_FAVORITE) >= 0;
					if (isFavorite) {
						// remove tag from list
						tags = _.without(tags, OC.TAG_FAVORITE);
					} else {
						tags.push(OC.TAG_FAVORITE);
					}
					if ($actionEl.hasClass('icon-loading')) {
						// do nothing
						return;
					}
					$actionEl.addClass('icon-loading');
					self.applyFileTags(
						dir + '/' + fileName,
						tags
					).then(function() {
						// TODO: read from result
						$actionEl.removeClass('icon-loading');
						$actionEl.html(isFavorite ? '&#x2606;' : '&#x2605;');
						$actionEl.toggleClass('permanent', !isFavorite);
						$file.attr('data-tags', tags.join('|'));
						$file.attr('data-favorite', !isFavorite);
					});
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
				if (fileData.tags) {
					$tr.attr('data-tags', fileData.tags.join('|'));
					if (fileData.tags.indexOf(OC.TAG_FAVORITE) >= 0) {
						$tr.attr('data-favorite', true);
					}
				}
				$tr.prepend('<td class="favorite"></td>');
				return $tr;
			};
		},

		/**
		 * Replaces the given files' tags with the specified ones.
		 *
		 * @param {String} fileName path to the file or folder to tag
		 * @param {Array.<String>} tagNames array of tag names
		 */
		applyFileTags: function(fileName, tagNames) {
			var encodedPath = OC.encodePath(fileName);
			while (encodedPath[0] === '/') {
				encodedPath = encodedPath.substr(1);
			}
			return $.ajax({
				url: OC.generateUrl('/apps/files/api/v1/files/') + encodedPath,
				contentType: 'application/json',
				data: JSON.stringify({
					format: 'json',
					tags: tagNames || []
				}),
				dataType: 'json',
				type: 'POST'
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

