import http.server
import socketserver
import json
import os
from urllib.parse import urlparse, unquote

PORT = 8080
WORKDIR = os.path.dirname(__file__) or "."

SESSIONS_FILE = os.path.join(WORKDIR, "sessions.json")

def load_sessions():
    if not os.path.exists(SESSIONS_FILE):
        return {}
    try:
        with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_sessions(sessions):
    with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(sessions, f, indent=2)

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Allow cross-origin from local dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith('/api/sessions'):
            sessions = load_sessions()
            parts = parsed.path.rstrip('/').split('/')
            if len(parts) == 3 and parts[-1] == 'sessions':
                # GET /api/sessions -> all
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(sessions).encode('utf-8'))
                return
            elif len(parts) == 4:
                # GET /api/sessions/<code>
                code = unquote(parts[-1])
                session = sessions.get(code)
                if session:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(session).encode('utf-8'))
                else:
                    self.send_response(404)
                    self.end_headers()
                return
        # fallback to static file serving
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/sessions':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length) if length > 0 else b'{}'
            try:
                session = json.loads(body.decode('utf-8'))
                code = session.get('code')
                if not code:
                    self.send_response(400)
                    self.end_headers()
                    return
                sessions = load_sessions()
                sessions[code] = session
                save_sessions(sessions)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok", "code": code}).encode('utf-8'))
            except Exception:
                self.send_response(500)
                self.end_headers()
            return
        # not an API POST -> static fallback
        return super().do_POST()

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith('/api/sessions/'):
            parts = parsed.path.rstrip('/').split('/')
            if len(parts) == 4:
                code = unquote(parts[-1])
                sessions = load_sessions()
                if code in sessions:
                    del sessions[code]
                    save_sessions(sessions)
                    self.send_response(200)
                    self.end_headers()
                    return
                else:
                    self.send_response(404)
                    self.end_headers()
                    return
        return super().do_DELETE()

if __name__ == '__main__':
    os.chdir(WORKDIR)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving {WORKDIR} at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Shutting down")
            httpd.server_close()
            from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

users = {}  # Simple in-memory user storage

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if email in users:
        if users[email]["password"] == password and users[email]["role"] == role:
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
    else:
        users[email] = {"password": password, "role": role}
        return jsonify({"success": True, "message": "Account Created"})

if __name__ == '__main__':
    app.run(debug=True)
