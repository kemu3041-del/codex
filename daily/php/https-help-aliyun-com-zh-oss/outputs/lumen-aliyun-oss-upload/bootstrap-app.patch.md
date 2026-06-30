# bootstrap/app.php 需要加入的配置

在已有 Lumen 项目的 `bootstrap/app.php` 中加入：

```php
$app->configure('oss');
$app->register(App\Providers\OssServiceProvider::class);
```

如果项目尚未启用 Facades 或 Eloquent，这套代码不依赖它们。接口参数校验使用 Lumen Controller 的 `$this->validate()`。
