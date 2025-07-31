import json
import os

# 파일 경로
existing_path = "./api/filter-data/existing_data.json"
new_path = "./api/filter-data/add_data.json"
output_path = "./api/filter-data/unique_tracks.json"

# 파일이 존재하는지 체크 후 로드
def load_data(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

# JSON 로딩
existing_data = load_data(existing_path)
new_data = load_data(new_path)

# 새로운 트랙 중 중복되지 않는 항목만 필터링
existing_ids = {track.get('id') for track in existing_data if 'id' in track}
unique_new_tracks = [track for track in new_data if track.get('id') not in existing_ids]

# ✅ 리스트끼리 합치기
merged_tracks = existing_data + unique_new_tracks

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(merged_tracks, f, ensure_ascii=False, indent=4)
