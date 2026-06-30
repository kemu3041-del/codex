# Lumen 阿里云 OSS 上传接口实现

本目录是一套可合并到 Lumen 项目的代码示例，实现：

- 简单上传：文件上传、字符串内容上传
- 分片上传：初始化、上传分片、完成、取消
- 追加上传：文件追加、字符串内容追加
- 对象元信息查询：用于获取追加上传的 `next_append_position`

参考：

- 阿里云 OSS 简单上传文档：<https://help.aliyun.com/zh/oss/user-guide/simple-upload>
- 阿里云 OSS PHP SDK：`aliyuncs/oss-sdk-php`

## 安装

```bash
composer require aliyuncs/oss-sdk-php
```

复制文件到 Lumen 项目：

```text
config/oss.php
app/Providers/OssServiceProvider.php
app/Services/AliyunOssService.php
app/Http/Controllers/OssUploadController.php
routes/web.php 中的路由片段
```

在 `bootstrap/app.php` 注册：

```php
$app->configure('oss');
$app->register(App\Providers\OssServiceProvider::class);
```

`.env` 示例：

```dotenv
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key-id
ALIYUN_OSS_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_OSS_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
ALIYUN_OSS_BUCKET=your-bucket
ALIYUN_OSS_IS_CNAME=false
ALIYUN_OSS_SECURITY_TOKEN=
ALIYUN_OSS_PUBLIC_URL=https://your-cdn-or-bucket-domain
```

## 通用响应

成功：

```json
{
  "success": true,
  "data": {}
}
```

OSS 异常：

```json
{
  "success": false,
  "message": "OSS error message",
  "code": "NoSuchBucket"
}
```

## 接口文档

### 1. 简单上传文件

`POST /api/oss/simple-upload`

`multipart/form-data`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| file | file | 是 | 待上传文件 |
| object_key | string | 是 | OSS 对象名，例如 `uploads/2026/06/a.jpg` |

示例：

```bash
curl -X POST http://localhost/api/oss/simple-upload \
  -F "file=@/path/to/a.jpg" \
  -F "object_key=uploads/a.jpg"
```

响应：

```json
{
  "success": true,
  "data": {
    "bucket": "your-bucket",
    "object_key": "uploads/a.jpg",
    "url": "https://your-cdn-or-bucket-domain/uploads/a.jpg",
    "etag": "D41D8CD98F00B204E9800998ECF8427E",
    "method": "simple_file",
    "size": 1024,
    "content_type": "image/jpeg"
  }
}
```

### 2. 简单上传文本内容

`POST /api/oss/simple-upload/content`

`application/json`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| content | string | 是 | 上传内容 |
| object_key | string | 是 | OSS 对象名 |
| content_type | string | 否 | 内容类型，例如 `text/plain; charset=utf-8` |

请求：

```json
{
  "content": "hello oss",
  "object_key": "texts/hello.txt",
  "content_type": "text/plain; charset=utf-8"
}
```

### 3. 初始化分片上传

`POST /api/oss/multipart/init`

`application/json`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| object_key | string | 是 | OSS 对象名 |
| content_type | string | 否 | 完成后对象的 Content-Type |

响应：

```json
{
  "success": true,
  "data": {
    "bucket": "your-bucket",
    "object_key": "videos/demo.mp4",
    "upload_id": "0004B999EF518A1FE585B0C9360D****"
  }
}
```

### 4. 上传单个分片

`POST /api/oss/multipart/part`

`multipart/form-data`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| file | file | 是 | 当前分片文件 |
| object_key | string | 是 | 与初始化时一致 |
| upload_id | string | 是 | 初始化分片上传返回的 ID |
| part_number | integer | 是 | 分片序号，范围 1-10000 |

响应：

```json
{
  "success": true,
  "data": {
    "bucket": "your-bucket",
    "object_key": "videos/demo.mp4",
    "upload_id": "0004B999EF518A1FE585B0C9360D****",
    "part_number": 1,
    "etag": "3349DC700140D7F86A078484278075A9",
    "size": 5242880
  }
}
```

客户端必须保存每个分片返回的 `part_number` 和 `etag`，完成上传时提交给服务端。

### 5. 完成分片上传

`POST /api/oss/multipart/complete`

