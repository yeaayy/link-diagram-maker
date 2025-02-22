<?php

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

function vis_hex(string $msg = null) {
  return function ($input) use ($msg) {
    if (!preg_match('/^[0-9A-Fa-f]*$/', $input)) {
      return [
        'error' => true,
        'msg' => $msg ?? '%name% must be a hex',
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

function vin_enum(array $enum, string $msg = null) {
  return function ($input) use ($enum, $msg) {
    foreach ($enum as $v) {
      if ($v === $input) {
        return [
          'error' => false,
          'stop' => false,
        ];
      }
    }
    return [
      'error' => true,
      'msg' => $msg ?? 'invalid value of %name%',
    ];
  };
}

function required(string $msg = null) {
  return function ($input) use ($msg) {
    if ($input === null) {
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

function optional() {
  return function ($input) {
    return [
      'error' => false,
      'stop' => $input === null,
    ];
  };
}

function exact_length(int $length, string $msg = null)
{
  return function ($input) use ($length, $msg) {
    $input_length = strlen($input);
    if ($input_length != $length) {
      return [
        'error' => true,
        'msg' => strtr($msg ?? 'length of %name% (=%input_length%) must be %length%', [
          '%length%' => $length,
          '%input_length%' => $input_length,
        ]),
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
    $length = strlen($input);
    if ($length < $min) {
      return [
        'error' => true,
        'msg' => strtr($msg ?? 'length of %name% (=%length%) is grater than %min%', [
          '%min%' => $min,
          '%length%' => $length,
        ]),
      ];
    }
    return [
      'error' => false,
      'stop' => false,
    ];
  };
}

function max_length(int $max, string $msg = null)
{
  return function ($input) use ($max, $msg) {
    $length = strlen($input);
    if ($length > $max) {
      return [
        'error' => true,
        'msg' => strtr($msg ?? 'length of %name% (=%length%) is greater than %max%', [
          '%max%' => $max,
          '%length%' => $length,
        ]),
      ];
    }
    return [
      'error' => false,
      'stop' => false,
    ];
  };
}

function validate($input, $validation_rules)
{
  $validated = [];
  $errors = [];
  $has_error = false;
  foreach ($validation_rules as $key => $rules) {
    foreach ($rules as $rule) {
      $value = key_exists($key, $input) ? $input[$key] : null;
      $result = $rule($value);
      if ($result['error']) {
        $errors[$key] = strtr($result['msg'], [
          '%name%' => $key,
        ]);
        $has_error = true;
        break;
      } else {
        $validated[$key] = $value;
        if($result['stop']) {
          break;
        }
      }
    }
  }
  if ($has_error) {
    http_response_code(400);
    echo json_encode([
      'error' => $errors,
    ]);
    exit;
  }
  return $validated;
}

function validate_request($validation_rules)
{
  return validate(get_request(), $validation_rules);
}

function require_method(...$methods)
{
  foreach ($methods as $method) {
    if ($_SERVER['REQUEST_METHOD'] === $method) {
      return $method;
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

function optional_user()
{
  global $user_id;
  if (!empty($user_id)) {
    return;
  }
  if (key_exists('user_id', $_SESSION)) {
    $user_id = $_SESSION['user_id'];
  } else {
    $user_id = 0;
  }
}
