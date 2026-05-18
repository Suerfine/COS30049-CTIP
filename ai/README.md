# How to Run the AI Server

1. Install Dependencies
pip install -r requirements.txt

2. Start the server
cd ai
uvicorn server:app --host 0.0.0.0 --port 8000 --reload 