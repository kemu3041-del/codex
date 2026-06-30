<?php

namespace App\Providers;

use App\Services\AliyunOssService;
use Illuminate\Support\ServiceProvider;

class OssServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(AliyunOssService::class, function () {
            return new AliyunOssService(config('oss'));
        });
    }
}
