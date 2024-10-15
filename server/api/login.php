<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();

$data = validate_request([
  'username' => [required(), vis_string()],
  'password' => [required(), vis_string()],
]);
$username = $data['username'];
$password = $data['password'];

function incorrect() {
  echo json_encode([
    'error' => [
      'password' => 'Username or password incorrect',
    ],
  ]);
  http_response_code(403);
  exit;
}

$s = use_db()->prepare('SELECT id, password FROM `users` WHERE username = :username');
$s->execute([
  'username' => $username,
]);
$row = $s->fetch();
if (!$row) {
  incorrect();
}

if (!password_verify($password, $row['password'])) {
  incorrect();
}

$_SESSION['user_id'] = $row['id'];

echo json_encode([
  'success' => true,
]);
