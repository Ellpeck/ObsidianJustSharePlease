<?php

switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        parse_str($_SERVER["QUERY_STRING"], $query);
        $content = file_get_contents(get_markdown_path($query["id"]));
        if (!$content) {
            http_response_code(404);
            echo "Not found";
            break;
        }
        header("Content-Type: text/plain");
        echo $content;
        break;
    case "POST":
        $body = json_decode(file_get_contents("php://input"), true);
        $content = $body["content"];
        if (!$content) {
            http_response_code(400);
            echo "No content";
            break;
        }

        try {
            // generate id and deletion/edit password
            $id = bin2hex(random_bytes(4));
            $password = bin2hex(random_bytes(16));
        } catch (Exception $e) {
            http_response_code(500);
            echo $e->getMessage();
            break;
        }

        $meta = json_encode([
            "id" => $id,
            "deletion_password" => $password
        ]);

        // store markdown and metadata in data path
        file_put_contents(get_markdown_path($id), $content);
        file_put_contents(get_meta_path($id), $meta);

        echo $meta;
        break;
    case "PATCH":
        // TODO update using PATCH
    case "DELETE":
        parse_str($_SERVER["QUERY_STRING"], $query);
        $id = $query["id"];
        $password = $_SERVER["HTTP_PASSWORD"];
        if (!$id || !$password) {
            http_response_code(400);
            echo "No id or password";
            break;
        }

        // check deletion password match
        $meta = json_decode(file_get_contents(get_meta_path($id)), true);
        if ($password != $meta["deletion_password"]) {
            http_response_code(401);
            echo "Unauthorized";
            break;
        }

        // delete content and meta
        unlink(get_markdown_path($id));
        unlink(get_meta_path($id));
        break;
}

function get_markdown_path(string $id): string {
    return get_data_path() . $id . ".md";
}

function get_meta_path(string $id): string {
    return get_data_path() . $id . ".json";
}

function get_data_path(): string {
    return dirname(getcwd()) . "/data/";
}
