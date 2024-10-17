<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'name' => [required(), vis_string(), min_length(3), max_length(255)],
]);

$s = use_db()->prepare('UPDATE `users` SET name = :name WHERE id = :user_id');
$s->execute([
  'user_id' => $user_id,
  'name' => $input['name'],
]);

$_SESSION['name'] = $input['name'];

echo json_encode([
  'success' => true,
]);
