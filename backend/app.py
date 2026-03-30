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
    insert_data = {
        "Username": name,
        "Gmail": email,
        "password": hashed_pw,
        "Gender": data.get('gender'),
        "Age": data.get('age'),
        "Education": data.get('education'),
        "Contect_No": data.get('phone'),
        "Experience": data.get('experience'),
        "Farm_Area": data.get('farm_size'),
        "Farming_Goal": data.get('goal'),
        "Current_Crops": data.get('crops'),
        "Previous_Data": data.get('history')
    }
    res = supabase.table('Client').insert(insert_data).execute()

    if res.data:
        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "error"}), 400


@app.route('/farm-setup', methods=['POST'])
def farm_setup():
    data = request.json
    email = data['email']
    
    # Update existing user with farm data
    update_data = {k: v for k, v in data.items() if k != 'email'}
    
    res = supabase.table('Client').update(update_data).eq("Gmail", email).execute()
    
    if res.data:
        return jsonify({"status": "success", "message": "Farm setup saved!"})
    else:
        return jsonify({"status": "error", "message": "User not found"}), 404


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
    app.run(debug=True, host='0.0.0.0', port=5000)
