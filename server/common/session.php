<?php
ini_set('display_errors', 0);
ini_set("log_errors", 1);
ini_set("error_log", __DIR__ . "/error.log");

session_start();

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/validation.php';

function use_db(): \PDO
{
  global $db, $db_host, $db_user, $db_password, $db_database;
  if ($db) return $db;
  try {
  $db = new PDO("mysql:host=$db_host;dbname=$db_database", $db_user, $db_password);
  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
  return $db;
  } catch (PDOException $e) {
  echo "Database onnection failed: " . $e->getMessage();
  exit;
  }
}

function upload_file($name)
{
  global $upload_dir;
  $basename = basename($_FILES[$name]["name"]);
  $ext = strtolower(pathinfo($basename, PATHINFO_EXTENSION));
  $filename = pathinfo($basename, PATHINFO_FILENAME);
  do {
    $target_name = bin2hex(random_bytes(16)) . '.' . $ext;
    $target_path = $upload_dir . $target_name;
  } while(file_exists($target_path));

  move_uploaded_file($_FILES[$name]["tmp_name"], $target_path);
  return [
    'path' => $target_name,
    'name' => $filename,
  ];
}

function delete_file($path)
{
  global $upload_dir;
  unlink($upload_dir . $path);
}

function has_file($name)
{
  return key_exists($name, $_FILES) && $_FILES[$name]['error'] == 0;
}

function generate_random(int $len)
{
  $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  $charsCount = strlen($chars) - 1;
  $result = [];
  for ($i = 0; $i < $len; $i++) {
    array_push($result, $chars[rand(0, $charsCount)]);
  }
  return join('', $result);
}
