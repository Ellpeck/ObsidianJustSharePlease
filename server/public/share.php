<?php

parse_str($_SERVER["QUERY_STRING"], $query);
switch ($_SERVER["REQUEST_METHOD"]) {
    case "GET":
        $content = file_get_contents(dirname(getcwd()) . "/data/" . $query["file"]);
        if (!$content) {
            http_response_code(404);
            break;
        }
        header("Content-Type: text/plain");
        echo $content;
        break;
    case "POST":
        // TODO upload using POST
        // TODO when uploading, generate and send back Guid and store in meta file alongside data
        // TODO when uploading, also generate and return a deletion password that is also stored in meta file
        break;
    case "DELETE":
        // TODO delete using DELETE
        // TODO only accept deletions if the password matches the deletion password from the upload
        break;
}
