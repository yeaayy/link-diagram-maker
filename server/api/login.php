<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();

if (key_exists('user_id', $_SESSION)) {
  json_result([
    'success' => true,
  ]);
}

$data = validate_request([
  'auth' => [required(), vis_string()],
  'password' => [required(), vis_string()],
]);
$auth = $data['auth'];
$password = $data['password'];

function incorrect() {
  json_result([
    'error' => [
      'password' => 'Unknown user or incorrect password',
    ],
  ], 403);
}

$s = use_db()->prepare(
  'SELECT `id`, `name`, `username`, `password`, `email_login`
  FROM `users`
  WHERE `username` = :auth
  UNION SELECT u.`id`, `name`, `username`, `password`, `email_login`
  FROM `emails` AS e
  JOIN `users` as u ON e.`user_id` = u.`id` AND u.`email_login` = TRUE
  WHERE `email` = :auth AND u.email_login = 1'
);
$s->execute([
  'auth' => $auth,
]);
$row = $s->fetch();
if (!$row) {
  incorrect();
}

if (!password_verify($password, $row['password'])) {
  incorrect();
}

$_SESSION['user_id'] = $row['id'];
$_SESSION['name'] = $row['name'];
$_SESSION['username'] = $row['username'];
$_SESSION['email_login'] = $row['email_login'];

json_result([
  'success' => true,
]);