`application/json`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| object_key | string | 是 | OSS 对象名 |
| upload_id | string | 是 | 初始化分片上传返回的 ID |
| parts | array | 是 | 已上传分片列表 |
| parts[].part_number | integer | 是 | 分片序号 |
| parts[].etag | string | 是 | 上传分片返回的 ETag |

请求：

```json
{
  "object_key": "videos/demo.mp4",
  "upload_id": "0004B999EF518A1FE585B0C9360D****",
  "parts": [
    { "part_number": 1, "etag": "3349DC700140D7F86A078484278075A9" },
    { "part_number": 2, "etag": "8EFDA8BE206636A695359836FE0A0E0A" }
  ]
}
```

完成接口会按 `part_number` 升序排序后提交 OSS。

### 6. 取消分片上传

`POST /api/oss/multipart/abort`

`application/json`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| object_key | string | 是 | OSS 对象名 |
| upload_id | string | 是 | 初始化分片上传返回的 ID |

响应：

```json
{
  "success": true,
  "data": {
    "bucket": "your-bucket",
    "object_key": "videos/demo.mp4",
    "upload_id": "0004B999EF518A1FE585B0C9360D****",
    "aborted": true
  }
}
```

### 7. 追加上传文件

`POST /api/oss/append-upload`

`multipart/form-data`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| file | file | 是 | 本次追加的文件块 |
| object_key | string | 是 | OSS 对象名 |
| position | integer | 否 | 追加位置。首次为 `0`，后续使用上次返回的 `next_position` |

响应：

```json
{
  "success": true,
  "data": {
    "bucket": "your-bucket",
    "object_key": "logs/app.log",
    "url": "https://your-cdn-or-bucket-domain/logs/app.log",
    "method": "append_file",
    "position": 0,
    "next_position": 128,
    "size": 128,
    "content_type": "text/plain"
  }
}
```

追加上传要点：

- 首次追加 `position=0`。
- 第二次开始必须使用 OSS 返回的 `next_position`。
- 如果 position 不匹配，OSS 会返回位置相关错误。

### 8. 追加上传文本内容

`POST /api/oss/append-upload/content`

`application/json`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| content | string | 是 | 本次追加内容 |
| object_key | string | 是 | OSS 对象名 |
| position | integer | 否 | 追加位置 |
| content_type | string | 否 | 内容类型 |

请求：

```json
{
  "object_key": "logs/app.log",
  "content": "line 1\n",
  "position": 0,
  "content_type": "text/plain; charset=utf-8"
}
```

### 9. 查询对象元信息

`GET /api/oss/object-meta?object_key=logs/app.log`

用于查询对象类型、长度、ETag，以及追加类型对象的 `next_append_position`。

响应：

```json
{
  "success": true,
  "data": {
    "bucket": "your-bucket",
    "object_key": "logs/app.log",
    "object_type": "Appendable",
    "content_length": 128,
    "etag": "D41D8CD98F00B204E9800998ECF8427E",
    "next_append_position": "128",
    "last_modified": "Wed, 24 Jun 2026 10:00:00 GMT",
    "raw_headers": {}
  }
}
```

## 分片上传客户端流程

1. 调用 `/api/oss/multipart/init` 获取 `upload_id`。
2. 前端或调用方把大文件切成多个分片，建议除最后一个分片外每片不小于 100 KB，实际业务通常使用 5 MB 或更大。
3. 每片调用 `/api/oss/multipart/part`，记录响应里的 `part_number` 和 `etag`。
4. 全部分片上传成功后调用 `/api/oss/multipart/complete`。
5. 任意阶段放弃上传时调用 `/api/oss/multipart/abort` 清理未完成分片。

## 生产建议

- 不要让客户端自由传任意 `object_key`，建议服务端按业务 ID、日期、随机名生成。
- 对文件大小、MIME、后缀、用户权限做业务校验。
- AccessKey 建议使用 RAM 用户最小权限，线上优先使用 STS 临时凭证或 ECS RAM Role。
- 如果上传对象需要公网访问，建议通过 CDN 域名或 Bucket 绑定域名生成 `ALIYUN_OSS_PUBLIC_URL`。
- 大文件更推荐前端直传 OSS，这套接口适合后端中转、内网处理、审计或需要服务端控制对象名的场景。
