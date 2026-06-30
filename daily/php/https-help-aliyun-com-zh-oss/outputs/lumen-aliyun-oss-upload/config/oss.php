<?php

return [
    'access_key_id' => env('ALIYUN_OSS_ACCESS_KEY_ID'),
    'access_key_secret' => env('ALIYUN_OSS_ACCESS_KEY_SECRET'),
    'endpoint' => env('ALIYUN_OSS_ENDPOINT'),
    'bucket' => env('ALIYUN_OSS_BUCKET'),
    'is_cname' => filter_var(env('ALIYUN_OSS_IS_CNAME', false), FILTER_VALIDATE_BOOLEAN),
    'security_token' => env('ALIYUN_OSS_SECURITY_TOKEN') ?: null,
    'public_url' => rtrim(env('ALIYUN_OSS_PUBLIC_URL', ''), '/'),
];
