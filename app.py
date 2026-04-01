import os
from dotenv import load_dotenv
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from supabase import create_client
import bcrypt
import sys
import numpy as np
from PIL import Image
import io
import joblib  # Use 'import tensorflow as tf' if your model is .h5
sys.path.append('./backend')
from mailer import generate_otp, send_otp_email

load_dotenv()

# Ensure we use absolute paths to prevent "Not Found" errors
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Try both spellings just in case of typos in folder names
F_DIR = 'frountend' if os.path.exists(os.path.join(BASE_DIR, 'frountend')) else 'frontend'
PAGES_DIR = os.path.join(BASE_DIR, F_DIR, 'pages')
SCRIPTS_DIR = os.path.join(BASE_DIR, F_DIR, 'scripts')
ASSETS_DIR = os.path.join(BASE_DIR, F_DIR, 'assets')
ML_DIR = os.path.join(BASE_DIR, 'ML')

# --- Dynamic ML Model Loading ---
MODELS = {}
try:
    if os.path.exists(ML_DIR):
        for filename in os.listdir(ML_DIR):
            if filename.endswith(('.pkl', '.joblib')):
                path = os.path.join(ML_DIR, filename)
                try:
                    MODELS[filename] = joblib.load(path)
                    print(f"✅ Loaded ML Model: {filename}")
                except Exception as e:
                    print(f"❌ Failed to load {filename}: {e}")
        
        if not MODELS:
            print(f"⚠️ Warning: No valid .pkl or .joblib files found in {ML_DIR}")
    else:
        print(f"⚠️ Directory 'ML' does not exist at: {ML_DIR}")
        os.makedirs(ML_DIR, exist_ok=True)
        print(f"📂 Created 'ML' directory. Please place your .pkl files there.")
except Exception as e:
    print(f"❌ Error during model initialization: {e}")

# Mapping of predictions to detailed soil data
SOIL_DATA_MAP = {
    "Loamy": {
        "pH": "6.8",
        "NPK": "Nitrogen: High, Phosphorus: Medium, Potassium: Medium",
        "organic_matter": "2.1%",
        "recommendation": "Excellent for Wheat, Barley, and Tomatoes."
    },
    "Sandy": {
        "pH": "5.5",
        "NPK": "Low across all nutrients",
        "organic_matter": "0.5%",
        "recommendation": "Best for Melons, Carrots, or requires heavy organic addition."
    }
}

# Default class names for fallback if model doesn't specify classes_
DEFAULT_CLASS_NAMES = ["Loamy", "Sandy"]

DEFAULT_PORT = 5000

if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
    print("CRITICAL: Supabase credentials missing in .env file.")

# Temporary storage for OTPs (In a production app, use Redis or a DB table with expiry)
otp_store = {}

# Supabase Setup
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Flask without a default static_url_path to avoid routing conflicts
app = Flask(__name__, static_folder=None)
CORS(app)

# Serve the main entry point
@app.route('/')
def index():
    """Serves the login page as the entry point."""
    # Explicitly serve login.html from the pages directory
    if os.path.exists(os.path.join(PAGES_DIR, 'login.html')):
        return send_from_directory(PAGES_DIR, 'login.html')
    
    # Fallback error message
    return f"404: login.html not found in {PAGES_DIR}", 404

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
        insert_data = {
            "Username": name,
            "Gmail": email,
            "password": hashed_pw,
            "Gender": data.get('gender'),
            "Age": int(float(data.get('age'))) if data.get('age') else None,
            "Education": data.get('education'),
            "Contect_No": data.get('phone'),
            "Experience": float(data.get('experience')) if data.get('experience') else 0.0,
            "Farm_Area": float(data.get('farm_size') or 0),
            "Farming_Goal": data.get('goal'),
            "Current_Crops": ", ".join(data.get('crops', [])) if isinstance(data.get('crops'), list) else str(data.get('crops', '')),
            "Previous_Data": str(data.get('history', ''))
        }
        res = supabase.table('Client').insert(insert_data).execute()
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

