<?php

/** @var \Laravel\Lumen\Routing\Router $router */

$router->group(['prefix' => 'api/oss'], function () use ($router) {
    $router->post('simple-upload', 'OssUploadController@simpleUploadFile');
    $router->post('simple-upload/content', 'OssUploadController@simpleUploadContent');

    $router->post('multipart/init', 'OssUploadController@initMultipartUpload');
    $router->post('multipart/part', 'OssUploadController@uploadMultipartPart');
    $router->post('multipart/complete', 'OssUploadController@completeMultipartUpload');
    $router->post('multipart/abort', 'OssUploadController@abortMultipartUpload');

    $router->post('append-upload', 'OssUploadController@appendUploadFile');
    $router->post('append-upload/content', 'OssUploadController@appendUploadContent');

    $router->get('object-meta', 'OssUploadController@objectMeta');
});
