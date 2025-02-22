<?php
require_once __DIR__ . '/../../common/session.php';
require_method_get();
require_user();

$data = validate_request([
  'id' => [required(), vis_string()],
]);

if (vis_hex()($data['id'])['error']) {
  not_found('Board not found');
}

$db = use_db();
$s = $db->prepare(
  'SELECT public_access, u.name, username, write_access
  FROM `boards` AS b
  LEFT JOIN `access` AS a ON a.board_id = b.id
  LEFT JOIN `users` AS u ON a.user_id = u.id
  WHERE b.uid = :uid AND owner = :user'
);
$s->execute([
  'uid' => hex2bin($data['id']),
  'user' => $user_id,
]);

$others = [];
while ($row = $s->fetch()) {
  if ($row['name']) {
    array_push($others, [
      'name' => $row['name'],
      'username' => $row['username'],
      'write' => $row['write_access'] == 1,
    ]);
  }
  if (!isset($public)) {
    $public = $row['public_access'];
  }
}

if (!isset($public)) {
  not_found('Board not found');
}

json_result([
  'public' => $public,
  'others' => $others,
]);
