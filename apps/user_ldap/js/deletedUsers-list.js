/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {
	/**
	 * The DeletedUsersList class manages a file list view.
	 * A file list view consists of a controls bar and
	 * a file list table.
	 */
	var DeletedUsersList = function($el, options) {
		this.initialize($el, options);
	};
	DeletedUsersList.prototype = {
		SORT_INDICATOR_ASC_CLASS: 'icon-triangle-n',
		SORT_INDICATOR_DESC_CLASS: 'icon-triangle-s',

		id: 'files',
		appName: t('files', 'Files'),
		isEmpty: true,
		useUndo:true,

		/**
		 * Top-level container with controls and file list
		 */
		$el: null,

		/**
		 * Files table
		 */
		$table: null,

		/**
		 * List of rows (table tbody)
		 */
		$deletedUsersList: null,

		initialized: false,

		// number of files per page
		pageSize: 20,

		/**
		 * Array of files in the current folder.
		 * The entries are of file data.
		 */
		deletedUsers: [],

		/**
		 * Map of file id to file data
		 */
		_selectedUsers: {},

		/**
		 * Sort attribute
		 */
		_sort: 'name',

		/**
		 * Sort direction: 'asc' or 'desc'
		 */
		_sortDirection: 'asc',

		/**
		 * Sort comparator function for the current sort
		 */
		_sortComparator: null,

		/**
		 * Whether to do a client side sort.
		 * When false, clicking on a table header will call reload().
		 * When true, clicking on a table header will simply resort the list.
		 */
		_clientSideSort: false,

		/**
		 * Current directory
		 */
		_currentDirectory: null,

		/**
		 * Initialize the file list and its components
		 *
		 * @param $el container element with existing markup for the #controls
		 * and a table
		 * @param options map of options, see other parameters
		 * @param scrollContainer scrollable container, defaults to $(window)
		 */
		initialize: function($el, options) {
			var self = this;
			options = options || {};
			if (this.initialized) {
				return;
			}

			this.$el = $el;
			this.$container = options.scrollContainer || $(window);
			this.$table = $el.find('table:first');
			this.$deletedUsersList = $el.find('#deletedUsersList');
			this.deletedUsers = [];
			this._selectedUsers = {};

			this._selectionSummary = new OCA.UserLDAP.DeletedUsersSummary();

			this.setSort('name', 'asc');

			this.$el.find('thead th .columntitle').click(_.bind(this._onClickHeader, this));

			this._onResize = _.debounce(_.bind(this._onResize, this), 100);
			$(window).resize(this._onResize);

			this.$el.on('show', this._onResize);

			// TODO adjust td.filename
			this.$deletedUsersList.on('click','td.filename>a.name', _.bind(this._onClickUser, this));
			this.$deletedUsersList.on('change', 'td.filename>input:checkbox', _.bind(this._onClickUser, this));
			this.$el.find('.select-all').click(_.bind(this._onClickSelectAll, this));
			this.$el.find('.delete-selected').click(_.bind(this._onClickDeleteSelected, this));

			this.$container.on('scroll', _.bind(this._onScroll, this));

			this.updateEmptyContent(); //TODO: necessary?
		},

		/**
		 * Destroy / uninitialize this instance.
		 */
		destroy: function() {
			// TODO: also unregister other event handlers
		},

		/**
		 * Event handler for when the window size changed
		 */
		_onResize: function() {
			var containerWidth = this.$el.width();
			var actionsWidth = 0;
			$.each(this.$el.find('#controls .actions'), function(index, action) {
				actionsWidth += $(action).outerWidth();
			});

			// substract app navigation toggle when visible
			containerWidth -= $('#app-navigation-toggle').width();
		},

		/**
		 * Selected/deselects the given file element and updated
		 * the internal selection cache.
		 *
		 * @param $tr single file row element
		 * @param state true to select, false to deselect
		 */
		_selectUserEl: function($tr, state) {
			var $checkbox = $tr.find('td.filename>input:checkbox');
			var oldData = !!this._selectedUsers[$tr.data('id')];
			var data;
			$checkbox.prop('checked', state);
			$tr.toggleClass('selected', state);
			// already selected ?
			if (state === oldData) {
				return;
			}
			data = this.elementToFile($tr);
			if (state) {
				this._selectedUsers[$tr.data('id')] = data;
				this._selectionSummary.add(data);
			} else {
				delete this._selectedUsers[$tr.data('id')];
				this._selectionSummary.remove(data);
			}
			this.$el.find('.select-all').prop('checked', this._selectionSummary.getTotal() === this.files.length);
		},

		/**
		 * Event handler for when clicking on a user (name or checkbox)
		 */
		_onClickUser: function(e) {
			var $tr = $(e.target).closest('tr');
			this._selectUserEl($tr, !$tr.hasClass('selected'));
			this._lastChecked = $tr;
			this.updateSelectionSummary();
		},

		/**
		 * Event handler for when selecting/deselecting all files
		 */
		_onClickSelectAll: function(e) {
			var checked = $(e.target).prop('checked');
			this.$deletedUsersList.find('td.username>input:checkbox').prop('checked', checked)
				.closest('tr').toggleClass('selected', checked);
			this._selectedUsers = {};
			this._selectionSummary.clear();
			if (checked) {
				for (var i = 0; i < this.deletedUsers.length; i++) {
					var userData = this.deletedUsers[i];
					this._selectedUsers[userData.id] = userData;
					this._selectionSummary.add(userData);
				}
			}
			this.updateSelectionSummary();
		},

		/**
		 * Event handler for when clicking on "Delete" for the selected files
		 */
		_onClickDeleteSelected: function(event) {
			var users = null;
			if (!this.isAllSelected()) {
				users = _.pluck(this.getSelectedUsers(), 'name');
			}
			this.do_delete(users);
			event.preventDefault();
			return false;
		},

		/**
		 * Event handler when clicking on a table header
		 */
		_onClickHeader: function(e) {
			var $target = $(e.target);
			var sort;
			if (!$target.is('a')) {
				$target = $target.closest('a');
			}
			sort = $target.attr('data-sort');
			if (sort) {
				if (this._sort === sort) {
					this.setSort(sort, (this._sortDirection === 'desc')?'asc':'desc', true);
				}
				else {
					if ( sort === 'name' ) {	//default sorting of name is opposite to size and mtime
						this.setSort(sort, 'asc', true);
					}
					else {
						this.setSort(sort, 'desc', true);
					}
				}
			}
		},

		/**
		 * Event handler for when scrolling the list container.
		 * This appends/renders the next page of entries when reaching the bottom.
		 */
		_onScroll: function(e) {
			if (this.$container.scrollTop() + this.$container.height() > this.$el.height() - 300) {
				this._nextPage(true);
			}
		},

		/**
		 * Sets a new page title
		 */
		setPageTitle: function(title){
			if (title) {
				title += ' - ';
			} else {
				title = '';
			}
			title += this.appName;
			// Sets the page title with the " - ownCloud" suffix as in templates
			window.document.title = title + ' - ' + oc_defaults.title;

			return true;
		},
		/**
		 * Returns the tr element for a given user name
		 * @param name user name
		 */
		findUserEl: function(name){
			// use filterAttr to avoid escaping issues
			//TODO: adjust data-file
			return this.$deletedUsersList.find('tr').filterAttr('data-file', name);
		},

		/**
		 * Returns the file data from a given file element.
		 * @param $el file tr element
		 * @return file data
		 *
		 */
		// TODO: adjust
		elementToFile: function($el){
			$el = $($el);
			return {
				id: parseInt($el.attr('data-id'), 10),
				name: $el.attr('data-file'),
				mimetype: $el.attr('data-mime'),
				type: $el.attr('data-type'),
				size: parseInt($el.attr('data-size'), 10),
				etag: $el.attr('data-etag')
			};
		},

		/**
		 * Appends the next page of files into the table
		 * @param animate true to animate the new elements
		 * @return array of DOM elements of the newly added files
		 */
		_nextPage: function(animate) {
			var index = this.$deletedUsersList.children().length,
				count = this.pageSize,
				tr,
				userData,
				newTrs = [],
				isAllSelected = this.isAllSelected();

			if (index >= this.deletedUsers.length) {
				return false;
			}

			while (count > 0 && index < this.deletedUsers.length) {
				userData = this.deletedUsers[index];
				tr = this._renderRow(userData, {updateSummary: false, silent: true});
				this.$deletedUsersList.append(tr);
				if (isAllSelected || this._selectedUsers[userData.id]) {
					tr.addClass('selected');
					tr.find('input:checkbox').prop('checked', true);
				}
				if (animate) {
					tr.addClass('appear transparent');
				}
				newTrs.push(tr);
				index++;
				count--;
			}

			if (animate) {
				// defer, for animation
				window.setTimeout(function() {
					for (var i = 0; i < newTrs.length; i++ ) {
						newTrs[i].removeClass('transparent');
					}
				}, 0);
			}
			return newTrs;
		},

		/**
		 * Sets the users to be displayed in the list.
		 * This operation will re-render the list and update the summary.
		 * @param filesArray array of file data (map)
		 */
		setDeletedUsers: function(filesArray) {
			// detach to make adding multiple rows faster
			this.deletedUsers = filesArray;

			this.$deletedUsersList.empty();

			// clear "Select all" checkbox
			this.$el.find('.select-all').prop('checked', false);

			this.isEmpty = this.deletedUsers.length == 0;
			this._nextPage();

			this.updateEmptyContent();

			this._selectedUsers = {};
			this.updateSelectionSummary();
			$(window).scrollTop(0);

			this.$deletedUsersList.trigger(jQuery.Event("updated"));
		},
		/**
		 * Creates a new table row element using the given file data.
		 * @param fileData map of file attributes
		 * @param options map of attribute "loading" whether the entry is currently loading
		 * @return new tr element (not appended to the table)
		 */
		//TODO: adjust
		_createRow: function(userData, options) {
			var td,
				ocName      = userData.ocName,
				dn          = userData.dn,
				uid         = userData.uid,
				displayName = userData.displayName,
				homePath    = userData.homePath,
				lastLogin   = userData.lastLogin,
				email       = userData.email,
				isSharer    = userData.hasActiveShares,
				options     = options || {};

			//containing tr
			var tr = $('<tr></tr>').attr({
				"data-id" :         ocName,
				"data-displayName": displayName,
				"data-dn":          dn,
				"data-uid":         uid,
				"data-homePath":    homePath,
				"data-email":       email
			});

			// username td
			td = $('<td></td>').attr({
				"class": "username",
				"style": "padding-right: 3px"
				//TODO: user Avatar as background image
// 				"style": 'background-image:url(' + icon + '); background-size: 32px;'
			});
			td.append('<input id="select-' + this.id + '-' + ocName +
				'" type="checkbox" /><label for="select-' + this.id + '-' + ocName + '"></label>');

			var avatar = $('<div></div>').attr({
				"class": "avatardiv",
// 				"style": "display: table-cell;"
			});
			avatar.imageplaceholder(ocName, displayName);
			$(avatar, tr).avatar(ocName, 32);
			td.append(avatar);

			var nc = $('<a></a>').attr({
				"class": "namecontainer"
			});


			var nameSpan=$('<span></span>').addClass('nametext');
			var innernameSpan = $('<span></span>').addClass('innernametext').text(displayName);
// 			nameSpan.append(avatar);
			nameSpan.append(innernameSpan);
			nc.append(nameSpan);

			td.append(nc);

			tr.append(td);



			//LDAP User Name
			td = $('<td></td>').attr({
				"class": "ldap-uid",
			});
			td.text(uid);
			tr.append(td);

			//LDAP DN
			td = $('<td></td>').attr({
				"class": "ldap-dn",
			});
			if(dn.length == 0) {
				dn = 'DEMO DN';
			}
			td.text(dn);
			tr.append(td);

			//Email
			td = $('<td></td>').attr({
				"class": "user-email",
			});
			td.text(email);
			tr.append(td);

			//Last login
			if(parseInt(lastLogin) === 0) {
				lastLoginText  = t('user_ldap', 'never');
				lastLoginExact = '';
			} else {
				lastLoginText = OC.Util.relativeModifiedDate(lastLogin);
				lastLoginExact = formatDate(lastLogin);
			}
			td = $('<td></td>').attr({ "class": "login" });
			td.append($('<span></span>').attr({
				"class": "lastLogin",
				"title": lastLoginExact,
			}).text(lastLoginText));
			tr.append(td);

			return tr;
		},

		/**
		 * Adds an entry to the files array and also into the DOM
		 * in a sorted manner.
		 *
		 * @param userData map of file attributes
		 * @param options map of attributes:
		 * - "updateSummary": true to update the summary after adding (default), false otherwise
		 * - "silent": true to prevent firing events like "fileActionsReady"
		 * - "animate": true to animate preview loading (defaults to true here)
		 * @return new tr element (not appended to the table)
		 */
		add: function(userData, options) {
			var index = -1;
			var $tr;
			var $rows;
			var $insertionPoint;
			options = _.extend({animate: true}, options || {});

			// there are three situations to cover:
			// 1) insertion point is visible on the current page
			// 2) insertion point is on a not visible page (visible after scrolling)
			// 3) insertion point is at the end of the list

			$rows = this.$deletedUsersList.children();
			index = this._findInsertionIndex(userData);
			if (index > this.deletedUsers.length) {
				index = this.deletedUsers.length;
			}
			else {
				$insertionPoint = $rows.eq(index);
			}

			// is the insertion point visible ?
			if ($insertionPoint.length) {
				// only render if it will really be inserted
				$tr = this._renderRow(userData, options);
				$insertionPoint.before($tr);
			}
			else {
				// if insertion point is after the last visible
				// entry, append
				if (index === $rows.length) {
					$tr = this._renderRow(userData, options);
					this.$deletedUsersList.append($tr);
				}
			}

			this.isEmpty = false;
			this.deletedUsers.splice(index, 0, userData);

			if ($tr && options.animate) {
				$tr.addClass('appear transparent');
				window.setTimeout(function() {
					$tr.removeClass('transparent');
				});
			}

			// defaults to true if not defined
			if (typeof(options.updateSummary) === 'undefined' || !!options.updateSummary) {
				this.updateEmptyContent();
			}

			return $tr;
		},

		/**
		 * Creates a new row element based on the given attributes
		 * and returns it.
		 *
		 * @param fileData map of file attributes
		 * @param options map of attributes:
		 * - "index" optional index at which to insert the element
		 * - "updateSummary" true to update the summary after adding (default), false otherwise
		 * - "animate" true to animate the preview rendering
		 * @return new tr element (not appended to the table)
		 */
		//TODO: adjust
		_renderRow: function(fileData, options) {
			options = options || {};
			var type = fileData.type || 'file',
				mime = fileData.mimetype,
				path = fileData.path,
				permissions = parseInt(fileData.permissions, 10) || 0;

			if (fileData.isShareMountPoint) {
				permissions = permissions | OC.PERMISSION_UPDATE;
			}

			if (type === 'dir') {
				mime = mime || 'httpd/unix-directory';
			}
			var tr = this._createRow(
				fileData,
				options
			);
			var filenameTd = tr.find('td.filename');

			if (options.hidden) {
				tr.addClass('hidden');
			}
			return tr;
		},

		/**
		 * Sets the current sorting and refreshes the list
		 *
		 * @param sort sort attribute name
		 * @param direction sort direction, one of "asc" or "desc"
		 * @param update true to update the list, false otherwise (default)
		 */
		setSort: function(sort, direction, update) {
			var comparator = DeletedUsersList.Comparators[sort] || DeletedUsersList.Comparators.name;
			this._sort = sort;
			this._sortDirection = (direction === 'desc')?'desc':'asc';
			this._sortComparator = comparator;

			if (direction === 'desc') {
				this._sortComparator = function(userInfo1, userInfo2) {
					return -comparator(userInfo1, userInfo2);
				};
			}
			this.$el.find('thead th .sort-indicator')
				.removeClass(this.SORT_INDICATOR_ASC_CLASS)
				.removeClass(this.SORT_INDICATOR_DESC_CLASS)
				.toggleClass('hidden', true)
				.addClass(this.SORT_INDICATOR_DESC_CLASS);

			this.$el.find('thead th.column-' + sort + ' .sort-indicator')
				.removeClass(this.SORT_INDICATOR_ASC_CLASS)
				.removeClass(this.SORT_INDICATOR_DESC_CLASS)
				.toggleClass('hidden', false)
				.addClass(direction === 'desc' ? this.SORT_INDICATOR_DESC_CLASS : this.SORT_INDICATOR_ASC_CLASS);
			if (update) {
				if (this._clientSideSort) {
					this.deletedUsers.sort(this._sortComparator);
					this.setDeletedUsers(this.deletedUsers);
				}
				else {
					this.reload();
				}
			}
		},

		/**
		 * Reloads the deleted users list using ajax call
		 *
		 * @return ajax call object
		 */
		reload: function() {
			this._selectedUsers = {};
			this.$el.find('.select-all').prop('checked', false);
			this.showMask();
			if (this._reloadCall) {
				this._reloadCall.abort();
			}
			this._reloadCall = $.ajax({
				url: this.getAjaxUrl('list'),
				data: {
					offset: 0,
					sort: this._sort,
					sortdirection: this._sortDirection
				}
			});
			var callBack = this.reloadCallback.bind(this);
			return this._reloadCall.then(callBack, callBack);
		},
		reloadCallback: function(result) {
			delete this._reloadCall;
			this.hideMask();

			if (!result || result.status === 'error') {
				// if the error is not related to folder we're trying to load, reload the page to handle logout etc
				if (result.data.error === 'authentication_error' ||
					result.data.error === 'token_expired' ||
					result.data.error === 'application_not_enabled' || true
				) {
					OC.redirect(OC.generateUrl('settings/admin'));
				}
				OC.Notification.show(result.data.message);
				return false;
			}

			if (result.status === 404) {
				// go back home
				return false;
			}
			// aborted ?
			if (result.status === 0){
				return true;
			}

			this.setDeletedUsers(result.data.users);
			return true;
		},

		getAjaxUrl: function(action, params) {
			return OCA.UserLDAP.DeletedUsersController.getAjaxUrl(action, params);
		},

		/**
		 * Removes a file entry from the list
		 * @param name name of the file to remove
		 * @param options optional options as map:
		 * "updateSummary": true to update the summary (default), false otherwise
		 * @return deleted element
		 */
		remove: function(name, options){
			options = options || {};
			var userEl = this.findUserEl(name);
			var index = userEl.index();
			if (!userEl.length) {
				return null;
			}
			if (this._selectedUsers[userEl.data('id')]) {
				// remove from selection first
				this._selectUserEl(userEl, false);
				this.updateSelectionSummary();
			}
			this.deletedUsers.splice(index, 1);
			userEl.remove();
			// TODO: improve performance on batch update
			this.isEmpty = !this.deletedUsers.length;
			if (typeof(options.updateSummary) === 'undefined' || !!options.updateSummary) {
				this.updateEmptyContent();
			}

			var lastIndex = this.$deletedUsersList.children().length;
			// if there are less elements visible than one page
			// but there are still pending elements in the array,
			// then directly append the next page
			if (lastIndex < this.deletedUsers.length && lastIndex < this.pageSize) {
				this._nextPage(true);
			}

			return userEl;
		},
		/**
		 * Finds the index of the row before which the given
		 * userData should be inserted, considering the current
		 * sorting
		 */
		_findInsertionIndex: function(userData) {
			var index = 0;
			while (index < this.deletedUsers.length && this._sortComparator(userData, this.deletedUsers[index]) > 0) {
				index++;
			}
			return index;
		},

		inList:function(file) {
			return this.findUserEl(file).length;
		},
		/**
		 * Delete the given users
		 * @param users file names list (without path)
		 */
		do_delete:function(users) {
			var self = this;
			var params;
			if (users && users.substr) {
				users=[users];
			}
			if (users) {
				for (var i=0; i<users.length; i++) {
					var deleteAction = this.findUserEl(users[i]).children("td.date").children(".action.delete");
					deleteAction.removeClass('delete-icon').addClass('progress-icon');
				}
			}
			// Finish any existing actions
			if (this.lastAction) {
				this.lastAction();
			}

			params = {};
			if (users) {
				params.users = JSON.stringify(users);
			}
			else {
				// no users passed, delete all in current dir
				params.allUsers = true;
				// show spinner for all users
				this.$deletedUsersList.find('tr>td.date .action.delete').removeClass('delete-icon').addClass('progress-icon');
			}

			$.post(OC.filePath('users', 'ajax', 'delete.php'),
					params,
					function(result) {
						if (result.status === 'success') {
							if (params.allUsers) {
								self.setDeletedUsers([]);
							}
							else {
								$.each(users,function(index,user) {
									var fileEl = self.remove(user, {updateSummary: false});
									// FIXME: not sure why we need this after the
									// element isn't even in the DOM any more
									fileEl.find('input[type="checkbox"]').prop('checked', false);
									fileEl.removeClass('selected');
								});
							}
							// TODO: this info should be returned by the ajax call!
							self.updateEmptyContent();
							self.updateSelectionSummary();
						} else {
							if (result.status === 'error' && result.data.message) {
								OC.Notification.show(result.data.message);
							}
							else {
								OC.Notification.show(t('users', 'Error deleting user.'));
							}
							// hide notification after 10 sec
							setTimeout(function() {
								OC.Notification.hide();
							}, 10000);
							if (params.allUsers) {
								// reload the page as we don't know what users were deleted
								// and which ones remain
								self.reload();
							}
							else {
								$.each(users,function(index,user) {
									var deleteAction = self.findUserEl(user).find('.action.delete');
									deleteAction.removeClass('progress-icon').addClass('delete-icon');
								});
							}
						}
					});
		},

		updateEmptyContent: function() {
			//TODO determine deletedUsersPresent
			var deletedUsersPresent = true;
			this.$el.find('#emptycontent').toggleClass('hidden', deletedUsersPresent);
			this.$el.find('#deletedUsersTable thead th').toggleClass('hidden', !deletedUsersPresent);
		},

		/**
		 * Shows the loading mask.
		 *
		 * @see #hideMask
		 */
		showMask: function() {
			// in case one was shown before
			var $mask = this.$el.find('.mask');
			if ($mask.exists()) {
				return;
			}

			this.$table.addClass('hidden');

			$mask = $('<div class="mask transparent"></div>');

			$mask.css('background-image', 'url('+ OC.imagePath('core', 'loading.gif') + ')');
			$mask.css('background-repeat', 'no-repeat');
			this.$el.append($mask);

			$mask.removeClass('transparent');
		},
		/**
		 * Hide the loading mask.
		 * @see #showMask
		 */
		hideMask: function() {
			this.$el.find('.mask').remove();
			this.$table.removeClass('hidden');
		},
		scrollTo:function(user) {
			//scroll to and highlight preselected user
			var $scrollToRow = this.findUserEl(user);
			if ($scrollToRow.exists()) {
				$scrollToRow.addClass('searchresult');
				$(window).scrollTop($scrollToRow.position().top);
				//remove highlight when hovered over
				$scrollToRow.one('hover', function() {
					$scrollToRow.removeClass('searchresult');
				});
			}
		},
		//TODO adjust
		filter:function(query) {
			this.$deletedUsersList.find('tr').each(function(i,e) {
				if ($(e).data('file').toString().toLowerCase().indexOf(query.toLowerCase()) !== -1) {
					$(e).addClass("searchresult");
				} else {
					$(e).removeClass("searchresult");
				}
			});
			//do not use scrollto to prevent removing searchresult css class
			var first = this.$deletedUsersList.find('tr.searchresult').first();
			if (first.exists()) {
				$(window).scrollTop(first.position().top);
			}
		},
		unfilter:function() {
			this.$deletedUsersList.find('tr.searchresult').each(function(i,e) {
				$(e).removeClass("searchresult");
			});
		},
		/**
		 * Update UI based on the current selection
		 */
		updateSelectionSummary: function() {
			var summary = this._selectionSummary.summary;
			if (summary.totalUsers === 0) {
				this.$el.find('#headerName a.name>span:first').text(t('user_ldap','Name'));
				this.$el.find('#headerUid a.ldap-uid>span:first').removeClass('invisible');
				this.$el.find('#headerDN a.ldap-dn>span:first').removeClass('invisible');
				this.$el.find('#headerEmail a.user-email>span:first').removeClass('invisible');
				this.$el.find('#headerLastLogin a.lastLogin>span:first').removeClass('invisible');

				this.$el.find('table').removeClass('multiselect');
				this.$el.find('.selectedActions').addClass('hidden');
			} else {
				this.$el.find('.selectedActions').removeClass('hidden');

				var selection = '';
				if (summary.totalUsers > 0) {
					selection += n('user_ldap', '%n user', '%n users', summary.totalUsers);
				}
				this.$el.find('#headerName a.name>span:first').text(selection);

				this.$el.find('#headerUid a.ldap-uid>span:first').addClass('invisible');
				this.$el.find('#headerDN a.ldap-dn>span:first').addClass('invisible');
				this.$el.find('#headerEmail a.user-email>span:first').addClass('invisible');
				this.$el.find('#headerLastLogin a.lastLogin>span:first').addClass('invisible');

				this.$el.find('table').addClass('multiselect');
				this.$el.find('.delete-selected').toggleClass('hidden', false);
			}
		},

		/**
		 * Returns whether all files are selected
		 * @return true if all files are selected, false otherwise
		 */
		isAllSelected: function() {
			return this.$el.find('.select-all').prop('checked');
		},

		/**
		 * Returns the file info of the selected files
		 *
		 * @return array of file names
		 */
		getSelectedUsers: function() {
			return _.values(this._selectedUsers);
		},
	}

	/**
	 * Sort comparators.
	 */
	DeletedUsersList.Comparators = {
		/**
		 * Compares two file infos by name, making directories appear
		 * first.
		 *
		 * @param userInfo1 file info
		 * @param userInfo2 file info
		 * @return -1 if the first file must appear before the second one,
		 * 0 if they are identify, 1 otherwise.
		 */
		name: function(userInfo1, userInfo2) {
			if (userInfo1.type === 'dir' && userInfo2.type !== 'dir') {
				return -1;
			}
			if (userInfo1.type !== 'dir' && userInfo2.type === 'dir') {
				return 1;
			}
			return userInfo1.name.localeCompare(userInfo2.name);
		},
		/**
		 * Compares two file infos by size.
		 *
		 * @param fileInfo1 file info
		 * @param fileInfo2 file info
		 * @return -1 if the first file must appear before the second one,
		 * 0 if they are identify, 1 otherwise.
		 */
		//TODO: adjust, left as example
		size: function(fileInfo1, fileInfo2) {
			return fileInfo1.size - fileInfo2.size;
		},
	};

	if(!OCA.UserLDAP) {
		OCA.UserLDAP = {};
	}
	OCA.UserLDAP.DeletedUsersList = DeletedUsersList;
})();
