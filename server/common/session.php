<?php
ini_set('display_errors', 0);
ini_set("log_errors", 1);
ini_set("error_log", __DIR__ . "/error.log");

session_start();

$upload_dir = __DIR__ . '/../../img/';

require_once __DIR__ . '/config.php';

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

function get_request()
{
  $result = [];
  foreach ($_GET as $k => $v) {
    $result[$k] = trim($v);
  }
  foreach ($_POST as $k => $v) {
    $result[$k] = trim($v);
  }
  foreach ($_FILES as $k => $v) {
    $result[$k] = $v;
  }
  if (key_exists('CONTENT_TYPE', $_SERVER) && $_SERVER['CONTENT_TYPE'] === 'application/json') {
    $json = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
      http_response_code(400);
      echo json_encode([
        'error' => 'Malformed input',
      ]);
      exit;
    }
    foreach ($json as $k => $v) {
      $result[$k] = $v;
    }
  }
  return $result;
}

function vis_string(string $msg = null) {
  return function ($input) use ($msg) {
    if (!is_string($input)) {
      return [
        'error' => true,
        'msg' => $msg ?? '%name% must be string',
      ];
    }
    return [
      'error' => false,
      'stop' => false,
    ];
  };
}

function vis_number(string $msg = null) {
  return function ($input) use ($msg) {
    if (!is_numeric($input)) {
      return [
        'error' => true,
        'msg' => $msg ?? '%name% must be number',
      ];
    }
    return [
      'error' => false,
      'stop' => false,
    ];
  };
}

function required(string $msg = null) {
  return function ($input) use ($msg) {
    if (empty($input)) {
      return [
        'error' => true,
        'msg' => $msg ?? '%name% is required',
      ];
    }
    return [
      'error' => false,
      'stop' => false,
    ];
  };
}

function min_length(int $min, string $msg = null)
{
  return function ($input) use ($min, $msg) {
    if (strlen($input) < $min) {
      return [
        'error' => true,
        'msg' => $msg ?? '%name% is required',
      ];
    }
    return [
      'error' => false,
      'stop' => false,
    ];
  };
}

function validate_request($validation_rules)
{
  $input = get_request();
  $validated = [];
  $errors = [];
  $has_error = false;
  foreach ($validation_rules as $key => $rules) {
    foreach ($rules as $rule) {
      $result = $rule($input[$key]);
      if ($result['error']) {
        $errors[$key] = str_replace('%name%', $key, $result['msg']);
        $has_error = true;
        break;
      } else {
        $validated[$key] = $input[$key];
        if($result['stop']) {
          break;
        }
      }
    }
  }
  if ($has_error) {
    echo json_encode([
      'error' => $errors,
    ]);
    exit;
  }
  return $validated;
}

function require_method(...$methods)
{
  foreach ($methods as $method) {
    if ($_SERVER['REQUEST_METHOD'] === $method) {
      return;
    }
  }
  http_response_code(405);
  exit;
}

function require_method_post()
{
  require_method('POST');
}

function require_method_get()
{
  require_method('GET');
}

function require_user()
{
  global $user_id;
  if (!empty($user_id)) {
    return;
  }
  if (!key_exists('user_id', $_SESSION)) {
    http_response_code(401);
    echo json_encode([
      'error' => [
        'auth' => false,
      ],
    ]);
    exit;
  }
  $user_id = $_SESSION['user_id'];
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
