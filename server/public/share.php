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
        $content = $body ? $body["content"] : null;
        if (!$content) {
            http_response_code(400);
            echo "No content";
            break;
        }

        try {
            // generate id and deletion/edit password
            $id = random_int(0, 65535);
            $password = random_int(32, PHP_INT_MAX);
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
