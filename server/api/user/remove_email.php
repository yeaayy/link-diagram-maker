<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
require_user();

$data = validate_request([
  'email' => [required(), vis_string()],
]);

$s = use_db()->prepare('DELETE FROM `emails` WHERE email = :email AND user_id = :user_id');
$s->execute([
  'email' => $data['email'],
  'user_id' => $user_id,
]);

json_result([
  'success' => $s->rowCount() === 1,
]);
