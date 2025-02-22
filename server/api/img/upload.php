<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
optional_user();

if (!has_file('image')) {
  echo json_encode([
    'error' => 'No image provided',
  ]);
  http_response_code(400);
  exit;
}

$input = validate_request([
  'id' => [required(), vis_string(), vis_hex()],
]);

$db = use_db();
$hash = hash('sha256', file_get_contents($_FILES['image']['tmp_name']), true);
$board_id = hex2bin($input['id']);

// Check if this file already been uploaded
$s = $db->prepare(
  'SELECT `id`, `path`, `ext`, `name` FROM `images` WHERE `owner` IN
  (SELECT b.owner FROM `boards` AS b LEFT JOIN `access` AS a ON a.board_id = b.id
  WHERE b.uid = :board_id AND (b.owner = :user_id OR a.user_id = :user_id AND a.write_access = TRUE) GROUP BY b.owner)
  AND `hash` = :hash'
);
$s->execute([
  'board_id' => $board_id,
  'user_id' => $user_id,
  'hash' => $hash,
]);
if ($row = $s->fetch()) {
  json_result([
    'id' => $row['id'],
    'path' => $row['path'] . '.' . $row['ext'],
    'name' => $row['name'],
  ]);
}

$result = upload_file('image');
$filename = pathinfo($result['path'], PATHINFO_FILENAME);
$ext = pathinfo($result['path'], PATHINFO_EXTENSION);

$s = $db->prepare(
  'INSERT INTO `images`(`owner`, `path`, `ext`, `name`, `hash`)
  SELECT b.owner, :path, :ext, :name, :hash
  FROM `boards` AS b
  LEFT JOIN `access` AS a ON a.board_id = b.id
  WHERE
    b.uid = :board_id AND (
      b.owner = :user_id OR
      b.public_access = \'rw\' OR
      a.user_id = :user_id AND
      a.write_access = TRUE
    )
  GROUP BY b.owner'
);
$s->execute([
  'board_id' => $board_id,
  'user_id' => $user_id,
  'path' => $filename,
  'ext' => $ext,
  'name' => $result['name'],
  'hash' => $hash,
]);

if ($s->rowCount() == 1) {
  json_result([
    'success' => true,
    'id' => $db->lastInsertId(),
    'path' => $result['path'],
    'name' => $result['name'],
  ]);
} else {
  json_result([
    'success' => false,
  ]);
}
