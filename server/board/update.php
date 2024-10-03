<?php
require_once __DIR__ . '/../common/session.php';
require_method_post();
require_user();

if (!key_exists('CONTENT_TYPE', $_SERVER) || $_SERVER['CONTENT_TYPE'] !== 'application/json') {
  echo json_encode([
    'error' => 'Expecting json input',
  ]);
  exit;
}

$json = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
  http_response_code(400);
  echo json_encode([
    'error' => 'Malformed input',
  ]);
  exit;
}

$board_uuid = $json['id'];
$db = use_db();
$create_note = $db->prepare(
  'INSERT INTO `notes`(`board_id`, `note_id`, `x`, `y`, `image_id`, `text`)
  VALUES (:board_id, :note_id, :x, :y, :image_id, :text)'
);

$delete_note = $db->prepare(
  'DELETE FROM `notes` WHERE note_id = :note_id AND board_id = :board_id'
);

$create_conn = $db->prepare(
  'INSERT INTO `connections`(`board_id`, `note_1`, `note_2`, `pos_1`, `pos_2`, `color`, `size`)
  VALUES (:board_id, :note_1, :note_2, :pos_1, :pos_2, :color, :size)'
);

$delete_conn = $db->prepare(
  'DELETE FROM `connections` WHERE board_id = :board_id AND note_1 = :note_1 AND note_2 = :note_2 AND pos_1 = :pos_1 AND pos_2 = :pos_2'
);

function edit_note($data) {
  global $db, $board_id, $edit_note;
  $input = [
    'board_id' => $board_id,
    'note_id' => $data['id'],
  ];
  $to_set = [];
  if (key_exists('x', $data) && key_exists('y', $data)) {
    array_push($to_set, 'x = :x');
    array_push($to_set, 'y = :y');
    $input['x'] = $data['x'];
    $input['y'] = $data['y'];
  }
  if (key_exists('text', $data)) {
    array_push($to_set, 'text = :text');
    $input['text'] = $data['text'];
  }
  if (key_exists('img', $data)) {
    array_push($to_set, 'image_id = :image_id');
    $input['image_id'] = $data['img'] == 0 ? null : $data['img'];
  }
  $edit_note = $db->prepare('UPDATE `notes` SET ' . join(',', $to_set) . ' WHERE note_id = :note_id AND board_id = :board_id');
  $edit_note->execute($input);
}

function edit_conn($data) {
  global $db, $board_id, $edit_conn;
  $input = [
    'board_id' => $board_id,
    'note_1' => $data['a'],
    'note_2' => $data['b'],
    'pos_1' => $data['pa'],
    'pos_2' => $data['pb'],
  ];
  $to_set = [];
  if (key_exists('color', $data)) {
    array_push($to_set, 'color = :color');
    $input['color'] = hex2bin($data['color']);
  }
  if (key_exists('size', $data)) {
    array_push($to_set, 'size = :size');
    $input['size'] = $data['size'];
  }
  $edit_conn = $db->prepare('UPDATE `connections` SET ' . join(',', $to_set)
    . ' WHERE board_id = :board_id AND note_1 = :note_1 AND note_2 = :note_2 AND pos_1 = :pos_1 AND pos_2 = :pos_2');
  $edit_conn->execute($input);
}

define('TYPE_CREATE', 0);
define('TYPE_EDIT', 1);
define('TYPE_DELETE', 2);

try {
  $s = $db->prepare('SELECT id FROM `boards` WHERE uid = :uuid AND owner = :user_id');
  $s->execute([
    'uuid' => hex2bin($board_uuid),
    'user_id' => $user_id,
  ]);
  $row = $s->fetch();
  if (!$row) {
    http_response_code(401);
    echo json_encode([
      'error' => 'Edit not allowed',
    ]);
    exit;
  }
  $board_id = $row['id'];

  $db->beginTransaction();
  foreach ($json['note'] as $note) {
    switch ($note['type']) {
      case TYPE_CREATE:
        $create_note->execute([
          'board_id' => $board_id,
          'note_id' => $note['id'],
          'x' => $note['x'],
          'y' => $note['y'],
          'text' => $note['text'],
          'image_id' => $note['img'] == 0 ? null : $note['img'],
        ]);
        break;
      case TYPE_EDIT:
        edit_note($note);
        break;
      case TYPE_DELETE:
        $delete_note->execute([
          'board_id' => $board_id,
          'note_id' => $note['id'],
        ]);
        break;
    }
  }

  foreach ($json['conn'] as $conn) {
    switch ($conn['type']) {
      case TYPE_CREATE:
        $create_conn->execute([
          'board_id' => $board_id,
          'note_1' => $conn['a'],
          'note_2' => $conn['b'],
          'pos_1' => $conn['pa'],
          'pos_2' => $conn['pb'],
          'color' => hex2bin($conn['color']),
          'size' => $conn['size'],
        ]);
        break;
      case TYPE_EDIT:
        edit_conn($conn);
        break;
      case TYPE_DELETE:
        $delete_conn->execute([
          'board_id' => $board_id,
          'note_1' => $conn['a'],
          'note_2' => $conn['b'],
          'pos_1' => $conn['pa'],
          'pos_2' => $conn['pb'],
        ]);
        break;
    }
  }
  $db->commit();
  echo json_encode([
    'ok' => true,
  ]);
} catch(Exception $e) {
  $db->rollBack();
  http_response_code(409);
  echo json_encode([
    'error' => 'Run failed',
  ]);
  throw $e;
}

