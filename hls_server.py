from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial


class HLSRequestHandler(SimpleHTTPRequestHandler):

    def end_headers(self):
        self.send_header(
            "Access-Control-Allow-Origin",
            "http://localhost:3000"
        )

        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, HEAD, OPTIONS"
        )

        self.send_header(
            "Access-Control-Allow-Headers",
            "*"
        )

        super().end_headers()

    def guess_type(self, path):

        if path.endswith(".m3u8"):
            return "application/vnd.apple.mpegurl"

        if path.endswith(".ts"):
            return "video/mp2t"

        return super().guess_type(path)


handler = partial(
    HLSRequestHandler,
    directory="media/hls"
)


server = ThreadingHTTPServer(
    ("0.0.0.0", 8081),
    handler
)


print(
    "Servidor HLS ejecutándose en "
    "http://localhost:8081"
)


try:
    server.serve_forever()

except KeyboardInterrupt:
    print("\nServidor HLS detenido.")

finally:
    server.server_close()
