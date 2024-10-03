<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

if (!key_exists('CONTENT_TYPE', $_SERVER) || $_SERVER['CONTENT_TYPE'] !== 'application/json') {
  echo json_encode([
    'error' => 'Expecting json input',
  ]);
  exit;
}

$json = json_decode(file_get_contents('php://input'));
if (json_last_error() !== JSON_ERROR_NONE) {
  http_response_code(400);
  echo json_encode([
    'error' => 'Malformed input',
  ]);
  exit;
}

