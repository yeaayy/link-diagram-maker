<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

session_destroy();

json_result([
  'success' => true,
]);
