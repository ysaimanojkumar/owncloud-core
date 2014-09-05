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
	var DeletedUsersController = function() {
		this.initialize();
	};

	DeletedUsersController = {
		initialized: false,

		initialize: function() {
			if(this.initialized) {
				return;
			}

			this.deletedUsersList = new OCA.UserLDAP.DeletedUsersList(
				$('#app-content-deletedUsers'), {
					scrollContainer: $('#app-content'),
				}
			);
			this.deletedUsersList.reload();

			this.initialized = true;
		},

		/**
		 * Returns the ajax URL for a given action
		 * @param action action string
		 * @param params optional params map
		 */
		getAjaxUrl: function(action, params) {
			var q = '';
			if (params) {
				q = '?' + OC.buildQueryString(params);
			}
			return OC.filePath('user_ldap', 'ajax', 'deletedUsers/' + action + '.php') + q;
		},

	}

	OCA.UserLDAP.DeletedUsersController = DeletedUsersController;
})();

$(document).ready(function() {
	OCA.UserLDAP.DeletedUsersController.initialize();
});
