<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

if (!has_file('image')) {
  echo json_encode([
    'error' => 'No image provided',
  ]);
  http_response_code(400);
  exit;
}

$result = upload_file('image');
$db = use_db();
$s = $db->prepare('INSERT INTO `images`(`owner`, `path`, `name`) VALUES(:user_id, :path, :name)');
$s->execute([
  'user_id' => $user_id,
  'path' => $result['path'],
  'name' => $result['name'],
]);

$result['id'] = $db->lastInsertId();
echo json_encode($result);
