<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'name' => [required(), vis_string()],
  'id' => [required(), vis_string()],
]);

$s = use_db()->prepare('UPDATE `boards` SET name = :name WHERE uid = :board_id AND owner = :user_id');
$s->execute([
  'name' => $input['name'],
  'board_id' => hex2bin($input['id']),
  'user_id' => $user_id,
]);

if ($s->rowCount() === 0) {
  $s->debugDumpParams();
  echo json_encode([
    'error' => 'Board not found',
    'board_id' => $input['id'],
    'user_id' => $user_id,
  ]);
  http_response_code(404);
} else {
  echo json_encode([
    'error' => false,
  ]);
}
