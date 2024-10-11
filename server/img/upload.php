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

$db = use_db();
$hash = hash('sha256', file_get_contents($_FILES['image']['tmp_name']), true);

// Check if this file already been uploaded
$s = $db->prepare('SELECT `id`, `path`, `ext`, `name` FROM `images` WHERE `owner` = :user_id AND `hash` = :hash');
$s->execute([
  'user_id' => $user_id,
  'hash' => $hash,
]);
if ($row = $s->fetch()) {
  echo json_encode([
    'id' => $row['id'],
    'path' => $row['path'] . '.' . $row['ext'],
    'name' => $row['name'],
  ]);
  exit;
}

$result = upload_file('image');
$filename = pathinfo($result['path'], PATHINFO_FILENAME);
$ext = pathinfo($result['path'], PATHINFO_EXTENSION);

$s = $db->prepare('INSERT INTO `images`(`owner`, `path`, `ext`, `name`, `hash`) VALUES(:user_id, :path, :ext, :name, :hash)');
$s->execute([
  'user_id' => $user_id,
  'path' => $filename,
  'ext' => $ext,
  'name' => $result['name'],
  'hash' => $hash,
]);

echo json_encode([
  'id' => $db->lastInsertId(),
  'path' => $result['path'],
  'name' => $result['name'],
]);
