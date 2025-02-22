<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
optional_user();

$input = validate_request([
  'id' => [required(), vis_string(), vis_hex()],
  'img' => [required()],
]);

$db = use_db();
$s = $db->prepare(
  'SELECT b.owner, i.path, i.ext
  FROM `boards` AS b
  LEFT JOIN `access` AS a ON b.id = a.board_id
  JOIN `images` AS i ON b.owner = i.owner
  WHERE
    i.id = :image AND
    b.uid = :board_id AND (
      b.owner = :user_id OR
      b.public_access = \'rw\' OR
      a.user_id = :user_id AND
      a.write_access IS TRUE
    )
  GROUP BY i.id'
);
$s->execute([
  'board_id' => hex2bin($input['id']),
  'user_id' => $user_id,
  'image' => $input['img'],
]);
$row = $s->fetch();
if (!$row) {
  json_result([
    'success' => false,
    'msg' => 'Image not found',
  ]);
}

$s = $db->prepare('DELETE FROM `images` WHERE owner = :user_id and id = :image');
$s->execute([
  'user_id' => $row['owner'],
  'image' => $input['img'],
]);

delete_file($row['path'] . '.' . $row['ext']);

json_result([
  'success' => true,
]);
