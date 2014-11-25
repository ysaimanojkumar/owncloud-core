<?php
/**
 * Copyright (c) 2014 Lukas Reschke <lukas@owncloud.com>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

namespace OCA\Files\Controller;

use OCP\AppFramework\Http;
use OCP\AppFramework\Controller;
use OCP\IRequest;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\DownloadResponse;
use OC\Preview;
use OCA\Files\Service\TagService;

class ApiController extends Controller {

	private $tagService;

	public function __construct($appName, IRequest $request, TagService $tagService){
		parent::__construct($appName, $request);
		$this->tagService = $tagService;
	}


	/**
	 * Gets a thumbnail of the specified file
	 *
	 * @since API version 1.0
	 *
	 * @NoAdminRequired
	 * @NoCSRFRequired
	 *
	 * @param int $x
	 * @param int $y
	 * @param string $file URL-encoded filename
	 * @return JSONResponse|DownloadResponse
	 */
	public function getThumbnail($x, $y, $file) {
		if($x < 1 || $y < 1) {
			return new JSONResponse('Requested size must be numeric and a positive value.', Http::STATUS_BAD_REQUEST);
		}

		try {
			$preview = new Preview('', 'files', urldecode($file), $x, $y, true);
			echo($preview->showPreview('image/png'));
			return new DownloadResponse(urldecode($file).'.png', 'image/png');
		} catch (\Exception $e) {
			return new JSONResponse('File not found.', Http::STATUS_NOT_FOUND);
		}
	}

	/**
	 * Updates the info of the specified file path
	 * The passed tags are absolute, which means they will
	 * replace the actual tag selection.
	 *
	 * @NoAdminRequired
	 *
	 * @param string $path path
	 * @param array  $tags array of tags
	 */
	public function updateFileInfo($path, $tags = null) {
		$result = array();
		// if tags specified or empty array, update tags
		if (!is_null($tags)) {
			try {
				$this->tagService->updateFileTags($path, $tags);
			} catch (\OCP\NotFoundException $e) {
				return new JSONResponse($e->getMessage(), Http::STATUS_NOT_FOUND);
			}
			$result['tags'] = $tags;
		}
		return new JSONResponse($result, Http::STATUS_OK);
	}
}
