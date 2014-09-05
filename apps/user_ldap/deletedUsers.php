<?php

/**
 * ownCloud
 *
 * @author Artuhr Schiwon
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

OC_Util::checkAdminUser();

OCP\Util::addStyle('user_ldap', 'deletedUsers');
OCP\Util::addScript('user_ldap', 'deletedUsers-list');
OCP\Util::addScript('user_ldap', 'deletedUsersSummary');
OCP\Util::addScript('user_ldap', 'deletedUsers-controller');

$tmpl = new OCP\Template('user_ldap', 'deletedUsers', 'user');
$tmpl->printPage();
