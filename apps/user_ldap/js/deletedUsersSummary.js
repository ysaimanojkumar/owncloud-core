/**
* ownCloud
*
* @author Arthur Schiwon
* @copyright 2014 Arthur Schiwon <blizzz@owncloud.com>
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
* License as published by the Free Software Foundation; either
* version 3 of the License, or any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU AFFERO GENERAL PUBLIC LICENSE for more details.
*
* You should have received a copy of the GNU Affero General Public
* License along with this library.  If not, see <http://www.gnu.org/licenses/>.
*
*/

/* global OC, n, t */

(function() {
	/**
	 * The DeletedUsersSummary class encapsulates the file summary values and
	 * the logic to render it in the given container
	 * @param $tr table row element
	 * $param summary optional initial summary value
	 */
	var DeletedUsersSummary = function($tr) {
		this.$el = $tr;
		this.clear();
		this.render();
	};

	DeletedUsersSummary.prototype = {
		summary: {
			totalUsers: 0,
		},

		/**
		 * Adds user
		 * @param user user to add
		 * @param update whether to update the display
		 */
		add: function(user, update) {
			this.summary.totalUsers++;
			if (!!update) {
				this.update();
			}
		},
		/**
		 * Removes user
		 * @param user user to remove
		 * @param update whether to update the display
		 */
		remove: function(user, update) {
			this.summary.totalUsers--;
			if (!!update) {
				this.update();
			}
		},
		/**
		 * Returns the total of users
		 */
		getTotal: function() {
			return this.summary.totalUsers;
		},
		/**
		 * Recalculates the summary based on the given files array
		 * @param users array of users
		 */
		calculate: function(users) {
			var file;
			var summary = {
				totalUsers: 0
			};

			for (var i = 0; i < users.length; i++) {
				users = users[i];
				summary.totalUsers++;
			}
			this.setSummary(summary);
		},
		/**
		 * Clears the summary
		 */
		clear: function() {
			this.calculate([]);
		},
		/**
		 * Sets the current summary values
		 * @param summary map
		 */
		setSummary: function(summary) {
			this.summary = summary;
			this.update();
		},

		/**
		 * Renders the file summary element
		 */
		update: function() {
			if (!this.$el) {
				return;
			}
			if (!this.summary.totalUsers) {
				this.$el.addClass('hidden');
				return;
			}
			// There's a summary and data -> Update the summary
			this.$el.removeClass('hidden');
			var $userInfo = this.$el.find('.deleteduserinfo');

			// Substitute old content with new translations
			$userInfo.html(n('user_ldap', '%n user', '%n users', this.summary.totalUsers));

			// Show only what's necessary (may be hidden)
			if (this.summary.totalUsers === 0) {
				$userInfo.addClass('hidden');
				$connector.addClass('hidden');
			} else {
				$userInfo.removeClass('hidden');
			}
		},
		render: function() {
			if (!this.$el) {
				return;
			}
			// TODO: ideally this should be separate to a template or something
			var summary = this.summary;
			var userInfo = n('user_ldap', '%n user', '%n users', summary.totalUsers);

			var infoVars = {
				users: '<span class="deleteduserinfo">'+userInfo+'</span>'
			};

			var info = t('user_ldap', '{users}', infoVars);

			var $summary = $('<td><span class="info">'+info+'</span></td><td class="login"></td>');

			if (!this.summary.totalUsers) {
				this.$el.addClass('hidden');
			}

			this.$el.append($summary);
		}
	};
	OCA.UserLDAP.DeletedUsersSummary = DeletedUsersSummary;
})();

