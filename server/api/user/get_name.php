<?php
require_once __DIR__ . '/../../common/session.php';
require_method_get();

json_result([
  'name' => $_SESSION['name'] ?? null,
]);
