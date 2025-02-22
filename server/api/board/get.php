<?php
require_once __DIR__ . '/../../common/session.php';
require_method_get();
optional_user();

$data = validate_request([
  'id' => [required(), vis_string()],
]);

if (vis_hex()($data['id'])['error']) {
  not_found('Board not found');
}

$db = use_db();
$s = $db->prepare(
  'SELECT b.id, owner, name, public_access, write_access
  FROM `boards` AS b
  LEFT JOIN `access` AS a ON a.board_id = b.id
  WHERE
    b.uid = :uid AND
    (b.public_access != \'no\' OR owner = :user OR a.user_id = :user)
  LIMIT 1'
);
$s->execute([
  'uid' => hex2bin($data['id']),
  'user' => $user_id,
]);

$row = $s->fetch();
if (empty($row)) {
  not_found('Board not found');
}

$editable = $row['owner'] === $user_id || $row['public_access'] === 'rw' || $row['write_access'];

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
    $img = [
      'id' => $row['image_id'],
      'path' => $row['path'] . '.' . $row['ext'],
    ];
  }
  array_push($notes, [
    'id' => $row['note_id'],
    'x' => $row['x'],
    'y' => $row['y'],
    'text' => $row['text'],
    'img' => $img,
  ]);
}

$s = $db->prepare('SELECT id, note_1, note_2, pos_1, pos_2, color, size, dash FROM `connections` WHERE board_id = :board_id');
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
    'dash' => $row['dash'],
  ]);
}

json_result([
  'name' => $name,
  'editable' => $editable,
  'full_access' => $board_owner == $user_id,
  'notes' => $notes,
  'conns' => $conns,
]);
