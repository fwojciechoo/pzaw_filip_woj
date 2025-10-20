// import { createServer } from 'node:http';
// import { URL } from "node:url";

// // Create a HTTP server
// const server = createServer((req, res) => {
//   const request_url = new URL(`http://${host}${req.url}`);
//   console.log(`Request: ${req.method} ${request_url.pathname}`);

//   res.writeHead(200, { 'Content-Type': 'text/plain' });
//   res.end('hello world!\n');
// });

// const port = 8000;
// const host = "localhost";

// // Start the server
// server.listen(port, host, () => {
//     console.log(`Server listening on http://${host}:${port}`);
// });


// import http from "node:http";
// import fs from "node:fs";

// const port = 8000;

// const index_html = fs.readFileSync("./public/index.html");
// const favicon_ico = fs.readFileSync("./public/favicon.ico");

// const server = http.createServer(function (req, res) {
//   if (req.url && req.url === "/") {
//     res.statusCode = 200;
//     res.setHeader("Content-Type", "text/html");
//     res.end(index_html);
//   }

//   if (req.url && req.url === "/favicon.ico") {
//     res.statusCode = 200;
//     res.setHeader("Content-Type", "image/vnd.microsoft.icon");
//     res.end(favicon_ico);
//   }

//   if (req.url && req.url === "/json") {
//     const content = {
//       message: "Hello there",
//       time: Intl.DateTimeFormat("pl", {
//         dateStyle: "full",
//         timeStyle: "long",
//         timeZone: "CET",
//       }).format(Date.now()),
//     };
//     res.statusCode = 200;
//     res.setHeader("Content-Type", "application/json");
//     res.end(JSON.stringify(content));
//   }
// gowno
//   // Unknown reques
//   res.statusCode = 404;
//   res.end();
// });

// server.listen(port);
// console.log(`Server listening on port http://localhost:${port}`);

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { URL } from "node:url";

const html = readFileSync("public/index.html");
const icon = readFileSync("public/favicon.ico");
const server = createServer((req, res) => {
    
    const request_url = new URL(`http://${host}${req.url}`);
    const path = request_url.pathname;
    console.log(`Request: ${req.method} ${request_url.pathname}`);

    if (path === "/") {
        if (req.method !== 'GET'){
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end('metoda n istn\n');
        }
        else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
        }
    }

    else if (path === "/favicon.ico") {
        if(req.method !== 'GET') {
                res.writeHead(405, { 'Content-Type': 'text/plain' });
                res.end('metoda n istn\n');
        }
        else{
                res.writeHead(200, { 'Content-Type' : 'image/vnd.microsoft.icon'});
                res.end(icon);
        }
    }
    if (!res.writableEnded) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('zle zapytanie\n');
    }
});

const port = 8000;
const host = "localhost";

server.listen(port, host, () => {
        console.log(`Server listening on http://${host}:${port}`);
});