<?php
require_once __DIR__ . '/../common/session.php';
require_method_get();
require_user();

$s = use_db()->prepare('SELECT id, path, ext, name, hash FROM `images` WHERE owner = :user_id');
$s->execute([
  'user_id' => $user_id,
]);

$result = [];
while ($row = $s->fetch()) {
  array_push($result, [
    'id' => $row['id'],
    'path' => $row['path'] . '.' . $row['ext'],
    'name' => $row['name'],
    'hash' => bin2hex($row['hash']),
  ]);
}

echo json_encode([
  'success' => true,
  'result' => $result,
]);
