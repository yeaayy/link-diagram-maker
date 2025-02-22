<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
optional_user();

if (!key_exists('CONTENT_TYPE', $_SERVER) || $_SERVER['CONTENT_TYPE'] !== 'application/json') {
  echo json_encode([
    'error' => 'Expecting json input',
  ]);
  exit;
}

$json = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
  json_result([
    'error' => 'Malformed input',
  ], 400);
}

function invalid_format() {
  json_result([
    'error' => 'Invalid input format',
  ], 409);
}

// Validate only.
validate($json, [
  'id' => [required(), vis_string()],
  'conn' => [required()],
  'note' => [required()],
]);

if (vis_hex()($json['id'])['error']) {
  not_found('Board not found');
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
  'INSERT INTO `connections`(`board_id`, `note_1`, `note_2`, `pos_1`, `pos_2`, `color`, `size`, `dash`)
  VALUES (:board_id, :note_1, :note_2, :pos_1, :pos_2, :color, :size, :dash)'
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
  if ($data['x'] !== null && $data['y'] !== null) {
    array_push($to_set, 'x = :x');
    array_push($to_set, 'y = :y');
    $input['x'] = $data['x'];
    $input['y'] = $data['y'];
  }
  if ($data['text'] !== null) {
    array_push($to_set, 'text = :text');
    $input['text'] = $data['text'];
  }
  if ($data['img'] !== null) {
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
  if ($data['color'] !== null) {
    array_push($to_set, 'color = :color');
    $input['color'] = hex2bin($data['color']);
  }
  if ($data['size'] !== null) {
    array_push($to_set, 'size = :size');
    $input['size'] = $data['size'];
  }
  if ($data['dash'] !== null) {
    array_push($to_set, 'dash = :dash');
    $input['dash'] = $data['dash'];
  }
  $edit_conn = $db->prepare('UPDATE `connections` SET ' . join(',', $to_set)
    . ' WHERE board_id = :board_id AND note_1 = :note_1 AND note_2 = :note_2 AND pos_1 = :pos_1 AND pos_2 = :pos_2');
  $edit_conn->execute($input);
}

define('TYPE_CREATE', 0);
define('TYPE_EDIT', 1);
define('TYPE_DELETE', 2);

try {
  $s = $db->prepare('SELECT b.id FROM `boards` AS b LEFT JOIN `access` AS a ON a.board_id = b.id WHERE uid = :uuid AND (owner = :user_id OR public_access = \'rw\' OR a.user_id = :user_id AND a.write_access IS TRUE) LIMIT 1');
  $s->execute([
    'uuid' => hex2bin($board_uuid),
    'user_id' => $user_id,
  ]);
  $row = $s->fetch();
  if (!$row) {
    json_result([
      'error' => 'Board not found',
    ], 404);
  }
  $board_id = $row['id'];

  $db->beginTransaction();
  foreach ($json['note'] as $note) {
    $note = validate($note, [
      'type' => [required(), vis_number()],
      'id' => [required(), vis_number()],
      'x' => [optional(), vis_number()],
      'y' => [optional(), vis_number()],
      'text' => [optional(), vis_string()],
      'img' => [optional(), vis_number()],
    ]);
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
    $conn = validate($conn, [
      'type' => [required(), vis_number()],
      'a' => [required(), vis_number()],
      'b' => [required(), vis_number()],
      'pa' => [required(), vis_number()],
      'pb' => [required(), vis_number()],
      'color' => [optional(), vis_hex(), exact_length(6)],
      'size' => [optional(), vis_number()],
      'dash' => [optional(), vis_string()],
    ]);
    if ($conn['a'] > $conn['b']) {
      invalid_format();
    }
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
          'dash' => $conn['dash'],
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

  // Check if there is dangling connection.
  $check = $db->prepare(
    'SELECT COUNT(id) AS count FROM `connections` AS c
    WHERE (
        NOT EXISTS (SELECT id FROM `notes` AS n WHERE c.board_id = n.board_id AND c.note_1 = n.note_id)
      OR
        NOT EXISTS (SELECT id FROM `notes` AS n WHERE c.board_id = n.board_id AND c.note_2 = n.note_id)
      ) AND c.board_id = :board_id'
  );
  $check->execute([
    'board_id' => $board_id,
  ]);
  if ($check->fetch()['count'] != 0) {
    $db->rollBack();
    json_result([
      'error' => 'Invalid result, rejected',
    ], 409);
  }

  $db->commit();
  echo json_encode([
    'ok' => true,
  ]);
} catch(Exception $e) {
  if ($db->inTransaction()) {
    $db->rollBack();
  }
  json_result([
    'error' => 'Run failed',
  ], 409, false);
  throw $e;
}

