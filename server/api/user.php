<?php
require_once __DIR__ . '/../common/session.php';
require_method_get();

if (key_exists('user_id', $_SESSION)) {
  $s = use_db()->prepare('SELECT name, username, email_login FROM  `users` WHERE id = :user_id');
  $s->execute([
    'user_id' => $_SESSION['user_id'],
  ]);
  if ($row = $s->fetch()) {
    $s = use_db()->prepare('SELECT email FROM `emails` WHERE user_id = :user_id');
    $s->execute([
      'user_id' => $_SESSION['user_id'],
    ]);
    $emails = [];
    while ($data = $s->fetch()) {
      array_push($emails, $data['email']);
    }

    echo json_encode([
      'login' => true,
      'name' => $row['name'],
      'username' => $row['username'],
      'email_login' => $row['email_login'],
      'emails' => $emails,
    ]);
    exit;
  }
}

echo json_encode([
  'login' => false,
]);
