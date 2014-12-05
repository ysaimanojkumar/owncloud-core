<?php
/**
 * Copyright (c) 2012 Robin Appelman <icewind@owncloud.com>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace Test\Files;

use OC\Files\Filesystem;
use OCP\Share;

class EtagTest extends \Test\TestCase {
	private $datadir;

	private $tmpDir;

	private $uid;

	/**
	 * @var \OC_User_Dummy $userBackend
	 */
	private $userBackend;

	/** @var \OC\Files\Storage\Storage */
	private $originalStorage;

	protected function setUp() {
		parent::setUp();

		\OC_Hook::clear('OC_Filesystem', 'setup');
		\OCP\Util::connectHook('OC_Filesystem', 'post_initMountPoints', '\OCA\Files_Sharing\MountManager', 'setup');
		\OCP\Share::registerBackend('file', 'OC_Share_Backend_File');
		\OCP\Share::registerBackend('folder', 'OC_Share_Backend_Folder', 'file');

		$this->datadir = \OC_Config::getValue('datadirectory');
		$this->tmpDir = \OC_Helper::tmpFolder();
		\OC_Config::setValue('datadirectory', $this->tmpDir);
		$this->uid = \OC_User::getUser();
		\OC_User::setUserId(null);

		$this->userBackend = new \OC_User_Dummy();
		\OC_User::useBackend($this->userBackend);
		$this->originalStorage = \OC\Files\Filesystem::getStorage('/');
		\OC_Util::tearDownFS();
	}

	protected function tearDown() {
		\OC_Config::setValue('datadirectory', $this->datadir);
		\OC_User::setUserId($this->uid);
		\OC_Util::setupFS($this->uid);
		\OC\Files\Filesystem::mount($this->originalStorage, array(), '/');

		parent::tearDown();
	}

	public function testNewUser() {
		$user1 = $this->getUniqueID('user_');
		$this->userBackend->createUser($user1, '');

		\OC_Util::tearDownFS();
		\OC_User::setUserId($user1);
		\OC_Util::setupFS($user1);
		Filesystem::mkdir('/folder');
		Filesystem::mkdir('/folder/subfolder');
		Filesystem::file_put_contents('/foo.txt', 'asd');
		Filesystem::file_put_contents('/folder/bar.txt', 'fgh');
		Filesystem::file_put_contents('/folder/subfolder/qwerty.txt', 'jkl');

		$files = array('/foo.txt', '/folder/bar.txt', '/folder/subfolder', '/folder/subfolder/qwerty.txt');
		$originalEtags = $this->getEtags($files);

		$scanner = new \OC\Files\Utils\Scanner($user1, \OC::$server->getDatabaseConnection());
		$scanner->backgroundScan('/');

		$newEtags = $this->getEtags($files);
		// loop over array and use assertSame over assertEquals to prevent false positives
		foreach ($originalEtags as $file => $originalEtag) {
			$this->assertSame($originalEtag, $newEtags[$file]);
		}
	}

	/**
	 * @param string[] $files
	 */
	private function getEtags($files) {
		$etags = array();
		foreach ($files as $file) {
			$info = Filesystem::getFileInfo($file);
			$etags[$file] = $info['etag'];
		}
		return $etags;
	}
}
