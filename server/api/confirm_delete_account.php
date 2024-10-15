<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'token' => [required(), vis_string()],
]);

if (!key_exists('confirm', $_SESSION)) {
  http_response_code(403);
  echo json_encode([
    'success' => false,
    'error' => [
      'token' => 'Password must be confirmed first.',
    ],
  ]);
  exit;
}

if ($_SESSION['confirm'] !== $input['token']) {
  echo json_encode([
    'success' => false,
    'error' => [
      'token' => 'Confirmation token doesn\'t match.',
    ],
  ]);
  exit;
}

// Delete all images owned by this user.
$s = use_db()->prepare('SELECT path, ext FROM `images` WHERE owner = :user_id');
$s->execute([
  'user_id' => $user_id,
]);
while ($row = $s->fetch()) {
  delete_file($row['path'] . '.' . $row['ext']);
}

// Delete the user.
$s = use_db()->prepare('DELETE FROM `users` WHERE id = :user_id');
$s->execute([
  'user_id' => $user_id,
]);

// Delete session.
session_destroy();

echo json_encode([
  'success' => true,
]);
