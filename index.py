from flask import Flask, jsonify, send_from_directory
import requests
import os
import datetime
import pytz

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

@app.route('/weather', methods=['GET'])
def get_weather():
    try:
        url = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001'
        params = {
            'Authorization': 'CWA-7F6C6759-B089-4D98-9D62-AAB80673B9D6',
        }

        response = requests.get(url, params=params)
        response.raise_for_status()

        data = response.json()
        res_data = {}

        if not data.get('success', True):
            raise Exception('Failed to fetch weather data')
        else:
            print('Weather data fetched successfully')
            # 假設需要使用特定的站點資料
            StationName = "中壢"
            StationId = "C0C700"
            WeatherElement = data.get('records', {}).get('Station', [])

            WeatherElement = [x for x in WeatherElement if x.get('StationName') == StationName and x.get('StationId') == StationId]
            weather = WeatherElement[0]['WeatherElement']['Weather']
            temperature = WeatherElement[0]['WeatherElement']['AirTemperature']
            tz = pytz.timezone('Asia/Taipei')
            time = datetime.datetime.now(tz)  # 獲取當前時間並設置時區
            
            weather = weather_dict.get(weather, 'Unknown')
              
            res_data.update({
                'station': StationName,
                'time': time.strftime('%Y-%m-%d %H:%M:%S'),
                'weather': weather,
                'temperature': temperature
            })

        print(res_data)
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
