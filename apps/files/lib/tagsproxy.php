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

namespace OCA\Files;

/**
 * Proxy that populates tags when needed
 */
class TagsProxy extends \OC_FileProxy {

	private static $tagManager;

	public function __construct(\OCP\ITags $tagger) {
		$this->tagManager = $tagger;
	}

	/**
	 * Fills the FileInfo from the result with tags info
	 *
	 * @param string $path
	 * @param array $results
	 * @return array updated results
	 */
	public function postGetDirectoryContents($path, $results) {
		foreach ($results as &$result) {
			// only populate if it was never populated before
			if (!isset($result['tags'])) {
				// FIXME: horribly unefficient, maybe bundle a few ids together
				$tags = $this->tagManager->getTagsForObjects((int)$result->getId());
				if (!empty($tags)) {
					$result['tags'] = array_map(
						function ($tagEntry) {
							return $tagEntry['tag'];
						},
						$tags
					);
				}
			}
		}
		return $results;
	}
}
