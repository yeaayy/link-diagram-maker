<?php
require_once __DIR__ . '/../common/session.php';
require_method_get();

if (key_exists('user_id', $_SESSION)) {
  $s = use_db()->prepare('SELECT username FROM  `users` WHERE id = :user_id');
  $s->execute([
    'user_id' => $_SESSION['user_id'],
  ]);
  if ($row = $s->fetch()) {
    echo json_encode([
      'username' => $row['username'],
    ]);
    exit;
  }
}

echo json_encode([
  'username' => null,
]);
