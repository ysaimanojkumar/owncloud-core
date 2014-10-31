<?php
/**
 * ownCloud - files_external
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Vincent Petry <pvince81@owncloud.com>
 * @copyright Vincent Petry 2014
 */

namespace OCA\Files_External\AppInfo;


use \OCP\AppFramework\App;
use \OCP\IContainer;

use \OCA\External\Controller\PageController;


class Application extends App {


	public function __construct (array $urlParams=array()) {
		parent::__construct('files_external', $urlParams);

		$container = $this->getContainer();

		/**
		 * Controllers
		 */
		$container->registerService('ConfigController', function(IContainer $c) {
			return new ConfigController(
				$c->query('AppName'), 
				$c->query('Request'),
				$c->query('Config'),
				$c->query('UserId')
			);
		});

		$container->registerService('Config', function(IContainer $c) {
			return $c->getServer()->getConfig();
		});

		/**
		 * Core
		 */
		$container->registerService('UserId', function(IContainer $c) {
			return \OCP\User::getUser();
		});		
		
	}


}

