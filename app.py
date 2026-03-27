import os
from dotenv import load_dotenv
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from supabase import create_client
import bcrypt

load_dotenv()

# Supabase Setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Serve the main entry point
@app.route('/')
def index():
    return send_from_directory('.', 'login.html')

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({"status": "error", "message": "Missing required fields"}), 400

    # Check if user already exists
    existing_user = supabase.table('Client').select("Gmail").eq("Gmail", email).execute()
    if existing_user.data:
        return jsonify({"status": "error", "message": "Email already registered"}), 409

    # Hash password for security
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()

    try:
        res = supabase.table('Client').insert({
            "Username": name,
            "Gmail": email,
            "password": hashed_pw
        }).execute()
        return jsonify({"status": "success", "message": "Account created successfully"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '')

    try:
        res = supabase.table('Client').select("id", "Username", "Gmail", "password").eq("Gmail", email).execute()
        if not res.data:
            return jsonify({"status": "error", "message": "User not found"}), 404

        user = res.data[0]
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode()):
            return jsonify({"status": "success", "message": "Welcome back!", "user": {"name": user['Username'], "id": user['id']}}), 200
        return jsonify({"status": "error", "message": "Invalid password"}), 401
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Serve static files (css, js, data, assets)
@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    print("🚀 AI Farmer Server running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)