<?php
require_once __DIR__ . '/../common/session.php';

function auth() {
  global $google_oauth_client_id, $google_oauth_redirect_uri;
  $params = [
    'response_type' => 'code',
    'client_id' => $google_oauth_client_id,
    'redirect_uri' => $google_oauth_redirect_uri,
    'scope' => 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
    'access_type' => 'offline',
  ];
  header('Location: https://accounts.google.com/o/oauth2/auth?' . http_build_query($params));
  exit;
}

if (key_exists('code', $_GET)) {
  $params = [
      'code' => $_GET['code'],
      'client_id' => $google_oauth_client_id,
      'client_secret' => $google_oauth_client_secret,
      'redirect_uri' => $google_oauth_redirect_uri,
      'grant_type' => 'authorization_code'
  ];
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, 'https://accounts.google.com/o/oauth2/token');
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  $response = curl_exec($ch);
  curl_close($ch);
  $response = json_decode($response, true);
  if (!key_exists('access_token', $response)) {
    auth();
  }

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, 'https://www.googleapis.com/oauth2/' . $google_oauth_version . '/userinfo');
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $response['access_token']]);
  $response = curl_exec($ch);
  curl_close($ch);
  $profile = json_decode($response, true);
  if (!key_exists('email', $profile)) {
    auth();
  }

  $s = use_db()->prepare(
    'SELECT u.id, `name`, `username`, `email_login`
    FROM `users` AS u
    LEFT JOIN `emails` AS e ON e.user_id = u.id
    WHERE email = :email AND verified_at IS NOT NULL'
  );
  $s->execute([
    'email' => $profile['email'],
  ]);
  if (key_exists('user_id', $_SESSION)) {
    // Add email
    $s = use_db()->prepare('INSERT IGNORE INTO `emails`(`user_id`, `email`, `verified_at`) VALUES(:id, :email, NOW())');
    $s->execute([
      'id' => $_SESSION['user_id'],
      'email' => $profile['email'],
    ]);
    header('Location: ../../' . $auth_settings_path);
  } else if ($row = $s->fetch()) {
    // Login
    session_regenerate_id();
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['name'] = $row['name'];
    $_SESSION['username'] = $row['username'];
    $_SESSION['email_login'] = $row['email_login'];
    header('Location: ../../');
  } else {
    // Register
    $_SESSION['name'] = $profile['name'];
    $_SESSION['email'] = $profile['email'];
    header('Location: ../../' . $auth_register_path);
  }
} else {
  auth();
}
