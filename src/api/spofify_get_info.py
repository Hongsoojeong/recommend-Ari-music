import spotipy
from spotipy.oauth2 import SpotifyOAuth
import requests
import base64
import json

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


def get_artist(clicent_id, client_secret, artist_id):
    endpoint = f"https://api.spotify.com/v1/artists/{artist_id}"
    headers = get_headers(clicent_id, client_secret)
    data = (requests.get(endpoint, headers=headers)).json()
    with open("artist_info.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)    

def get_popular(clicent_id, client_secret, artist_id):
    endpoint = f"https://api.spotify.com/v1/artists/{artist_id}/top-tracks"
    headers = get_headers(clicent_id, client_secret)
    data = (requests.get(endpoint, headers=headers)).json()
    
    # 🔥 여기서 available_markets 제거
    for track in data.get("tracks", []):
        track.pop("available_markets", None)  # 트랙 레벨
        if "album" in track:
            track["album"].pop("available_markets", None)  # 앨범 레벨
            
    with open("artist_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

artist_id = "66CXWjxzNUsdJxJ2JdwvnR" # Ari
get_artist(cid, secret, artist_id)
get_popular(cid, secret, artist_id)
    

