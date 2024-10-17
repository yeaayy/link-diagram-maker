<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'email' => [required(), vis_string()],
]);

$s = use_db()->prepare('SELECT `email` FROM `users` WHERE id = :user_id');
$s->execute([
  'user_id' => $user_id,
]);

$email = $s->fetch()['email'];
if ($email !== $input['email']) {
  http_response_code(403);
  echo json_encode([
    'success' => false,
    'error' => [
      'email' => 'Email doesn\'t match.',
    ],
  ]);
  exit;
}

$token = generate_random(8);
$_SESSION['confirm'] = $token;

echo json_encode([
  'success' => true,
  'token' => $token,
]);
