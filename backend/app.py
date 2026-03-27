from flask import Flask, request, jsonify
from supabase import create_client
import bcrypt
from flask_cors import CORS
from config import SUPABASE_URL, SUPABASE_KEY

app = Flask(__name__)
CORS(app)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ✅ SIGNUP
@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    # Hash password
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()

    # Insert into DB
    res = supabase.table('Client').insert({
        "Username": name,
        "Gmail": email,
        "password": hashed_pw
    }).execute()

    if res.data:
        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "error"}), 400


# ✅ LOGIN
@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data['email']
    password = data['password']

    res = supabase.table('Client').select("*").eq("Gmail", email).execute()

    if not res.data:
        return jsonify({"status": "user_not_found"}), 404

    user = res.data[0]

    if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode()):
        return jsonify({
            "status": "success",
            "user": {
                "name": user['Username'],
                "email": user['Gmail']
            }
        })
    else:
        return jsonify({"status": "wrong_password"}), 401


if __name__ == '__main__':
    app.run(debug=True)