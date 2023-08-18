<?php

switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        handle_get();
        break;
    case "POST":
        handle_post();
        break;
    case "PATCH":
        handle_patch();
        break;
    case "DELETE":
        handle_delete();
        break;
    default:
        http_response_code(405);
        echo "Unsupported method";
}

function handle_get(): void {
    parse_str($_SERVER["QUERY_STRING"], $query);
    $content = file_get_contents(get_markdown_path($query["id"]));
    if ($content === false) {
        http_response_code(404);
        echo "Not found";
        return;
    }
    echo $content;
}

function handle_post(): void {
    $content = get_markdown_content();
    if ($content === null)
        return;

    try {
        // generate id and deletion/edit password
        $id = bin2hex(random_bytes(4));
        $password = bin2hex(random_bytes(16));
    } catch (Exception $e) {
        http_response_code(500);
        echo $e->getMessage();
        return;
    }

    $meta = json_encode([
        "id" => $id,
        "password" => $password
    ]);

    // store markdown and metadata in data path
    file_put_contents(get_markdown_path($id), $content);
    file_put_contents(get_meta_path($id), $meta);

    echo $meta;
}

function handle_patch(): void {
    $info = get_patch_delete_info();
    $content = get_markdown_content();
    if (!$info || $content === null)
        return;
    [$id, $password] = $info;
    if (!check_password($id, $password))
        return;

    file_put_contents(get_markdown_path($id), $content);
}

function handle_delete(): void {
    $info = get_patch_delete_info();
    if (!$info)
        return;
    [$id, $password] = $info;
    if (!check_password($id, $password))
        return;

    // delete content and meta
    unlink(get_markdown_path($id));
    unlink(get_meta_path($id));
}

function check_password(string $id, string $password): bool {
    $meta = json_decode(file_get_contents(get_meta_path($id)), true);
    if ($password != $meta["password"]) {
        http_response_code(401);
        echo "Unauthorized";
        return false;
    }
    return true;
}

function get_patch_delete_info(): ?array {
    parse_str($_SERVER["QUERY_STRING"], $query);
    $id = $query["id"];
    $password = $_SERVER["HTTP_PASSWORD"];
    if (!$id || !$password) {
        http_response_code(400);
        echo "No id or password";
        return null;
    }
    return [$id, $password];
}

function get_markdown_content(): ?string {
    $body = json_decode(file_get_contents("php://input"), true);
    if (!array_key_exists("content", $body)) {
        http_response_code(400);
        echo "No content";
        return null;
    }
    return $body["content"];
}

function get_markdown_path(string $id): string {
    return get_id_base_path($id) . ".md";
}

function get_meta_path(string $id): string {
    return get_id_base_path($id) . ".json";
}

function get_id_base_path(string $id): string {
    // ensure id can't be used to traverse into other directories
    return dirname(getcwd()) . "/data/" . basename($id);
}
