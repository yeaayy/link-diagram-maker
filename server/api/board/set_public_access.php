<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
require_user();

$data = validate_request([
  'id' => [required(), vis_string()],
  'access' => [required(), vis_string(), vin_enum(['no', 'ro', 'rw'])],
]);

if (vis_hex()($data['id'])['error']) {
  not_found('Board not found');
}

$s = use_db()->prepare(
  'UPDATE `boards`
  SET public_access = :access
  WHERE uid = :board_id AND owner = :user_id'
);
$s->execute([
  'board_id' => hex2bin($data['id']),
  'user_id' => $user_id,
  'access' => $data['access'],
]);

json_result([
  'success' => $s->rowCount() == 1,
]);
