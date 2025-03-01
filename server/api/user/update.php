<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
require_user();

$data = validate_request([
  'name' => [optional(), vis_string(), function () {
    return ;
  }],
  'username' => [optional(), vis_string(), min_length(3), max_length(40)],
  'email_login' => [optional()],
]);

$param = [
  'user_id' => $user_id,
];
$query = [];
foreach ($data as $k => $v) {
  if ($v !== null) {
    array_push($query, "$k = :$k");
    if ($k === 'email_login') {
      $param[$k] = intval($v);
    } else {
      $param[$k] = $v;
    }
  }
}

$s = use_db()->prepare('UPDATE `users` SET '.join(',', $query).' WHERE id = :user_id');

try {
  $s->execute($param);
  json_result([
    'success' => $s->rowCount() === 1,
  ]);
} catch(PDOException $e) {
  json_result([
    'error' => [
      'username' => 'Username not available',
    ],
  ], 400);
}
