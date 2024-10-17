<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();

$data = validate_request([
  'email' => [required(), vis_string()],
  'password' => [required(), vis_string()],
]);
$email = $data['email'];
$password = $data['password'];

function incorrect() {
  echo json_encode([
    'error' => [
      'password' => 'Email or password incorrect',
    ],
  ]);
  http_response_code(403);
  exit;
}

$s = use_db()->prepare('SELECT id, name, password FROM `users` WHERE email = :email');
$s->execute([
  'email' => $email,
]);
$row = $s->fetch();
if (!$row) {
  incorrect();
}

if ($row['password'] === null || !password_verify($password, $row['password'])) {
  incorrect();
}

$_SESSION['user_id'] = $row['id'];
$_SESSION['name'] = $row['name'];
$_SESSION['email'] = $email;

echo json_encode([
  'success' => true,
  'name' => $row['name'],
]);