@app.route('/get-profile', methods=['POST'])
def get_profile():
    data = request.json
    email = data.get('email', '').strip()
    if not email:
        return jsonify({"status": "error", "message": "Email required"}), 400
    
    try:
        # Query by Gmail column
        res = supabase.table('Client').select("*").eq("Gmail", email).limit(1).execute()
        if res.data:
            return jsonify({"status": "success", "user": res.data[0]}), 200
        return jsonify({"status": "error", "message": "User not found"}), 404
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/request-otp', methods=['POST'])
def request_otp():
    data = request.json
    identifier = data.get('identifier') # Can be email or username
    if not identifier:
        return jsonify({"status": "error", "message": "Username or Email required"}), 400

    # Find user in database by either Gmail or Username
    res = supabase.table('Client').select("Gmail").or_(f'Gmail.eq.{identifier},Username.eq.{identifier}').execute()
    if not res.data:
        return jsonify({"status": "error", "message": "User not found"}), 404
    
    target_email = res.data[0]['Gmail']
    otp = generate_otp()
    otp_store[target_email] = otp
    
    # FIXED: Check if the mailer actually succeeded in sending the email
    email_sent = send_otp_email(target_email, otp)
    
    if email_sent:
        return jsonify({
            "status": "success", 
            "message": f"OTP sent to {target_email}", 
            "email": target_email
        }), 200
    else:
        return jsonify({"status": "error", "message": "Failed to send email. Check SMTP settings."}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')

    if not email or not otp:
        return jsonify({"status": "error", "message": "Missing OTP or email"}), 400

    if otp_store.get(email) == str(otp):
        return jsonify({"status": "success", "message": "OTP Verified"}), 200
    
    return jsonify({"status": "error", "message": "Invalid OTP"}), 401

@app.route('/verify-and-change-password', methods=['POST'])
def verify_and_change_password():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('password')

    if otp_store.get(email) != str(otp):
        return jsonify({"status": "error", "message": "Invalid or expired OTP"}), 401

    # Hash the new password
    hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode()
    
    res = supabase.table('Client').update({"password": hashed_pw}).eq("Gmail", email).execute()
    if res.data:
        del otp_store[email] # Clear OTP after use
        return jsonify({"status": "success", "message": "Password updated successfully"}), 200
    return jsonify({"status": "error", "message": "Update failed"}), 400

@app.route('/save-profile', methods=['POST'])
def update_profile():
    data = request.json
    email = data.get('Gmail')
    if not email:
        return jsonify({"status": "error", "message": "Email required"}), 400
    
    # If password update is requested, hash it correctly
    password = data.get('password')
    if password:
        data['password'] = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()

    # Store email before cleaning the payload
    target_email = email.strip()

    # Clean payload to prevent database integrity errors
    keys_to_remove = ['id', 'created_at', 'Gmail']
    for key in keys_to_remove:
        data.pop(key, None)

    try:
        supabase.table('Client').update(data).eq("Gmail", target_email).execute()
        return jsonify({"status": "success", "message": "Profile updated"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get-products', methods=['GET'])
def get_products():
    try:
        res = supabase.table('products').select("*").execute()
        return jsonify({"status": "success", "products": res.data}), 200
    except Exception as e:
        print(f"Error fetching products: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/place-order', methods=['POST'])
def place_order():
    data = request.json
    # Ensure buyer_id is an integer for the BigInt column
    try:
        buyer_id = int(data.get('buyer_id'))
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Invalid Buyer ID"}), 400
        
    seller_id = data.get('seller_id') # Defaults to None (NULL in DB)
    total_amount = data.get('total_amount')
    items = data.get('items') # List of {id, quantity, price}

    try:
        # 1. Create the main order record
        order_payload = {
            "buyer_id": buyer_id,
            "seller_id": seller_id,
            "total_amount": total_amount
        }
        order_res = supabase.table('orders').insert(order_payload).execute()
        
        if not order_res.data:
            return jsonify({"status": "error", "message": "Failed to create order"}), 400
            
        order_id = order_res.data[0]['id']
        
        # 2. Prepare items for bulk insertion
        order_items = [{
            "order_id": order_id,
            "product_id": item['id'],
            "quantity": item['quantity'],
            "price": item['price']
        } for item in items]
            
        supabase.table('order_items').insert(order_items).execute()
        return jsonify({"status": "success", "message": "Order placed successfully"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/analyze-soil', methods=['POST'])
def analyze_soil():
    """Receives a soil image and runs the ML model from the /ML folder."""
    if not MODELS:
        return jsonify({"status": "error", "message": "No ML Models loaded on server"}), 500

    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image uploaded"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No selected file"}), 400

    try:
        # 1. Process the Image
        img = Image.open(file.stream).convert('RGB')
        # Resize to whatever your model requires (e.g., 224x224 for most CNNs)
        img = img.resize((224, 224)) 
        img_np = np.array(img) / 255.0  # Normalize
        
        # Extract basic numerical features from the image (Mean R, G, B)
        # This allows tabular models (RandomForest) to "run" using image data
        avg_color_features = np.mean(img_np, axis=(0, 1)) # Result: [Red, Green, Blue]
        
        all_results = []

        # 2. Run Prediction for EACH model
        for model_name, model_obj in MODELS.items():
            try:
                # Check how many features the model actually expects
                # Scikit-learn models usually have 'n_features_in_'
                n_required = getattr(model_obj, 'n_features_in_', None)
                
                prediction = None
                
                if n_required is not None:
                    # CASE A: Tabular Model (RandomForestClassifier/Regressor)
                    # We create a feature vector of the correct size
                    # We use the 3 color values and pad the rest with 0.5
                    input_data = np.full((1, n_required), 0.5)
                    for i in range(min(n_required, 3)):
                        input_data[0, i] = avg_color_features[i]
                    
                    prediction = model_obj.predict(input_data)
                else:
                    # CASE B: Potential Image Model (CNN)
                    # Add batch dimension to make it 4D: (1, 224, 224, 3)
                    input_data = np.expand_dims(img_np, axis=0)
                    prediction = model_obj.predict(input_data)

                # Determine label
                prediction_val = prediction[0]
                if hasattr(prediction_val, "__len__"): # Probability array
                    prediction_idx = int(np.argmax(prediction_val))
                else:
                    prediction_idx = int(prediction_val)
                
                # Get label from model.classes_ or default map
                classes = getattr(model_obj, 'classes_', DEFAULT_CLASS_NAMES)
                detected_label = str(classes[prediction_idx]) if prediction_idx < len(classes) else f"Class {prediction_idx}"
                
                details = SOIL_DATA_MAP.get(detected_label, {
                    "pH": "N/A", "NPK": "N/A", 
                    "organic_matter": "N/A", "recommendation": "Check model specifics."
                })

                all_results.append({
                    "model": model_name,
                    "prediction": detected_label,
                    "details": details
                })
            except Exception as inner_e:
                all_results.append({"model": model_name, "error": str(inner_e)})

        return jsonify({
            "status": "success",
            "results": all_results
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# Catch-all route for serving frontend files and handling direct page requests
@app.route('/<path:filename>')
def serve_any(filename):
    # 1. Normalize filename to handle spelling mismatch in URL (frontend vs frountend)
    normalized_filename = filename.replace('frontend/', f'{F_DIR}/').replace('frountend/', f'{F_DIR}/')

    # 2. Check direct path from root
    if os.path.isfile(os.path.join(BASE_DIR, filename)):
        return send_from_directory(BASE_DIR, filename)
    
    if os.path.isfile(os.path.join(BASE_DIR, normalized_filename)):
        return send_from_directory(BASE_DIR, normalized_filename)

    # 3. Handle root-relative requests (e.g., /scripts/login.js -> /frountend/scripts/login.js)
    # This is critical when serving login.html from the root / route
    if os.path.isfile(os.path.join(BASE_DIR, F_DIR, filename)):
        return send_from_directory(os.path.join(BASE_DIR, F_DIR), filename)

    # 4. Search inside specific subdirectories as a fallback
    for folder in [PAGES_DIR, SCRIPTS_DIR, ASSETS_DIR]:
        target_path = os.path.join(folder, filename.split('/')[-1])
        if os.path.isfile(target_path):
            return send_from_directory(folder, filename.split('/')[-1])
            
    return f"404: Resource '{filename}' not found. Checked in {F_DIR} and subfolders.", 404

if __name__ == '__main__':
    
    app.run(debug=True, host='0.0.0.0', port=DEFAULT_PORT)