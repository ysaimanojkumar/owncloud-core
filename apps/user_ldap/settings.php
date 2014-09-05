<?php

/**
 * ownCloud - user_ldap
 *
 * @author Dominik Schmidt
 * @author Arthur Schiwon
 * @copyright 2011 Dominik Schmidt dev@dominik-schmidt.de
 * @copyright 2012-2013 Arthur Schiwon blizzz@owncloud.com
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

use \OCA\user_ldap\lib\Access;
use \OCA\user_ldap\lib\LDAP;
use \OCA\UserLdap\GarbageCollector;
use \OCA\user_ldap\lib\Connection;

OC_Util::checkAdminUser();

OCP\Util::addScript('user_ldap', 'ldapFilter');
OCP\Util::addScript('user_ldap', 'settings');
OCP\Util::addScript('user_ldap', 'deletedUsers');
OCP\Util::addScript('core', 'jquery.multiselect');
OCP\Util::addStyle('user_ldap', 'settings');
OCP\Util::addStyle('core', 'jquery.multiselect');
OCP\Util::addStyle('core', 'jquery-ui-1.10.0.custom');

// fill template
$tmpl = new OCP\Template('user_ldap', 'settings');

$helper = new \OCA\user_ldap\lib\Helper();
$prefixes = $helper->getServerConfigurationPrefixes();
$hosts = $helper->getServerConfigurationHosts();

$wizardHtml = '';
$toc = array();

$wControls = new OCP\Template('user_ldap', 'part.wizardcontrols');
$wControls = $wControls->fetchPage();
$sControls = new OCP\Template('user_ldap', 'part.settingcontrols');
$sControls = $sControls->fetchPage();

$l = \OC::$server->getL10N('user_ldap');

$wizTabs = array();
$wizTabs[] = array('tpl' => 'part.wizard-server',      'cap' => $l->t('Server'));
$wizTabs[] = array('tpl' => 'part.wizard-userfilter',  'cap' => $l->t('User Filter'));
$wizTabs[] = array('tpl' => 'part.wizard-loginfilter', 'cap' => $l->t('Login Filter'));
$wizTabs[] = array('tpl' => 'part.wizard-groupfilter', 'cap' => $l->t('Group Filter'));

for($i = 0; $i < count($wizTabs); $i++) {
	$tab = new OCP\Template('user_ldap', $wizTabs[$i]['tpl']);
	if($i === 0) {
		$tab->assign('serverConfigurationPrefixes', $prefixes);
		$tab->assign('serverConfigurationHosts', $hosts);
	}
	$tab->assign('wizardControls', $wControls);
	$wizardHtml .= $tab->fetchPage();
	$toc['#ldapWizard'.($i+1)] = $wizTabs[$i]['cap'];
}

$tab = new OCP\Template('user_ldap', 'part.maintenance');
$maintenanceHtml = $tab->fetchPage();

$tmpl->assign('tabs', $wizardHtml);
$tmpl->assign('toc', $toc);
$tmpl->assign('maintenance', $maintenanceHtml);
$tmpl->assign('settingControls', $sControls);

// assign default values
$config = new \OCA\user_ldap\lib\Configuration('', false);
$defaults = $config->getDefaults();
foreach($defaults as $key => $default) {
	$tmpl->assign($key.'_default', $default);
}

$db = \OC::$server->getDatabaseConnection();
$pref = new \OC\Preferences(\OC_DB::getConnection());
$ldap = new LDAP();
$dummyConnection = new Connection($ldap, '', null);
$userManager = new OCA\user_ldap\lib\user\Manager(
	\OC::$server->getConfig(),
	new \OCA\user_ldap\lib\FilesystemHelper(),
	new \OCA\user_ldap\lib\LogWrapper(),
	\OC::$server->getAvatarManager(),
	new \OCP\Image()
);
$access = new Access($dummyConnection, $ldap, $userManager);
$gc = new GarbageCollector($pref, $db, $access);
$tmpl->assign('hasDeletedUsers', $gc->hasDeletedUsers());

return $tmpl->fetchPage();
