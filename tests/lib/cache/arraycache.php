<?php
/**
 * Copyright (c) 2014 Andreas Fischer <bantu@owncloud.com>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace Test\Cache;

class ArrayCache extends \Test_Cache {
	public function setUp() {
		$this->instance = new \OC\Cache\ArrayCache();
	}
}
