<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'username' => [required(), vis_string(), min_length(3), max_length(40)],
]);

$s = use_db()->prepare('UPDATE `users` SET username = :username WHERE id = :user_id');
try {
  $s->execute([
    'user_id' => $user_id,
    'username' => $input['username'],
  ]);

  json_result([
    'success' => true,
  ]);
} catch(Exception $e) {
  json_result([
    'success' => false,
    'error' => [
      'username' => 'Username already been used.',
    ],
  ], 409);
}
