<?php

/**
 * ownCloud – LDAP User
 *
 * @author Arthur Schiwon
 * @copyright 2014 Arthur Schiwon blizzz@owncloud.com
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

namespace OCA\UserLdap\User;

use OCA\user_ldap\lib\Access;

class OfflineUser {
	/**
	 * @var string $ocName
	 */
	protected $ocName;
	/**
	 * @var string $dn
	 */
	protected $dn;
	/**
	 * @var string $uid the UID as provided by LDAP
	 */
	protected $uid;
	/**
	 * @var string $displayName
	 */
	protected $displayName;
	/**
	 * @var string $homePath
	 */
	protected $homePath;
	/**
	 * @var string $lastLogin the timestamp of the last login
	 */
	protected $lastLogin;
	/**
	 * @var string $email
	 */
	protected $email;
	/**
	 * @var bool $hasActiveShares
	 */
	protected $hasActiveShares;
	/**
	 * @var \OC\Preferences $preferences
	 */
	protected $preferences;
	/**
	 * @var \OCP\IDBConnection $db
	 */
	protected $db;
	/**
	 * @var \OCA\user_ldap\lib\Access
	 */
	protected $access;

	public function __construct($ocName, \OC\Preferences $preferences, \OCP\IDBConnection $db, Access $access) {
		$this->ocName = $ocName;
		$this->preferences = $preferences;
		$this->db = $db;
		$this->access = $access;
		$this->fetchDetails();
	}

	public function export() {
		$data = array();
		$data['dn'] = $this->getDN();
		$data['ocName'] = $this->getOCName();
		$data['uid'] = $this->getUID();

		return $data;
	}

	/**
	 * getter for ownCloud name
	 * @return string
	 */
	public function getOCName() {
		return $this->ocName;
	}

	/**
	 * getter for LDAP uid
	 * @return string
	 */
	public function getUID() {
		return $this->uid;
	}

	/**
	 * getter for LDAP DN
	 * @return string
	 */
	public function getDN() {
		return $this->dn;
	}

	/**
	 * getter for display name
	 * @return string
	 */
	public function getDisplayName() {
		return $this->displayName;
	}

	/**
	 * getter for email
	 * @return string
	 */
	public function getEmail() {
		return $this->email;
	}

	/**
	 * getter for home directory path
	 * @return string
	 */
	public function getHomePath() {
		return $this->homePath;
	}

	/**
	 * getter for the last login timestamp
	 * @return int
	 */
	public function getLastLogin() {
		return intval($this->lastLogin);
	}

	/**
	 * reads the user details
	 */
	protected function fetchDetails() {
		$properties = array (
			'user_ldap' => 'displayName',
			'user_ldap' => 'uid',
			'user_ldap' => 'homePath',
			'settings'  => 'email',
			'login'     => 'lastLogin'
		);
		foreach($properties as $app => $property) {
			$this->$property = $this->preferences->getValue($this->ocName, $app, $property, '');
		}

		$dn = $this->access->username2dn($this->ocName);
		$this->dn = ($dn !== false) ? $dn : '';

		$this->determineShares();
	}


	/**
	 * finds out whether the user has active shares. The result is stored in
	 * $this->hasActiveShares
	 */
	protected function determineShares() {
		$query = $this->db->prepare('
			SELECT COUNT(`uid_owner`)
			FROM `*PREFIX*share`
			WHERE `uid_owner` = ?
		', 1);
		$query->execute(array($this->getOCName()));
		$sResult = $query->fetchColumn(0);
		if(intval($sResult) === 1) {
			$this->hasActiveShares = true;
			return;
		}

		$query = $this->db->prepare('
			SELECT COUNT(`owner`)
			FROM `*PREFIX*share_external`
			WHERE `owner` = ?
		', 1);
		$query->execute(array($this->getOCName()));
		$sResult = $query->fetchColumn(0);
		if(intval($sResult) === 1) {
			$this->hasActiveShares = true;
			return;
		}

		$this->hasActiveShares = false;
	}
}
