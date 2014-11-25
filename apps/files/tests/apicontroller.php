<?php

/**
 * ownCloud
 *
 * @author Vincent Petry
 * @copyright 2014 Vincent Petry <pvince81@owncloud.com>
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
namespace OCA\Files\Tests;

class ApiControllerTest extends \Test\TestCase {

	private $mockRequest;

	protected function setUp() {
		parent::setUp();

		$this->mockRequest = $this->getMock('\OCP\IRequest');
	}

	public function testUpdateFileMetadata() {
		$user1 = $this->getUniqueId('user');
		\OC_User::createUser($user1, 'test');
		\OC_User::setUserId($user1);
		\OC_Util::setupFS($user1);

		$view = new \OC\Files\View('/' . $user1 . '/files');
		$view->mkdir('subdir');
		$view->file_put_contents('subdir/test.txt', 'test contents');

		$fileInfo = $view->getFileInfo('subdir/test.txt');

		$api = new \OCA\Files\Controller\ApiController('files', $this->mockRequest);

		$tagManager = \OC::$server->getTagManager()->load('files');

		// set favorite
		$api->updateFileMetadata('subdir/test.txt', array($tagManager::TAG_FAVORITE));

		$this->assertEquals(array($fileInfo->getId()), $tagManager->getFavorites());

		// remove favorite
		$api->updateFileMetadata('subdir/test.txt', array());
		$this->assertEquals(array(), $tagManager->getFavorites());

		// TODO: non-existing
		$response = $api->updateFileMetadata('subdir/unexist.txt', array($tagManager::TAG_FAVORITE));

		$view->unlink('subdir');

		\OC_User::setUserId('');
		\OC_User::deleteUser($user1);
	}
}

