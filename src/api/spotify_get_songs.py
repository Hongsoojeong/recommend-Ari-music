import spotipy
from spotipy.oauth2 import SpotifyOAuth
import pprint
import sys
import requests
import base64
import json
import logging

cid = '{client id}'
secret = '{secret key}'
redirect_uri = 'http://127.0.0.1:8000/callback'

sp = spotipy.Spotify(auth_manager=SpotifyOAuth(client_id=cid, client_secret=secret, redirect_uri=redirect_uri))

def get_headers(client_id, client_secret):
    endpoint = "https://accounts.spotify.com/api/token"
    encoded = base64.b64encode("{}:{}".format(client_id, client_secret).encode('utf-8')).decode('ascii')
    payload = {
        "grant_type": "client_credentials"
    }
    headers = {"Authorization": "Basic {}".format(encoded)}
    r = requests.post(endpoint, data=payload, headers=headers)
    access_token = json.loads(r.text)['access_token']
    headers = {
        "Authorization": "Bearer {}".format(access_token)
    }
    return headers


def get_songs(artist_id):
    result = []
    # 아티스트의 앨범 정보 가져오기
    albums = sp.artist_albums(artist_id, album_type='album', limit=50)
    
    # 각 앨범의 트랙 정보까지 가져오기
    artist_albums_tracks = []
    for album in albums['items']:
        album_full = sp.album(album['id'])  # 앨범의 전체 정보 (트랙 포함 X)
        tracks = sp.album_tracks(album['id'])['items']
    
        for track in tracks:
            track_data = {
                "album": {
                    "album_type": album_full['album_type'],
                    "artists": album_full['artists'],
                    "external_urls": album_full['external_urls'],
                    "href": album_full['href'],
                    "id": album_full['id'],
                    "images": album_full['images'],
                    "is_playable": True,
                    "name": album_full['name'],
                    "release_date": album_full['release_date'],
                    "release_date_precision": album_full['release_date_precision'],
                    "total_tracks": album_full['total_tracks'],
                    "type": album_full['type'],
                    "uri": album_full['uri'],
                    "hashtags": ["#"]  # 수동으로 매핑
                },
                "artists": track['artists'],
                "disc_number": track['disc_number'],
                "duration_ms": track['duration_ms'],
                "explicit": track['explicit'],
                "external_ids": track.get('external_ids', {}),
                "external_urls": track['external_urls'],
                "href": track['href'],
                "id": track['id'],
                "is_local": track['is_local'],
                "is_playable": True,
                "name": track['name'],
                "popularity": sp.track(track['id'])['popularity'],
                "preview_url": track['preview_url'],
                "track_number": track['track_number'],
                "type": track['type'],
                "uri": track['uri'],
                "youtubeVideoId": None   # 수동으로 매핑
            }

            result.append(track_data)
    return result

result = get_songs("66CXWjxzNUsdJxJ2JdwvnR")
with open("aritst_other_songs.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=4)