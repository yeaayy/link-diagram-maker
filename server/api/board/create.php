<?php
require_once __DIR__ . '/../../common/session.php';
require_method_post();
require_user();

$db = use_db();
$s = $db->prepare('INSERT INTO `boards`(`owner`, `uid`, `name`) VALUES(:user_id, UNHEX(REPLACE(UUID(),"-","")), \'Untitled diagram\')');
$s->execute([
  'user_id' => $user_id,
]);

$s = $db->prepare('SELECT `uid` FROM `boards` WHERE id = :id');
$s->execute([
  'id' => $db->lastInsertId(),
]);

json_result([
  'success' => true,
  'id' =>  bin2hex($s->fetch()['uid']),
]);
