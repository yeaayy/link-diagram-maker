<?php
require_once __DIR__ . '/../../common/session.php';
require_method_get();
require_user();

$s = use_db()->prepare(
  'SELECT `name`, `uid`, NULL AS owner, NULL AS write_access FROM `boards` WHERE owner = :user_id
  UNION
  SELECT b.name, b.uid, u.name AS owner, a.write_access
  FROM `access` AS a
  JOIN `boards` AS b ON a.board_id = b.id
  JOIN `users` AS u ON b.owner = u.id
  WHERE a.user_id = :user_id'
);
$s->execute([
  'user_id' => $user_id,
]);

$result = [];
while ($row = $s->fetch()) {
  $write_access = $row['write_access'];
  array_push($result, [
    'name' => $row['name'],
    'id' => bin2hex($row['uid']),
    'owner' => $row['owner'],
    'write_access' => $write_access === null ? null : ($write_access == 1),
  ]);
}

echo json_encode([
  'success' => true,
  'result' => $result,
]);
