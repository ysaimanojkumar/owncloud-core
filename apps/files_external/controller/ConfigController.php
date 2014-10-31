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

namespace OCA\Files_External\Controller;


use \OCP\IConfig;
use \OCP\IRequest;
use \OCP\AppFramework\Http\TemplateResponse;
use \OCP\AppFramework\Controller;

class ConfigController extends Controller {

	private $userId;
	private $config;

    public function __construct($appName, IRequest $request, IConfig $config, $userId){
        parent::__construct($appName, $request);
		$this->userId = $userId;
		$this->config = $config;
    }
}

