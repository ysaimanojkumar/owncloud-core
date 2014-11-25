<?php
/**
 * Copyright (c) 2014 Vincent Petry <pvince81@owncloud.com>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Files\Service;

/**
 * Service class to manage tags on files.
 */
class TagService {

	private $tagger;
	private $userFilesView;

	public function __construct(\OCP\ITags $tagger, \OC\Files\View $userFilesView) {
		$this->tagger = $tagger;
		$this->userFilesView = $userFilesView;
	}

	/**
	 * Updates the tags of the specified file path.
	 * The passed tags are absolute, which means they will
	 * replace the actual tag selection.
	 *
	 * @param string $path path
	 * @param array  $tags array of tags
	 */
	public function updateFileTags($path, $tags) {
		$fileInfo = $this->userFilesView->getFileInfo($path);
		if (!$fileInfo) {
			throw new \OCP\NotFoundException('File not found \"' . $path . '\"');
		}

		$fileId = $fileInfo->getId();
		$currentTags = $this->tagger->getTagsForObjects($fileId);
		// flatten
		$currentTags = array_map(function($e) { return $e['tag']; }, $currentTags);

		$newTags = array_diff($tags, $currentTags);
		foreach ($newTags as $tag) {
			$this->tagger->tagAs($fileId, $tag);
		}
		$deletedTags = array_diff($currentTags, $tags);
		foreach ($deletedTags as $tag) {
			$this->tagger->unTag($fileId, $tag);
		}
	}
}

