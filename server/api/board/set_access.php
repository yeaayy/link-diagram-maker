<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
require_user();

$data = validate_request([
  'id' => [required(), vis_string()],
  'username' => [required(), vis_string()],
  'write' => [required()],
]);

if (vis_hex()($data['id'])['error']) {
  not_found('Board not found');
}

$db = use_db();
$s = $db->prepare(
  'REPLACE INTO `access`(`user_id`, `board_id`, `write_access`)
  SELECT u.id, b.id, :write
  FROM `users` AS u, `boards` AS b
  WHERE
    u.username = :username AND
    b.uid = :uid AND
    b.owner = :owner
  LIMIT 1'
);
$s->bindValue('uid', hex2bin($data['id']));
$s->bindValue('owner', $user_id);
$s->bindValue('username', $data['username']);
$s->bindValue('write', $data['write'], PDO::PARAM_BOOL);
$s->execute();

json_result([
  'success' => $s->rowCount() == 1,
]);
