<?php
/**
 * Copyright (c) 2014 Arthur Schiwon <blizzz@owncloud.com>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\user_ldap\tests;

class Test_CleanUp extends \PHPUnit_Framework_TestCase {
	public function getMocks() {
		$mocks = array();
		$mocks['userBackend'] =
			$this->getMockBuilder('\OCA\user_ldap\User_Proxy')
				->disableOriginalConstructor()
				->getMock();
		$mocks['ocConfig']    = $this->getMock('\OCP\IConfig');
		$mocks['db']          = $this->getMock('\OCP\IDBConnection');
		$mocks['helper']      = $this->getMock('\OCA\user_ldap\lib\Helper');

		return $mocks;
	}

	/**
	 * clean up job must not run when there are disabled configurations
	 */
	public function test_runNotAllowedByDisabledConfigurations() {
		$args = $this->getMocks();
		$args['helper']->expects($this->exactly(2))
			->method('getServerConfigurationPrefixes')
			->will($this->onConsecutiveCalls(
				array_pad(array(), 4, true),
				array_pad(array(), 3, true))
			);

		$args['ocConfig']->expects($this->never())
			->method('getSystemValue');

		$bgJob = new \OCA\User_LDAP\Jobs\CleanUp();
		$bgJob->setArguments($args);

		$result = $bgJob->isCleanUpAllowed();
		$this->assertSame(false, $result);
	}

	/**
	 * clean up job must not run when LDAP Helper is broken i.e.
	 * returning unexpected results
	 */
	public function test_runNotAllowedByBrokenHelper() {
		$args = $this->getMocks();
		$args['helper']->expects($this->exactly(2))
			->method('getServerConfigurationPrefixes')
			->will($this->returnValue(null)	);

		$args['ocConfig']->expects($this->never())
			->method('getSystemValue');

		$bgJob = new \OCA\User_LDAP\Jobs\CleanUp();
		$bgJob->setArguments($args);

		$result = $bgJob->isCleanUpAllowed();
		$this->assertSame(false, $result);
	}

	/**
	 * clean up job must not run when it is not enabled
	 */
	public function test_runNotAllowedBySysConfig() {
		$args = $this->getMocks();
		$args['helper']->expects($this->exactly(2))
			->method('getServerConfigurationPrefixes')
			->will($this->onConsecutiveCalls(
				array_pad(array(), 4, true),
				array_pad(array(), 4, true))
			);

		$args['ocConfig']->expects($this->once())
			->method('getSystemValue')
			->will($this->returnValue(false));

		$bgJob = new \OCA\User_LDAP\Jobs\CleanUp();
		$bgJob->setArguments($args);

		$result = $bgJob->isCleanUpAllowed();
		$this->assertSame(false, $result);
	}

	/**
	 * clean up job is allowed to run
	 */
	public function test_runIsAllowed() {
		$args = $this->getMocks();
		$args['helper']->expects($this->exactly(2))
			->method('getServerConfigurationPrefixes')
			->will($this->onConsecutiveCalls(
				array_pad(array(), 4, true),
				array_pad(array(), 4, true))
			);

		$args['ocConfig']->expects($this->once())
			->method('getSystemValue')
			->will($this->returnValue(true));

		$bgJob = new \OCA\User_LDAP\Jobs\CleanUp();
		$bgJob->setArguments($args);

		$result = $bgJob->isCleanUpAllowed();
		$this->assertSame(true, $result);
	}

	/**
	 * test whether sql is OK
	 */
	public function test_getMappedUsers() {
		$args = $this->getMocks();

		$expectedQuery = "SELECT
				`ldap_dn` AS `dn`,
				`owncloud_name` AS `name`,
				`directory_uuid` AS `uuid`
			FROM `*PREFIX*ldap_user_mapping`'";

		$bgJob = new \OCA\User_LDAP\Jobs\CleanUp();
		$bgJob->setArguments($args);

		if(version_compare(\PHPUnit_Runner_Version::id(), '3.8', '<')) {
			//otherwise we run into
			//https://github.com/sebastianbergmann/phpunit-mock-objects/issues/103
			$this->markTestIncomplete();
		}

		$stmt = $this->getMock('\Doctrine\DBAL\Driver\Statement');

		$args['db']->expects($this->once())
			->method('prepare')
			->with($expectedQuery, 0, $bgJob->getChunkSize())
			->will($this->returnValue($stmt));

		$bgJob->getMappedUsers(0, $bgJob->getChunkSize());
	}

	/**
	 * check whether offset will be reset when it needs to
	 */
	public function test_OffsetResetIsNecessary() {
		$args = $this->getMocks();

		$bgJob = new \OCA\User_LDAP\Jobs\CleanUp();
		$bgJob->setArguments($args);

		$result = $bgJob->isOffsetResetNecessary($bgJob->getChunkSize() - 1);
		$this->assertSame(true, $result);
	}

	/**
	 * make sure offset is not reset when it is not due
	 */
	public function test_OffsetResetIsNotNecessary() {
		$args = $this->getMocks();

		$bgJob = new \OCA\User_LDAP\Jobs\CleanUp();
		$bgJob->setArguments($args);

		$result = $bgJob->isOffsetResetNecessary($bgJob->getChunkSize());
		$this->assertSame(false, $result);
	}

}

