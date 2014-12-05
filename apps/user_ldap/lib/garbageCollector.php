<?php

/**
 * ownCloud – LDAP Helper
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

namespace OCA\User_LDAP\GarbageCollector;

use OCA\User_LDAP\User\OfflineUser;
use OCA\user_ldap\lib\Access;

/**
 * Class GarbageCollector
 * @package OCA\User_LDAP
 */
class GarbageCollector {
	/**
	 * @var \OC\Preferences $preferences
	 */
	protected $preferences;

	/**
	 * @var \OCP\IDBConnection $db
	 */
	protected $db;

	/**
	 * @var \OCA\user_ldap\lib\Access $access
	 */
	protected $access;

	/**
	 * @var int $limit
	 */
	protected $limit = 10;

	/**
	 * @var array $deletedUsers
	 */
	protected $deletedUsers = false;

	public function __construct(\OC\Preferences $preferences, \OCP\IDBConnection $db, Access $access) {
		$this->preferences = $preferences;
		$this->db = $db;
		$this->access = $access;
	}

	/**
	 * returns key to be used against $this->deletedUsers
	 * @param int $limit
	 * @param int $offset
	 * @return string
	 */
	private function getDeletedUsersCacheKey($limit, $offset) {
		return strval($limit) . '.' . strval($offset);
	}

	/**
	 * reads LDAP users marked as deleted from the database
	 * @param int $offset
	 * @return \OCA\User_LDAP\User\OfflineUser[]
	 */
	private function fetchDeletedUsers($offset) {
		$deletedUsers = $this->preferences->getUsersForValue(
			'user_ldap', 'isDeleted', '1', $this->limit, $offset);
		$key = $this->getDeletedUsersCacheKey($this->limit, $offset);

		$userObjects = array();
		foreach($deletedUsers as $user) {
			$userObjects[] = new OfflineUser($user, $this->preferences, $this->db, $this->access);
		}

		$this->deletedUsers[$key] = $userObjects;
		if(count($userObjects) > 0) {
			$this->hasDeletedUsers();
		}
		return $this->deletedUsers[$key];
	}

	/**
	 * returns all LDAP users that are marked as deleted
	 * @return \OCA\User_LDAP\User\OfflineUser[]
	 */
	public function getDeletedUsers($offset = null) {
		$key = $this->getDeletedUsersCacheKey($this->limit, $offset);
		if(is_array($this->deletedUsers) && isset($this->deletedUsers[$key])) {
			return $this->deletedUsers[$key];
		}
		return $this->fetchDeletedUsers($offset);
	}

	/**
	 * whether at least one user was detected as deleted
	 * @return bool
	 */
	public function hasDeletedUsers() {
		if($this->deletedUsers === false) {
			$this->fetchDeletedUsers(0);
		}
		foreach($this->deletedUsers as $batch) {
			if(count($batch) > 0) {
				return true;
			}
		}
		return false;
	}
}
