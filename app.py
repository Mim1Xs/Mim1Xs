# app.py
import os
import random
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, jsonify
from werkzeug.utils import secure_filename
from models import db, Track

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///music.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'static', 'audio')
app.config['MAX_CONTENT_LENGTH'] = 30 * 1024 * 1024

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

db.init_app(app)

# Функция авто-добавления треков из папки (работает при каждом старте)
def seed_tracks_from_files():
    audio_dir = app.config['UPLOAD_FOLDER']
    for filename in os.listdir(audio_dir):
        if filename.lower().endswith(('.mp3', '.wav', '.ogg')):
            exists = Track.query.filter_by(audio_file=filename).first()
            if not exists:
                name_part = os.path.splitext(filename)[0].replace('_', ' ')
                # Пытаемся распарсить "Исполнитель - Название"
                if ' - ' in name_part:
                    artist, title = name_part.split(' - ', 1)
                else:
                    artist = 'Mim1Ks' # Дефолтный автор
                    title = name_part
                
                new_track = Track(title=title, artist=artist, audio_file=filename)
                db.session.add(new_track)
    db.session.commit()

with app.app_context():
    db.create_all()
    seed_tracks_from_files()

@app.route('/')
def start():
    return render_template('start.html')

@app.route('/music')
def music():
    tracks = Track.query.filter(Track.audio_file.isnot(None)).all()
    return render_template('player.html', tracks=tracks)

# Твой старый маршрут для случайного трека (мы его вернули!)
@app.route('/api/random_track')
def random_track():
    tracks = Track.query.filter(Track.audio_file.isnot(None)).all()
    if not tracks:
        return jsonify({'error': 'No tracks'}), 404
    track = random.choice(tracks)
    return jsonify({
        'id': track.id,
        'title': track.title,
        'artist': track.artist,
        'cover_url': track.cover_url if track.cover_url else '',
        'audio_url': url_for('audio', filename=track.audio_file)
    })

@app.route('/api/tracks')
def api_tracks():
    tracks = Track.query.filter(Track.audio_file.isnot(None)).all()
    data = []
    for t in tracks:
        data.append({
            'id': t.id,
            'title': t.title,
            'artist': t.artist,
            'audio_url': url_for('audio', filename=t.audio_file)
        })
    return jsonify(data)

# Админка: добавление + список треков с кнопками
@app.route('/F330fbb7', methods=['GET', 'POST'])
def add_track():
    if request.method == 'POST':
        title = request.form['title']
        artist = request.form['artist']
        cover_url = request.form.get('cover_url', '')
        description = request.form.get('description', '')

        audio_file = None
        if 'audio_file' in request.files:
            file = request.files['audio_file']
            if file.filename != '':
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                audio_file = filename
        
        # Если файл не загружали, но написали имя вручную
        if not audio_file:
            audio_file = request.form.get('audio_file_name')

        new_track = Track(
            title=title,
            artist=artist,
            cover_url=cover_url,
            description=description,
            audio_file=audio_file
        )
        db.session.add(new_track)
        db.session.commit()
        return redirect(url_for('add_track'))
        
    # Передаем все треки в шаблон для отображения таблицы
    all_tracks = Track.query.all()
    return render_template('add_track.html', tracks=all_tracks)

# Маршрут для редактирования
@app.route('/edit_track/<int:id>', methods=['GET', 'POST'])
def edit_track(id):
    track = Track.query.get_or_404(id)
    if request.method == 'POST':
        track.title = request.form['title']
        track.artist = request.form['artist']
        track.cover_url = request.form.get('cover_url', '')
        track.description = request.form.get('description', '')
        
        # Если загрузили новый файл
        file = request.files.get('audio_file')
        if file and file.filename != '':
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            track.audio_file = filename

        db.session.commit()
        return redirect(url_for('add_track'))
    return render_template('edit_track.html', track=track)

# Маршрут для удаления
@app.route('/delete_track/<int:id>', methods=['POST'])
def delete_track(id):
    track = Track.query.get_or_404(id)
    db.session.delete(track)
    db.session.commit()
    return redirect(url_for('add_track'))

@app.route('/audio/<filename>')
def audio(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)
