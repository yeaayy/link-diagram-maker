<?php
require_once __DIR__ . '/common/session.php';
require_method_post();

$data = validate_request([
  'username' => [required(), vis_string(), min_length(3)],
  'password' => [required(), vis_string(), min_length(8)],
]);
$username = $data['username'];
$password = $data['password'];

$password = password_hash($password, null);

$s = use_db()->prepare('SELECT id FROM `users` WHERE username = :username');
$s->execute([
  'username' => $username,
]);
if ($s->fetch()) {
  echo json_encode([
    'error' => [
      'username' => 'Username already been used',
    ],
  ]);
  exit();
}

$db = use_db();
$s = $db->prepare('INSERT INTO `users`(username, password) VALUES(:username, :password)');
$s->execute([
  'username' => $username,
  'password' => $password,
]);

$_SESSION['user_id'] = $db->lastInsertId();

echo json_encode([
  'error' => false,
]);
