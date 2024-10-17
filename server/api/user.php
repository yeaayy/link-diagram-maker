<?php
require_once __DIR__ . '/../common/session.php';
require_method_get();

if (key_exists('user_id', $_SESSION)
  && key_exists('name', $_SESSION)
  && key_exists('email', $_SESSION)) {
  echo json_encode([
    'user' => [
      'name' => $_SESSION['name'],
    ],
  ]);
  exit;
}

echo json_encode([
  'user' => null,
]);
