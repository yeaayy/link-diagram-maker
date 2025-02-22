<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
require_user();

$data = validate_request([
  'id' => [required(), vis_string()],
  'q' => [required(), vis_string()],
]);

if (vis_hex()($data['id'])['error']) {
  not_found('Board not found');
}

$db = use_db();
$s = $db->prepare(
  'SELECT u.name, u.username
  FROM `boards` AS b
  JOIN `users` AS u ON u.id != b.owner
  LEFT JOIN `emails` AS e ON e.user_id = u.id
  WHERE
    b.uid = :uid AND
    b.owner = :user AND
    u.id NOT IN (SELECT a.user_id FROM `access` AS a WHERE a.board_id = b.id) AND
    (u.username LIKE :q OR e.email = :email)
  GROUP BY u.id
  LIMIT 3'
);
$s->execute([
  'uid' => hex2bin($data['id']),
  'user' => $user_id,
  'q' => "%$data[q]%",
  'email' => $data['q'],
]);

$result = [];
while ($row = $s->fetch()) {
  array_push($result, $row);
}

json_result([
  'success' => true,
  'result' => $result,
]);
