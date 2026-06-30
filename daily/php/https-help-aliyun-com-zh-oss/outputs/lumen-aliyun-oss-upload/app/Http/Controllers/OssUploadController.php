<?php

namespace App\Http\Controllers;

use App\Services\AliyunOssService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OSS\Core\OssException;
use Throwable;

class OssUploadController extends Controller
{
    private $oss;

    public function __construct(AliyunOssService $oss)
    {
        $this->oss = $oss;
    }

    public function simpleUploadFile(Request $request): JsonResponse
    {
        $this->validate($request, [
            'file' => 'required|file',
            'object_key' => 'required|string|max:1024',
        ]);

        return $this->handle(function () use ($request) {
            return $this->oss->simpleUploadFile(
                $request->file('file'),
                $request->input('object_key')
            );
        });
    }

    public function simpleUploadContent(Request $request): JsonResponse
    {
        $this->validate($request, [
            'content' => 'required|string',
            'object_key' => 'required|string|max:1024',
            'content_type' => 'nullable|string|max:255',
        ]);

        return $this->handle(function () use ($request) {
            return $this->oss->simpleUploadContent(
                $request->input('content'),
                $request->input('object_key'),
                $request->input('content_type')
            );
        });
    }

    public function initMultipartUpload(Request $request): JsonResponse
    {
        $this->validate($request, [
            'object_key' => 'required|string|max:1024',
            'content_type' => 'nullable|string|max:255',
        ]);

        return $this->handle(function () use ($request) {
            return $this->oss->initMultipartUpload(
                $request->input('object_key'),
                $request->input('content_type')
            );
        });
    }

    public function uploadMultipartPart(Request $request): JsonResponse
    {
        $this->validate($request, [
            'file' => 'required|file',
            'object_key' => 'required|string|max:1024',
            'upload_id' => 'required|string',
            'part_number' => 'required|integer|min:1|max:10000',
        ]);

        return $this->handle(function () use ($request) {
            return $this->oss->uploadMultipartPart(
                $request->file('file'),
                $request->input('object_key'),
                $request->input('upload_id'),
                (int) $request->input('part_number')
            );
        });
    }

    public function completeMultipartUpload(Request $request): JsonResponse
    {
        $this->validate($request, [
            'object_key' => 'required|string|max:1024',
            'upload_id' => 'required|string',
            'parts' => 'required|array|min:1',
            'parts.*.part_number' => 'required|integer|min:1|max:10000',
            'parts.*.etag' => 'required|string',
        ]);

        return $this->handle(function () use ($request) {
            return $this->oss->completeMultipartUpload(
                $request->input('object_key'),
                $request->input('upload_id'),
                $request->input('parts')
            );
        });
    }

    public function abortMultipartUpload(Request $request): JsonResponse
    {
        $this->validate($request, [
            'object_key' => 'required|string|max:1024',
            'upload_id' => 'required|string',
        ]);

        return $this->handle(function () use ($request) {
            return $this->oss->abortMultipartUpload(
                $request->input('object_key'),
                $request->input('upload_id')
            );
        });
    }

    public function appendUploadFile(Request $request): JsonResponse
    {
        $this->validate($request, [
            'file' => 'required|file',
            'object_key' => 'required|string|max:1024',
            'position' => 'nullable|integer|min:0',
        ]);

        return $this->handle(function () use ($request) {
            return $this->oss->appendUploadFile(
                $request->file('file'),
                $request->input('object_key'),
                (int) $request->input('position', 0)
            );
        });
    }

    public function appendUploadContent(Request $request): JsonResponse
    {
        $this->validate($request, [
            'content' => 'required|string',
            'object_key' => 'required|string|max:1024',
            'position' => 'nullable|integer|min:0',
            'content_type' => 'nullable|string|max:255',
        ]);

        return $this->handle(function () use ($request) {
            return $this->oss->appendUploadContent(
                $request->input('content'),
                $request->input('object_key'),
                (int) $request->input('position', 0),
                $request->input('content_type')
            );
        });
    }

    public function objectMeta(Request $request): JsonResponse
    {
        $this->validate($request, [
            'object_key' => 'required|string|max:1024',
        ]);

        return $this->handle(function () use ($request) {
            return $this->oss->objectMeta($request->query('object_key'));
        });
    }

    private function handle(callable $callback): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $callback(),
            ]);
        } catch (OssException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
                'code' => $exception->getErrorCode(),
            ], 502);
        } catch (Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 500);
        }
    }
}
