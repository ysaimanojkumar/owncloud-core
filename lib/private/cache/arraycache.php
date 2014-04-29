<?php
/**
 * Copyright (c) 2014 Andreas Fischer <bantu@owncloud.com>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OC\Cache;

/**
* Implementation of a volatile cache backed by memory (in form of a simple PHP
* array) for special purposes.
*/
class ArrayCache implements \OCP\ICache {
	/**
	* Array containing key value map of the cache.
	* @var array
	*/
	protected $data = array();

	public function get($key) {
		return isset($this->data[$key]) ? $this->data[$key] : null;
	}

	public function set($key, $value, $ttl = 0) {
		// The $ttl argument is ignored as this is a volatile cache.
		$this->data[$key] = $value;
	}

	public function hasKey($key) {
		return isset($this->data[$key]);
	}

	public function remove($key) {
		unset($this->data[$key]);
		return true;
	}

	public function clear($prefix = '') {
		if ($prefix === '') {
			$this->data = array();
		} else {
			foreach ($this->data as $key => $value) {
				if (strpos($key, $prefix) === 0) {
					$this->remove($key);
				}
			}
		}
		return true;
	}
}
