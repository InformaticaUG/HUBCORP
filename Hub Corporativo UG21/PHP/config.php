<?php
// Configuración privada de People Hub.
// Para cambiar la contraseña, genera un hash en el servidor con:
//   php -r "echo password_hash('NUEVA_CONTRASEÑA', PASSWORD_DEFAULT), PHP_EOL;"
// y pégalo en 'admin_pass_hash'.
return [
    'admin_user'      => 'administrador',
    'admin_pass_hash' => '$2y$12$g.8XSXyP9.gizs5SuUU2duwQnypbYOaJ/0357d5WfjOcJIXTFPEhq',
];
