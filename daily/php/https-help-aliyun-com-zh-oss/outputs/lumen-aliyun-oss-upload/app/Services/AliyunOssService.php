<?php

namespace App\Services;

use OSS\Core\OssException;
use OSS\OssClient;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class AliyunOssService
{
    private $config;
    private $client;

    public function __construct(array $config)
    {
        $this->config = $config;
        $this->client = $this->makeClient($config);
    }

    public function simpleUploadFile(UploadedFile $file, string $objectKey, array $options = []): array
    {
        $size = $this->uploadedFileSize($file);
        $options = $this->mergeUploadOptions($file->getClientMimeType(), $options);
        $result = $this->client->uploadFile($this->bucket(), $objectKey, $file->getRealPath(), $options);

        return $this->objectResult($objectKey, [
            'etag' => $this->extractHeader($result, 'etag'),
            'method' => 'simple_file',
            'size' => $size,
            'content_type' => $file->getClientMimeType(),
        ]);
    }

    public function simpleUploadContent(string $content, string $objectKey, ?string $contentType = null, array $options = []): array
    {
        $options = $this->mergeUploadOptions($contentType, $options);
        $result = $this->client->putObject($this->bucket(), $objectKey, $content, $options);

        return $this->objectResult($objectKey, [
            'etag' => $this->extractHeader($result, 'etag'),
            'method' => 'simple_content',
            'size' => strlen($content),
            'content_type' => $contentType,
        ]);
    }

    public function initMultipartUpload(string $objectKey, ?string $contentType = null, array $options = []): array
    {
        $uploadId = $this->client->initiateMultipartUpload(
            $this->bucket(),
            $objectKey,
            $this->mergeUploadOptions($contentType, $options)
        );

        return [
            'bucket' => $this->bucket(),
            'object_key' => $objectKey,
            'upload_id' => $uploadId,
        ];
    }

    public function uploadMultipartPart(UploadedFile $file, string $objectKey, string $uploadId, int $partNumber): array
    {
        $size = $this->uploadedFileSize($file);
        $options = [
            OssClient::OSS_FILE_UPLOAD => $file->getRealPath(),
            OssClient::OSS_PART_NUM => $partNumber,
            OssClient::OSS_SEEK_TO => 0,
            OssClient::OSS_LENGTH => $size,
        ];

        $etag = $this->client->uploadPart($this->bucket(), $objectKey, $uploadId, $options);

        return [
            'bucket' => $this->bucket(),
            'object_key' => $objectKey,
            'upload_id' => $uploadId,
            'part_number' => $partNumber,
            'etag' => trim((string) $etag, '"'),
            'size' => $size,
        ];
    }

    public function completeMultipartUpload(string $objectKey, string $uploadId, array $parts): array
    {
        usort($parts, static function (array $left, array $right) {
            return (int) $left['part_number'] <=> (int) $right['part_number'];
        });

        $uploadParts = array_map(static function (array $part) {
            return [
                'PartNumber' => (int) $part['part_number'],
                'ETag' => trim((string) $part['etag'], '"'),
            ];
        }, $parts);

        $result = $this->client->completeMultipartUpload(
            $this->bucket(),
            $objectKey,
            $uploadId,
            $uploadParts
        );

        return $this->objectResult($objectKey, [
            'etag' => $this->extractHeader($result, 'etag'),
            'upload_id' => $uploadId,
            'parts' => $uploadParts,
            'method' => 'multipart',
        ]);
    }

    public function abortMultipartUpload(string $objectKey, string $uploadId): array
    {
        $this->client->abortMultipartUpload($this->bucket(), $objectKey, $uploadId);

        return [
            'bucket' => $this->bucket(),
            'object_key' => $objectKey,
            'upload_id' => $uploadId,
            'aborted' => true,
        ];
    }

    public function appendUploadFile(UploadedFile $file, string $objectKey, int $position = 0, array $options = []): array
    {
        $size = $this->uploadedFileSize($file);
        $content = file_get_contents($file->getRealPath());
        if ($content === false) {
            throw new RuntimeException('Cannot read uploaded file.');
        }

        $options = $this->mergeUploadOptions($file->getClientMimeType(), $options);
        $result = $this->client->appendObject($this->bucket(), $objectKey, $content, $position, $options);

        return $this->objectResult($objectKey, [
            'method' => 'append_file',
            'position' => $position,
            'next_position' => $this->nextAppendPosition($result, $position + $size),
            'size' => $size,
            'content_type' => $file->getClientMimeType(),
        ]);
    }

    public function appendUploadContent(string $content, string $objectKey, int $position = 0, ?string $contentType = null, array $options = []): array
    {
        $options = $this->mergeUploadOptions($contentType, $options);
        $result = $this->client->appendObject($this->bucket(), $objectKey, $content, $position, $options);

        return $this->objectResult($objectKey, [
            'method' => 'append_content',
            'position' => $position,
            'next_position' => $this->nextAppendPosition($result, $position + strlen($content)),
            'size' => strlen($content),
            'content_type' => $contentType,
        ]);
    }

    public function objectMeta(string $objectKey): array
    {
        $headers = $this->client->getObjectMeta($this->bucket(), $objectKey);

        return [
            'bucket' => $this->bucket(),
            'object_key' => $objectKey,
            'object_type' => $this->extractHeader($headers, 'x-oss-object-type'),
            'content_length' => (int) ($this->extractHeader($headers, 'content-length') ?? 0),
            'etag' => $this->extractHeader($headers, 'etag'),
            'next_append_position' => $this->extractHeader($headers, 'x-oss-next-append-position'),
            'last_modified' => $this->extractHeader($headers, 'last-modified'),
            'raw_headers' => $headers,
        ];
    }

    public function multipartUploadLocalFile(string $localPath, string $objectKey, int $partSize = 5242880, ?string $contentType = null): array
    {
        if (!is_file($localPath) || !is_readable($localPath)) {
            throw new RuntimeException('Local file is not readable.');
        }

        $upload = $this->initMultipartUpload($objectKey, $contentType);
        $uploadId = $upload['upload_id'];
        $fileSize = filesize($localPath);
        $parts = [];
        $partNumber = 1;

        try {
            for ($offset = 0; $offset < $fileSize; $offset += $partSize) {
                $length = min($partSize, $fileSize - $offset);
                $etag = $this->client->uploadPart($this->bucket(), $objectKey, $uploadId, [
                    OssClient::OSS_FILE_UPLOAD => $localPath,
                    OssClient::OSS_PART_NUM => $partNumber,
                    OssClient::OSS_SEEK_TO => $offset,
                    OssClient::OSS_LENGTH => $length,
                ]);

                $parts[] = [
                    'part_number' => $partNumber,
                    'etag' => trim((string) $etag, '"'),
                ];
                $partNumber++;
            }

            return $this->completeMultipartUpload($objectKey, $uploadId, $parts);
        } catch (OssException $exception) {
            $this->client->abortMultipartUpload($this->bucket(), $objectKey, $uploadId);
            throw $exception;
        }
    }

    private function makeClient(array $config): OssClient
    {
        foreach (['access_key_id', 'access_key_secret', 'endpoint', 'bucket'] as $key) {
            if (empty($config[$key])) {
                throw new RuntimeException("OSS config [{$key}] is required.");
            }
        }

        return new OssClient(
            $config['access_key_id'],
            $config['access_key_secret'],
            $config['endpoint'],
            (bool) ($config['is_cname'] ?? false),
            $config['security_token'] ?? null
        );
    }

    private function bucket(): string
    {
        return $this->config['bucket'];
    }

    private function objectResult(string $objectKey, array $extra = []): array
    {
        return array_merge([
            'bucket' => $this->bucket(),
            'object_key' => $objectKey,
            'url' => $this->objectUrl($objectKey),
        ], $extra);
    }

    private function objectUrl(string $objectKey): ?string
    {
        if (!empty($this->config['public_url'])) {
            return $this->config['public_url'] . '/' . ltrim($objectKey, '/');
        }

        return null;
    }

    private function mergeUploadOptions(?string $contentType, array $options = []): array
    {
        if ($contentType) {
            $options[OssClient::OSS_HEADERS][OssClient::OSS_CONTENT_TYPE] = $contentType;
        }

        return $options;
    }

    private function uploadedFileSize(UploadedFile $file): int
    {
        $size = $file->getSize();
        if ($size !== null) {
            return (int) $size;
        }

        $size = filesize($file->getRealPath());
        if ($size === false) {
            throw new RuntimeException('Cannot read uploaded file size.');
        }

        return (int) $size;
    }

    private function nextAppendPosition($result, int $fallback): int
    {
        $position = $this->extractHeader($result, 'x-oss-next-append-position');

        return $position === null ? $fallback : (int) $position;
    }

    private function extractHeader($result, string $name): ?string
    {
        if (!is_array($result)) {
            return null;
        }

        $name = strtolower($name);
        foreach ($result as $key => $value) {
            if (strtolower((string) $key) === $name) {
                return is_array($value) ? (string) reset($value) : (string) $value;
            }
        }

        if (isset($result['info']['header'])) {
            foreach ((array) $result['info']['header'] as $key => $value) {
                if (strtolower((string) $key) === $name) {
                    return is_array($value) ? (string) reset($value) : (string) $value;
                }
            }
        }

        return null;
    }
}
