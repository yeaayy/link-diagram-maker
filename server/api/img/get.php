<?php
require_once __DIR__ . '/../../common/session.php';
require_method_get();
optional_user();

$input = validate_request([
  'id' => [required(), vis_string(), vis_hex()],
]);

$s = use_db()->prepare(
  'SELECT id, path, ext, name, hash
  FROM `images`
  WHERE
    owner IN (
      SELECT b.owner
      FROM `boards` AS b
      LEFT JOIN `access` AS a ON a.board_id = b.id
      WHERE
        b.uid = :board_id AND (
          b.public_access = \'rw\' OR
          b.owner = :user_id OR
          a.user_id = :user_id AND
          a.write_access = TRUE
        )
      GROUP BY b.owner
    )'
);
$s->execute([
  'board_id' => hex2bin($input['id']),
  'user_id' => $user_id,
]);

$result = [];
while ($row = $s->fetch()) {
  array_push($result, [
    'id' => $row['id'],
    'path' => $row['path'] . '.' . $row['ext'],
    'name' => $row['name'],
    'hash' => bin2hex($row['hash']),
  ]);
}

json_result([
  'success' => true,
  'result' => $result,
]);
