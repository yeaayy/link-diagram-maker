<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'old_password' => [required(), vis_string()],
  'new_password' => [required(), vis_string(), min_length(8)],
]);

$s = use_db()->prepare('SELECT `password` FROM `users` WHERE id = :user_id');
$s->execute([
  'user_id' => $user_id,
]);
$old_password_hash = $s->fetch()['password'];
if (!password_verify($input['old_password'], $old_password_hash)) {
  json_result([
    'success' => false,
    'error' => [
      'old_password' => 'Password incorrect.',
    ],
  ], 403);
}

$s = use_db()->prepare('UPDATE `users` SET password = :password WHERE id = :user_id');
$s->execute([
  'user_id' => $user_id,
  'password' => password_hash($input['new_password'], null),
]);

json_result([
  'success' => true,
]);
