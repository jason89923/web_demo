from flask import Flask, jsonify, send_from_directory
import requests
import os
import datetime
import pytz
from dotenv import load_dotenv

# 載入 .env 檔案
load_dotenv()
Authorization = os.getenv('Authorization')

app = Flask(__name__)
port = 5000

weather_dict = {
    '晴': 'Sunny',
    '多雲': 'Cloudy',
    '陰': 'Overcast',
    '短暫陣雨或雷雨': 'Thunderstorm',
    '短暫雨': 'Rain',
    '短暫陣雨': 'Shower',
    '雨': 'Rain',
    '雷雨': 'Thunderstorm',
    '雪': 'Snow',
    '-99': 'No data'
}

def CWA_API():
    try:
        url = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001'
        params = {
            'Authorization': Authorization,
        }

        response = requests.get(url, params=params)
        response.raise_for_status()

        data = response.json()
        return data
    except Exception as e:
        print('Error fetching weather data:', e)
        return {'success': False}

def get_weather_data(data, StationName, StationId):
    WeatherElement = data.get('records', {}).get('Station', [])
    WeatherElement = [x for x in WeatherElement if x.get('StationName') == StationName and x.get('StationId') == StationId]
    
    weather = WeatherElement[0]['WeatherElement']['Weather']
    temperature = WeatherElement[0]['WeatherElement']['AirTemperature']
    
    tz = pytz.timezone('Asia/Taipei') # 將時區改為台北時區(GMT +8)
    time = datetime.datetime.now(tz)
    
    weather = weather_dict.get(weather, 'Unknown')
    
    return {
        'station': StationName,
        'time': time.strftime('%Y-%m-%d %H:%M:%S'),
        'weather': weather,
        'temperature': temperature
    }

@app.route('/weather', methods=['GET'])
def get_weather():
    try:
        data = CWA_API() # 取得中央氣象局的氣象資料
        res_data = {}

        if not data.get('success', True):
            raise Exception('Failed to fetch weather data')
        else:
            # 找到中壢的天氣資訊
            StationName = "中壢"
            StationId = "C0C700"
            
            res_data.update(get_weather_data(data, StationName, StationId))

        print(res_data) # 印出天氣資訊
        return jsonify(res_data)

    except Exception as e:
        print('Error fetching weather data:', e)
        return jsonify({'error': 'Failed to fetch weather data'}), 500

@app.route('/all', methods=['GET'])
def get_all():
    try:
        url = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001'
        params = {
            'Authorization': 'CWA-7F6C6759-B089-4D98-9D62-AAB80673B9D6',
        }

        response = requests.get(url, params=params)
        response.raise_for_status()

        data = response.json()
        return jsonify(data)
        
    except Exception as e:
        print('Error fetching weather data:', e)
        return jsonify({'error': 'Failed to fetch weather data'}), 500
          
@app.route('/index', methods=['GET'])
def home():
    return 'Hello, this is your API!'

@app.route('/')
def serve_index():
    return send_from_directory(os.path.join(app.root_path, 'templates'), 'index.html')

if __name__ == '__main__':
    app.run(host='localhost', port=port)
