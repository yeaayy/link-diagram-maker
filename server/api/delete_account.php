<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'password' => [required(), vis_string()],
]);

$s = use_db()->prepare('SELECT `password` FROM `users` WHERE id = :user_id');
$s->execute([
  'user_id' => $user_id,
]);
$password_hash = $s->fetch()['password'];
if (!password_verify($input['password'], $password_hash)) {
  json_result([
    'success' => false,
    'error' => [
      'password' => 'Password incorrect.',
    ],
  ], 403);
}

$token = generate_random(8);
$_SESSION['confirm'] = $token;

json_result([
  'success' => true,
  'token' => $token,
]);
