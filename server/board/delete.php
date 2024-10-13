<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'id' => [required(), vis_string(), vis_hex()],
]);

$db = use_db();
$s = $db->prepare('DELETE FROM `boards` WHERE owner = :user_id AND uid = :board_id');
$s->execute([
  'user_id' => $user_id,
  'board_id' => hex2bin($input['id']),
]);

echo json_encode([
  'success' => $s->rowCount() == 1,
]);
