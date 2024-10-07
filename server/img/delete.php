<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'img' => [required()],
]);

$db = use_db();
$s = $db->prepare('SELECT path FROM `images` WHERE owner = :user_id and id = :image');
$s->execute([
  'user_id' => $user_id,
  'image' => $input['img'],
]);
$row = $s->fetch();
if (!$row) {
  echo json_encode([
    'error' => true,
    'msg' => 'Image not found',
  ]);
  exit;
}

$s = $db->prepare('DELETE FROM `images` WHERE owner = :user_id and id = :image');
$s->execute([
  'user_id' => $user_id,
  'image' => $input['img'],
]);

delete_file($row['path']);

echo json_encode([
  'error' => false,
]);
