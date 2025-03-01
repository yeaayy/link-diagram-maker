<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();

if (!key_exists('email', $_SESSION) || key_exists('user_id', $_SESSION)) {
  json_result([], 403);
}

$email = $_SESSION['email'];
$data = validate_request([
  'name' => [required()],
  'username' => [required(), min_length(3), max_length(40)],
  'password' => [required()],
]);

$db = use_db();
$s = $db->prepare('INSERT INTO `users` (`username`, `name`, `password`) VALUES (:username, :name, :password)');
try {
  $s->execute([
    'name' => $data['name'],
    'username' => $data['username'],
    'password' => password_hash($data['password'], null),
  ]);
} catch (PDOException $e) {
  json_result([
    'error' => [
      'username' => 'Username not available',
    ]
  ], 400);
}

$user_id = $db->lastInsertId();

$s = $db->prepare('INSERT INTO `emails`(`user_id`, `email`, `verified_at`) VALUES (:user_id, :email, NOW())');
$s->execute([
  'user_id' => $user_id,
  'email' => $email,
]);

$_SESSION['user_id'] = $user_id;
$_SESSION['name'] = $data['name'];
$_SESSION['username'] = $data['username'];
$_SESSION['email_login'] = true;

json_result([
  'success' => true,
]);
