<?php
/**
 * ownCloud - External Storage Routes
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
namespace OCA\Files_External\AppInfo;

/** @var $this OC\Route\Router */
$application = new Application();

$application->registerRoutes($this, array('routes' => array(
	array('name' => 'config#addMountPoint', 'url' => '/storages', 'verb' => 'POST'),
	array('name' => 'config#updateMountPoint', 'url' => '/storages', 'verb' => 'PUT'),
	array('name' => 'config#removeMountPoint', 'url' => '/storages/{id}', 'verb' => 'DELETE'),
	array('name' => 'config#addRootCertificate', 'url' => '/rootcerts', 'verb' => 'POST'),
	array('name' => 'config#removeRootCertificate', 'url' => '/rootcerts/{id}', 'verb' => 'DELETE'),
	array('name' => 'config#listApplicable', 'url' => '/applicable', 'verb' => 'GET'),
	// TODO: these routes should be registered by the storage classes themselves
	array('name' => 'config#dropboxCallback', 'url' => '/callbacks/dropbox/{id}', 'verb' => 'POST'),
	array('name' => 'config#googleCallback', 'url' => '/callbacks/google/{id}', 'verb' => 'POST'),
)));

// TODO: move to app framework
\OC_API::register('get',
		'/apps/files_external/api/v1/mounts',
		array('\OCA\Files\External\Api', 'getUserMounts'),
		'files_external');

