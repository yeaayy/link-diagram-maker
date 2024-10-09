<?php
require_once __DIR__ . '/../common/session.php';
require_method_get();
require_user();

$s = use_db()->prepare('SELECT id, path, name FROM `images` WHERE owner = :user_id');
$s->execute([
  'user_id' => $user_id,
]);

echo json_encode([
  'success' => true,
  'result' => $s->fetchAll(),
]);
