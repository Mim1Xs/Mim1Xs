# models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Track(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    genre = db.Column(db.String(100), nullable=True)      # теперь может быть пустым
    cover_url = db.Column(db.String(500), nullable=True)
    embed_code = db.Column(db.Text, nullable=True)
    audio_file = db.Column(db.String(300), nullable=True)
    description = db.Column(db.Text, nullable=True)
    date_added = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Track {self.title}>'