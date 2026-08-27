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

# Функция для автоматического добавления файлов из папки audio в базу
def seed_tracks_from_files():
    audio_dir = app.config['UPLOAD_FOLDER']
    if not os.path.exists(audio_dir):
        return
    
    for filename in os.listdir(audio_dir):
        if filename.lower().endswith(('.mp3', '.wav', '.ogg')):
            # Проверяем, есть ли уже такой файл в базе
            exists = Track.query.filter_by(audio_file=filename).first()
            if not exists:
                # Если нет - создаем запись. Название берем из имени файла (убираем .mp3 и заменяем _ на пробел)
                track_title = os.path.splitext(filename)[0].replace('_', ' ')
                new_track = Track(
                    title=track_title,
                    artist='Unknown Artist',  # Можно поменять на 'Mim1Ks' или оставить пустым
                    audio_file=filename
                )
                db.session.add(new_track)
    
    db.session.commit()

with app.app_context():
    db.create_all()
    # Вызываем нашу функцию при запуске
    seed_tracks_from_files()


@app.route('/')
def start():
    return render_template('start.html')


@app.route('/music')
def music():
    tracks = Track.query.filter(Track.audio_file.isnot(None)).all()
    return render_template('player.html', tracks=tracks)


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


@app.route('/F330fbb7', methods=['GET', 'POST'])
def add_track():
    if request.method == 'POST':
        title = request.form['title']
        artist = request.form['artist']
        genre = request.form.get('genre', 'unknown')
        cover_url = request.form.get('cover_url', '')
        embed_code = request.form.get('embed_code', '')
        description = request.form.get('description', '')

        audio_file = None
        if 'audio_file' in request.files:
            file = request.files['audio_file']
            if file.filename != '':
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                audio_file = filename

        new_track = Track(
            title=title,
            artist=artist,
            genre=genre,
            cover_url=cover_url,
            embed_code=embed_code,
            description=description,
            audio_file=audio_file
        )
        db.session.add(new_track)
        db.session.commit()
        return redirect(url_for('music'))

    # Получаем все треки для отображения в списке
    tracks = Track.query.all()
    return render_template('add_track.html', tracks=tracks)


@app.route('/delete_track/<int:id>', methods=['POST'])
def delete_track(id):
    track = Track.query.get_or_404(id)
    # Удаляем файл с диска, если он есть
    if track.audio_file:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], track.audio_file)
        if os.path.exists(file_path):
            os.remove(file_path)
    db.session.delete(track)
    db.session.commit()
    return redirect(url_for('add_track'))


@app.route('/audio/<filename>')
def audio(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)  # Изменено для хостинга
