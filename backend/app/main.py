from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI(title="Clinical AI Assistant Platform")

@app.get("/", response_class=HTMLResponse)
def home():
    return """
    <html>
        <body style="font-family: sans-serif; text-align: center; margin-top: 100px;">
            <h1>✅ Backend is running</h1>
            <p>FastAPI is working correctly.</p>
        </body>
    </html>
    """

@app.get("/health")
def health():
    return {"status": "ok"}