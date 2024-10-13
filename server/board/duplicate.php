<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

$input = validate_request([
  'id' => [required(), vis_string(), vis_hex()],
]);
$src_board_uid = hex2bin($input['id']);

$db = use_db();

// Get board name
$s = $db->prepare('SELECT `id`, `name` FROM `boards` WHERE owner = :user_id AND uid = :board_id');
$s->execute([
  'user_id' => $user_id,
  'board_id' => $src_board_uid,
]);
$row = $s->fetch();
if(!$row) {
  echo json_encode([
    'success' => false,
    'msg' => 'Board not found',
  ]);
  http_response_code(404);
  exit;
}
$src_board_id = $row['id'];
$new_board_name = $row['name'] . ' - Copy';

// Insert new board
$s = $db->prepare('INSERT INTO `boards`(`owner`, `uid`, `name`) VALUES(:user_id, UNHEX(REPLACE(UUID(),"-","")), :name)');
$s->execute([
  'user_id' => $user_id,
  'name' => $new_board_name,
]);
$new_board_id = $db->lastInsertId();

// Copy notes
$s = $db->prepare(
  'INSERT INTO `notes`(`board_id`, `note_id`, `x`, `y`, `image_id`, `text`)
  SELECT :new_board_id, `note_id`, `x`, `y`, `image_id`, `text` FROM `notes` WHERE board_id = :src_board_id'
);
$s->execute([
  'src_board_id' => $src_board_id,
  'new_board_id' => $new_board_id,
]);

// Copy connections
$s = $db->prepare(
  'INSERT INTO `connections`(`board_id`, `note_1`, `note_2`, `pos_1`, `pos_2`, `color`, `size`)
  SELECT :new_board_id, `note_1`, `note_2`, `pos_1`, `pos_2`, `color`, `size` FROM `connections` WHERE board_id = :src_board_id'
);
$s->execute([
  'src_board_id' => $src_board_id,
  'new_board_id' => $new_board_id,
]);

// Get Board unique id
$s = $db->prepare('SELECT `uid` FROM `boards` WHERE id = :id');
$s->execute([
  'id' => $new_board_id,
]);
$new_board_uid = bin2hex($s->fetch()['uid']);

echo json_encode([
  'success' => true,
  'id' =>  $new_board_uid,
  'name' => $new_board_name,
]);
