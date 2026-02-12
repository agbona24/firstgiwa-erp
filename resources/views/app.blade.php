<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>FIRSTGIWA ERP - Enterprise Resource Planning</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800" rel="stylesheet" />

    <!-- Vite -->
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/index.jsx'])
</head>
<body class="antialiased">
    <div id="app"></div>
</body>
</html>
