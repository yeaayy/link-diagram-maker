<?php
require_once __DIR__ . '/../common/session.php';
require_method_get();
require_user();

$s = use_db()->prepare('SELECT `name`, `uid` FROM `boards` WHERE owner = :user_id');
$s->execute([
  'user_id' => $user_id,
]);

$result = [];
while ($row = $s->fetch()) {
  array_push($result, [
    'name' => $row['name'],
    'id' => bin2hex($row['uid']),
  ]);
}

echo json_encode([
  'success' => true,
  'result' => $result,
]);
