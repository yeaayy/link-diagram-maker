<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
optional_user();

$input = validate_request([
  'name' => [required(), vis_string()],
  'id' => [required(), vis_string()],
]);

if (vis_hex()($input['id'])['error']) {
  not_found('Board not found');
}

$s = use_db()->prepare(
  'UPDATE `boards` AS b
  SET name = :name
  WHERE uid = :board_id AND (
    owner = :user_id OR
    public_access = \'rw\' OR
    EXISTS (
      SELECT id
      FROM `access` AS a
      WHERE 
        b.id = a.board_id AND
        a.user_id = :user_id AND
        a.write_access IS TRUE
    )
  )'
);
$s->execute([
  'name' => $input['name'],
  'board_id' => hex2bin($input['id']),
  'user_id' => $user_id,
]);

if ($s->rowCount() === 0) {
  json_result([
    'success' => false,
    'msg' => 'Board not found',
  ], 404);
} else {
  json_result([
    'success' => true,
  ]);
}
