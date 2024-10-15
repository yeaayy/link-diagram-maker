<?php
require_once __DIR__ . '/../../common/session.php';
require_method_get();

$data = validate_request([
  'id' => [required(), vis_string(), vis_hex()],
]);

$db = use_db();
$s = $db->prepare('SELECT id, owner, name FROM `boards` AS b WHERE b.uid = :uid');
$s->execute([
  'uid' => hex2bin($data['id']),
]);

$row = $s->fetch();
if (empty($row)) {
  http_response_code(404);
  echo json_encode([
    'error' => 'Board not found',
  ]);
  exit;
}

$name = $row['name'];
$board_owner = $row['owner'];
$board_id = $row['id'];

$s = $db->prepare('SELECT n.note_id, n.x, n.y, n.text, n.image_id, i.path, i.ext FROM `notes` AS n LEFT JOIN `images` AS i ON n.image_id = i.id WHERE n.board_id = :board_id');
$s->execute([
  'board_id' => $board_id,
]);
$notes = [];
while ($row = $s->fetch()) {
  $img = null;
  if (!empty($row['image_id'])) {
    // $img = [
    //   'id' => $row['image_id'],
    //   'path' => $row['path'] . '.' . $row['ext'],
    // ];
    $img = $row['path'] . '.' . $row['ext'];
  }
  array_push($notes, [
    'id' => $row['note_id'],
    'x' => $row['x'],
    'y' => $row['y'],
    'text' => $row['text'],
    'img' => $img,
  ]);
}

$s = $db->prepare('SELECT id, note_1, note_2, pos_1, pos_2, color, size FROM `connections` WHERE board_id = :board_id');
$s->execute([
  'board_id' => $board_id,
]);
$conns = [];
while ($row = $s->fetch()) {
  array_push($conns, [
    'note_1' => $row['note_1'],
    'note_2' => $row['note_2'],
    'pos_1' => $row['pos_1'],
    'pos_2' => $row['pos_2'],
    'color' => bin2hex($row['color']),
    'size' => $row['size'],
  ]);
}

$editable = false;
if (key_exists('user_id', $_SESSION)) {
  $editable = $board_owner == $_SESSION['user_id'];
}

echo json_encode([
  'name' => $name,
  'editable' => $editable,
  'notes' => $notes,
  'conns' => $conns,
]);
