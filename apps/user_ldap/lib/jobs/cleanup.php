<?php
/**
 * Copyright (c) 2014 Arthur Schiwon <blizzz@owncloud.com>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\user_ldap\lib;

/**
 * Class CleanUp
 *
 * a Background job to clean up deleted users
 *
 * @package OCA\user_ldap\lib;
 */
class CleanUp extends \OC\BackgroundJob\TimedJob {
	/**
	 * @var int $limit amount of users that should be checked per run
	 */
	protected $limit = 50;

	/**
	 * @var \OCP\UserInterface $userBackend
	 */
	protected $userBackend;

	/**
	 * @var \OCP\IConfig $ocConfig
	 */
	protected $ocConfig;

	/**
	 * @var \OCP\IDBConnection $db
	 */
	protected $db;

	/**
	 * @var Helper $ldapHelper
	 */
	protected $ldapHelper;

	public function __construct() {
		$this->setInterval(23 * 60);
	}

	/**
	 * assigns the instances passed to run() to the class properties
	 * @param array $arguments
	 */
	public function setArguments($arguments) {
		$this->userBackend = $arguments['userBackend'];
		$this->ocConfig    = $arguments['ocConfig'];
		$this->db          = $arguments['db'];
		$this->ldapHelper  = $arguments['helper'];
	}

	/**
	 * makes the background job do its work
	 * @param array $argument
	 */
	public function run($argument) {
		$this->setArguments($argument);

		if(!$this->isCleanUpAllowed()) {
			return;
		}

		$users = $this->getMappedUsers($this->limit, $this->getOffset());
		if(!is_array($users)) {
			//something wrong? Let's start from the beginning next time and
			//abort
			$this->setOffset(0, true);
			return;
		}
		$resetOffset = (count($users) < $this->limit) ? true : false;
		$this->checkUsers($users);
		$this->setOffset($resetOffset);
	}

	/**
	 * checks whether cleaning up LDAP users is allowed
	 * @return true
	 */
	public function isCleanUpAllowed() {
		try {
			if($this->haveDisabledConfigurations()) {
				return false;
			}
		} catch (\Exception $e) {
			return false;
		}

		$enabled = $this->isCleanUpEnabled();

		return $enabled;
	}

	/**
	 * checks whether clean up is enabled by configuration
	 * @return bool
	 */
	private function isCleanUpEnabled() {
		return $this->ocConfig->getSystemValue('ldapUserCleanupEnabled', false);
	}

	/**
	 * checks whether there is one or more disabled LDAP configurations
	 * @throws \Exception
	 * @return bool
	 */
	private function haveDisabledConfigurations() {
		$all = $this->ldapHelper->getServerConfigurationPrefixes(false);
		$active = $this->ldapHelper->getServerConfigurationPrefixes(true);

		if(!is_array($all) || !is_array($active)) {
			throw new \Exception('Unexpected Return Value');
		}

		return count($all) !== count($active) || count($all) === 0;
	}

	/**
	 * checks users whether they are still existing
	 * @param array $users result from getMappedUsers()
	 */
	private function checkUsers($users) {
		foreach($users as $user) {
			$this->checkUser($user, $this->ocConfig);
		}
	}

	/**
	 * checks whether a user is still existing in LDAP
	 * @param string[] $user
	 */
	private function checkUser($user) {
		if($this->userBackend->userExists($user['name'])) {
			//still available, all good
			return;
		}

		$this->ocConfig->setUserValue($user['name'], 'user_ldap', 'isDeleted', '1');
	}

	/**
	 * returns a batch of users from the mappings table
	 * @param int $limit
	 * @param int $offset
	 * @return array
	 */
	private function getMappedUsers($limit, $offset) {
		$query = $this->db->prepare('
			SELECT
				`ldap_dn` AS `dn`,
				`owncloud_name` AS `name`,
				`directory_uuid` AS `uuid`
			FROM `*PREFIX*ldap_user_mapping`',
			$limit,
			$offset
		);

		return $query->execute()->fetchAll();
	}

	/**
	 * gets the offset to fetch users from the mappings table
	 * @return int
	 */
	private function getOffset() {
		return $this->ocConfig->getAppValue('user_ldap', 'cleanUpJobOffset', 0);
	}

	/**
	 * sets the new offset for the next run
	 * @param bool $reset whether the offset should be set to 0
	 */
	public function setOffset($reset = false) {
		$newOffset = $reset ? 0 :
			$this->getOffset() + $this->limit;
		$this->ocConfig->setAppValue('user_ldap', 'cleanUpJobOffset', $newOffset);
	}

	/**
	 * returns the chunk size (limit in DB speak)
	 * @return int
	 */
	public function getChunkSize() {
		return $this->limit;
	}

}
