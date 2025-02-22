<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
require_user();

$data = validate_request([
  'id' => [required(), vis_string()],
  'username' => [required(), vis_string()],
]);

if (vis_hex()($data['id'])['error']) {
  not_found('Board not found');
}

$db = use_db();
$s = $db->prepare(
  'DELETE FROM `access` AS a
  WHERE
    a.user_id IN (SELECT id FROM `users` AS u WHERE u.username = :username) AND
    a.board_id IN (SELECT id FROM `boards` AS b WHERE b.uid = :uid AND b.owner = :owner)'
);
$s->execute([
  'uid' => hex2bin($data['id']),
  'owner' => $user_id,
  'username' => $data['username'],
]);

json_result([
  'success' => $s->rowCount() == 1,
]);
