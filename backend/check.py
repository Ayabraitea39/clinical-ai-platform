from app.database import engine 
from sqlalchemy import inspect, text 
insp = inspect(engine) 
print('chat_messages exists:', 'chat_messages' in insp.get_table_names()) 
 
with engine.connect() as conn: 
    try: 
        count = conn.execute(text('SELECT COUNT(*) FROM chat_messages')).scalar() 
        print('Row count:', count) 
    except Exception as e: 
        print('Could not query:', e) 
