from flask import Flask, jsonify
import requests

app = Flask(__name__)
port = 5000

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

        if not data.get('success', True):
            raise Exception('Failed to fetch weather data')
        else:
            print('Weather data fetched successfully')
            # 假設需要使用特定的站點資料
            StationName = "中壢"
            StationId = "C0C700"
            WeatherElement = data.get('records', {}).get('Station', [])
            
            WeatherElement = [x for x in WeatherElement if x.get('StationName') == StationName]
            print(WeatherElement)

        return jsonify(data)

    except Exception as e:
        print('Error fetching weather data:', e)
        return jsonify({'error': 'Failed to fetch weather data'}), 500

@app.route('/home', methods=['GET'])
def home():
    return 'Hello, this is your API!'

if __name__ == '__main__':
    app.run(host='localhost', port=port)
