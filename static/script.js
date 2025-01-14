// 📝 獲取所有使用 jQuery 和 Snap SVG 的 DOM 節點

var container = $('.container'); // 容器元素
var card = $('#card'); // 卡片元素
var innerSVG = Snap('#inner'); // 內部 SVG
var outerSVG = Snap('#outer'); // 外部 SVG
var backSVG = Snap('#back'); // 背景 SVG
var summary = $('#summary'); // 天氣摘要
var date = $('#date'); // 日期
var weatherContainer1 = Snap.select('#layer1'); // 天氣層 1
var weatherContainer2 = Snap.select('#layer2'); // 天氣層 2
var weatherContainer3 = Snap.select('#layer3'); // 天氣層 3
var innerRainHolder1 = weatherContainer1.group(); // 雨滴容器 1
var innerRainHolder2 = weatherContainer2.group(); // 雨滴容器 2
var innerRainHolder3 = weatherContainer3.group(); // 雨滴容器 3
var innerLeafHolder = weatherContainer1.group(); // 樹葉容器
var innerSnowHolder = weatherContainer1.group(); // 雪花容器
var innerLightningHolder = weatherContainer1.group(); // 閃電容器
var leafMask = outerSVG.rect(); // 樹葉遮罩
var leaf = Snap.select('#leaf'); // 樹葉元素
var sun = Snap.select('#sun'); // 太陽元素
var sunburst = Snap.select('#sunburst'); // 太陽光芒
var outerSplashHolder = outerSVG.group(); // 外部濺水容器
var outerLeafHolder = outerSVG.group(); // 外部樹葉容器
var outerSnowHolder = outerSVG.group(); // 外部雪花容器

var lightningTimeout; // 閃電計時器

// 設置樹葉遮罩
outerLeafHolder.attr({
	'clip-path': leafMask
});

// 建立尺寸對象，稍後會更新
var sizes = {
	container: { width: 0, height: 0 },
	card: { width: 0, height: 0 }
};

// 獲取雲朵群組
var clouds = [
	{ group: Snap.select('#cloud1') },
	{ group: Snap.select('#cloud2') },
	{ group: Snap.select('#cloud3') }
];

// 定義天氣類型 ☁️ 🌬 🌧 ⛈ ☀️
var weather = [
	{ type: 'snow', name: 'Snow' },
	{ type: 'wind', name: 'Wind' },
	{ type: 'rain', name: 'Rain' },
	{ type: 'thunder', name: 'Storm' },
	{ type: 'sun', name: 'Sun' },
	{ type: 'current', name: 'Current' }
];

// 🛠 應用程式設置
// 使用對象存放值以便使用 TweenMax 動畫
var settings = {
	windSpeed: 2, // 風速
	rainCount: 0, // 雨滴數量
	leafCount: 0, // 樹葉數量
	snowCount: 0, // 雪花數量
	cloudHeight: 100, // 雲層高度
	cloudSpace: 30, // 雲層間距
	cloudArch: 50, // 雲層弧度
	renewCheck: 10, // 更新頻率
	splashBounce: 80 // 濺水彈跳高度
};

var tickCount = 0; // 計時器
var rain = []; // 儲存雨滴
var leafs = []; // 儲存樹葉
var snow = []; // 儲存雪花

// ⚙ 初始化應用程式
init();

// 👁 監聽窗口調整大小事件
$(window).resize(onResize);

// 🏃 啟動動畫
requestAnimationFrame(tick);

function init() {
	onResize(); // 初始化尺寸調整
	
	// 🖱 綁定天氣按鈕事件
	for (var i = 0; i < weather.length; i++) {
		var w = weather[i];
		var b = $('#button-' + w.type); // 對應的按鈕
		w.button = b;
		b.bind('click', w, changeWeather); // 點擊按鈕改變天氣
	}
	
	// ☁️ 繪製雲朵
	for (var i = 0; i < clouds.length; i++) {
		clouds[i].offset = Math.random() * sizes.card.width; // 隨機初始化位置
		drawCloud(clouds[i], i);
	}
	
	// ☀️ 設定初始天氣
	TweenMax.set(sunburst.node, { opacity: 0 }); // 隱藏太陽光芒
	changeWeather(weather[0]); // 設置初始天氣為雪
}

function onResize() {
	// 📏 獲取窗口和卡片的尺寸
	sizes.container.width = container.width();
	sizes.container.height = container.height();
	sizes.card.width = card.width();
	sizes.card.height = card.height();
	sizes.card.offset = card.offset();
	
	// 📐 更新 SVG 尺寸
	innerSVG.attr({
		width: sizes.card.width,
		height: sizes.card.height
	});
	
	outerSVG.attr({
		width: sizes.container.width,
		height: sizes.container.height
	});
	
	backSVG.attr({
		width: sizes.container.width,
		height: sizes.container.height
	});
	
	// 更新太陽位置與旋轉動畫
	TweenMax.set(sunburst.node, {
		transformOrigin: "50% 50%",
		x: sizes.container.width / 2,
		y: (sizes.card.height / 2) + sizes.card.offset.top
	});
	TweenMax.fromTo(sunburst.node, 20, { rotation: 0 }, { rotation: 360, repeat: -1, ease: Power0.easeInOut });
	
	// 🍃 設置樹葉遮罩位置
	leafMask.attr({
		x: sizes.card.offset.left,
		y: 0,
		width: sizes.container.width - sizes.card.offset.left,
		height: sizes.container.height
	});
}

function drawCloud(cloud, i) {
	/*
	☁️ 繪製雲朵：
	我們希望雲的形狀可以循環，同時可以進行動畫效果。
	使用 Snap SVG 繪製帶有 4 部分的形狀：兩端和兩個弧形。
	*/
	
	var space = settings.cloudSpace * i;
	var height = space + settings.cloudHeight;
	var arch = height + settings.cloudArch + (Math.random() * settings.cloudArch);
	var width = sizes.card.width;
	
	var points = [];
	points.push('M' + [-(width), 0].join(','));
	points.push([width, 0].join(','));
	points.push('Q' + [width * 2, height / 2].join(','));
	points.push([width, height].join(','));
	points.push('Q' + [width * 0.5, arch].join(','));
	points.push([0, height].join(','));
	points.push('Q' + [width * -0.5, arch].join(','));
	points.push([-width, height].join(','));
	points.push('Q' + [- (width * 2), height / 2].join(','));
	points.push([-(width), 0].join(','));
	
	var path = points.join(' ');
	if (!cloud.path) cloud.path = cloud.group.path(); // 若未初始化則創建
	cloud.path.animate({ d: path }, 0); // 更新雲朵形狀
}

function makeRain() {
	// 💧 生成雨滴
	var lineWidth = Math.random() * 3; // 雨滴的線寬
	var lineLength = currentWeather.type == 'thunder' ? 35 : 14; // 雷雨模式下雨滴較長
	var x = Math.random() * (sizes.card.width - 40) + 20; // 隨機起始位置（20px 邊距）

	// 使用 Snap SVG 繪製雨滴
	var line = this['innerRainHolder' + (3 - Math.floor(lineWidth))].path('M0,0 0,' + lineLength).attr({
		fill: 'none',
		stroke: currentWeather.type == 'thunder' ? '#777' : '#0000ff', // 顏色根據天氣類型變化
		strokeWidth: lineWidth
	});
	
	rain.push(line); // 將雨滴加入陣列
	
	// 動畫：從卡片頂部降落到底部，完成後調用 onRainEnd
	TweenMax.fromTo(line.node, 1, { x: x, y: 0 - lineLength }, {
		delay: Math.random(),
		y: sizes.card.height,
		ease: Power2.easeIn,
		onComplete: onRainEnd,
		onCompleteParams: [line, lineWidth, x, currentWeather.type]
	});
}

function onRainEnd(line, width, x, type) {
	// 💧 雨滴到達底部，移除它
	line.remove();
	line = null;

	// 從陣列中刪除該雨滴
	for (var i in rain) {
		if (!rain[i].paper) rain.splice(i, 1);
	}

	// 若雨滴數量少於設定，生成更多雨滴
	if (rain.length < settings.rainCount) {
		makeRain();

		// 若雨滴較大，生成濺水效果
		if (width > 2) makeSplash(x, type);
	}
}

function makeSplash(x, type) {
	// 💦 生成濺水效果
	var splashLength = type == 'thunder' ? 30 : 20; // 濺水長度
	var splashBounce = type == 'thunder' ? 120 : 100; // 濺水最大彈跳高度
	var splashDistance = 80; // 濺水移動距離
	var speed = type == 'thunder' ? 0.7 : 0.5; // 濺水動畫速度
	var splashUp = 0 - (Math.random() * splashBounce); // 隨機彈跳高度
	var randomX = ((Math.random() * splashDistance) - (splashDistance / 2)); // 隨機水花偏移量

	// 繪製濺水路徑
	var points = [];
	points.push('M' + 0 + ',' + 0);
	points.push('Q' + randomX + ',' + splashUp);
	points.push((randomX * 2) + ',' + splashDistance);

	// 使用 Snap SVG 繪製濺水線條
	var splash = outerSplashHolder.path(points.join(' ')).attr({
		fill: "none",
		stroke: type == 'thunder' ? '#777' : '#0000ff',
		strokeWidth: 1
	});

	// 動畫：控制濺水的運行軌跡
	var pathLength = Snap.path.getTotalLength(splash);
	var xOffset = sizes.card.offset.left;
	var yOffset = sizes.card.offset.top + sizes.card.height;
	splash.node.style.strokeDasharray = splashLength + ' ' + pathLength;

	TweenMax.fromTo(splash.node, speed, {
		strokeWidth: 2,
		y: yOffset,
		x: xOffset + 20 + x,
		opacity: 1,
		strokeDashoffset: splashLength
	}, {
		strokeWidth: 0,
		strokeDashoffset: -pathLength,
		opacity: 1,
		onComplete: onSplashComplete,
		onCompleteParams: [splash],
		ease: SlowMo.ease.config(0.4, 0.1, false)
	});
}

function onSplashComplete(splash) {
	// 💦 移除濺水效果
	splash.remove();
	splash = null;
}

function makeLeaf() {
	// 🍃 生成樹葉
	var scale = 0.5 + (Math.random() * 0.5); // 樹葉大小比例
	var newLeaf;
	var areaY = sizes.card.height / 2;
	var y = areaY + (Math.random() * areaY); // 隨機起始高度
	var endY = y - ((Math.random() * (areaY * 2)) - areaY); // 隨機結束高度
	var x, endX, xBezier;
	var colors = ['#76993E', '#4A5E23', '#6D632F']; // 樹葉顏色
	var color = colors[Math.floor(Math.random() * colors.length)];

	// 根據大小選擇內部或外部樹葉容器
	if (scale > 0.8) {
		newLeaf = leaf.clone().appendTo(outerLeafHolder).attr({ fill: color });
		y = y + sizes.card.offset.top / 2;
		endY = endY + sizes.card.offset.top / 2;
		x = sizes.card.offset.left - 100;
		xBezier = x + (sizes.container.width - sizes.card.offset.left) / 2;
		endX = sizes.container.width + 50;
	} else {
		newLeaf = leaf.clone().appendTo(innerLeafHolder).attr({ fill: color });
		x = -100;
		xBezier = sizes.card.width / 2;
		endX = sizes.card.width + 50;
	}

	leafs.push(newLeaf); // 將樹葉加入陣列

	// 動畫：貝茲曲線模擬樹葉飄落
	var bezier = [{ x: x, y: y }, { x: xBezier, y: (Math.random() * endY) + (endY / 3) }, { x: endX, y: endY }];
	TweenMax.fromTo(newLeaf.node, 2, {
		rotation: Math.random() * 180,
		x: x,
		y: y,
		scale: scale
	}, {
		rotation: Math.random() * 360,
		bezier: bezier,
		onComplete: onLeafEnd,
		onCompleteParams: [newLeaf],
		ease: Power0.easeIn
	});
}

function onLeafEnd(leaf) {
	// 🍃 移除樹葉
	leaf.remove();
	leaf = null;

	// 從陣列中刪除樹葉
	for (var i in leafs) {
		if (!leafs[i].paper) leafs.splice(i, 1);
	}

	// 若樹葉數量少於設定值，生成更多
	if (leafs.length < settings.leafCount) {
		makeLeaf();
	}
}


function makeSnow() {
	// ❄️ 生成雪花
	var scale = 0.5 + (Math.random() * 0.5); // 雪花大小比例
	var newSnow;
	var x = 20 + (Math.random() * (sizes.card.width - 40)); // 隨機起始水平位置
	var endY; // 結束垂直位置
	var y = -10; // 起始垂直位置

	// 根據大小選擇內部或外部雪花容器
	if (scale > 0.8) {
		newSnow = outerSnowHolder.circle(0, 0, 5).attr({ fill: 'white' });
		endY = sizes.container.height + 10;
		y = sizes.card.offset.top + settings.cloudHeight;
		x = x + sizes.card.offset.left;
	} else {
		newSnow = innerSnowHolder.circle(0, 0, 5).attr({ fill: 'white' });
		endY = sizes.card.height + 10;
	}

	snow.push(newSnow); // 將雪花加入陣列

	// 動畫：雪花下落
	TweenMax.fromTo(newSnow.node, 3 + (Math.random() * 5), {
		x: x,
		y: y
	}, {
		y: endY,
		onComplete: onSnowEnd,
		onCompleteParams: [newSnow],
		ease: Power0.easeIn
	});

	// 動畫：雪花擴大
	TweenMax.fromTo(newSnow.node, 1, {
		scale: 0
	}, {
		scale: scale,
		ease: Power1.easeInOut
	});

	// 動畫：雪花水平搖擺
	TweenMax.to(newSnow.node, 3, {
		x: x + ((Math.random() * 150) - 75),
		repeat: -1,
		yoyo: true,
		ease: Power1.easeInOut
	});
}

function onSnowEnd(flake) {
	// ❄️ 移除雪花
	flake.remove();
	flake = null;

	// 從陣列中刪除雪花
	for (var i in snow) {
		if (!snow[i].paper) snow.splice(i, 1);
	}

	// 若雪花數量少於設定值，生成更多
	if (snow.length < settings.snowCount) {
		makeSnow();
	}
}

function tick() {
	// ⏰ 每一幀的更新處理
	tickCount++;
	var check = tickCount % settings.renewCheck;

	if (check) {
		// 檢查是否需要補充雨滴、樹葉或雪花
		if (rain.length < settings.rainCount) makeRain();
		if (leafs.length < settings.leafCount) makeLeaf();
		if (snow.length < settings.snowCount) makeSnow();
	}

	// 更新雲朵的位置
	for (var i = 0; i < clouds.length; i++) {
		if (currentWeather.type == 'sun') {
			// 在晴天中，雲朵向右移動
			if (clouds[i].offset > -(sizes.card.width * 1.5)) clouds[i].offset += settings.windSpeed / (i + 1);
			if (clouds[i].offset > sizes.card.width * 2.5) clouds[i].offset = -(sizes.card.width * 1.5);
			clouds[i].group.transform('t' + clouds[i].offset + ',' + 0);
		} else {
			// 其他天氣下，雲朵循環移動
			clouds[i].offset += settings.windSpeed / (i + 1);
			if (clouds[i].offset > sizes.card.width) clouds[i].offset = 0 + (clouds[i].offset - sizes.card.width);
			clouds[i].group.transform('t' + clouds[i].offset + ',' + 0);
		}
	}

	// 繼續下一幀
	requestAnimationFrame(tick);
}

function reset() {
	// 重置所有天氣類型樣式
	for (var i = 0; i < weather.length; i++) {
		container.removeClass(weather[i].type);
		weather[i].button.removeClass('active');
	}
}

function updateSummaryText() {
	// 更新天氣摘要文字
	summary.html(currentWeather.name);
	TweenMax.fromTo(summary, 1.5, { x: 30 }, { opacity: 1, x: 0, ease: Power4.easeOut });
}

function startLightningTimer() {
	// 開始閃電計時器
	if (lightningTimeout) clearTimeout(lightningTimeout);
	if (currentWeather.type == 'thunder') {
		lightningTimeout = setTimeout(lightning, Math.random() * 6000);
	}
}

function lightning() {
	// ⚡ 生成閃電效果
	startLightningTimer();
	TweenMax.fromTo(card, 0.75, { y: -30 }, { y: 0, ease: Elastic.easeOut });

	var pathX = 30 + Math.random() * (sizes.card.width - 60);
	var yOffset = 20;
	var steps = 20;
	var points = [pathX + ',0'];
	for (var i = 0; i < steps; i++) {
		var x = pathX + (Math.random() * yOffset - (yOffset / 2));
		var y = (sizes.card.height / steps) * (i + 1);
		points.push(x + ',' + y);
	}

	var strike = weatherContainer1.path('M' + points.join(' ')).attr({
		fill: 'none',
		stroke: 'white',
		strokeWidth: 2 + Math.random()
	});

	TweenMax.to(strike.node, 1, {
		opacity: 0,
		ease: Power4.easeOut,
		onComplete: function () {
			strike.remove();
			strike = null;
		}
	});
}


function changeWeather(weather) {
	// 從 GET 數據中提取天氣對象（如果存在）
	if (weather.data) weather = weather.data;


	// 重置所有天氣樣式
	reset();

	// 設定當前天氣
	currentWeather = weather;

	// 停止當前動畫並更新摘要
	TweenMax.killTweensOf(summary);
	TweenMax.to(summary, 1, { opacity: 0, x: -30, onComplete: updateSummaryText, ease: Power4.easeIn });

	// 更新容器樣式
	container.addClass(weather.type);

	// 統一動畫參數
	const animations = {
		windSpeed: 0.5,
		rainCount: 0,
		leafCount: 0,
		snowCount: 0,
		sunPosition: { x: sizes.card.width / 2, y: -100 },
		sunburst: { scale: 0.4, opacity: 0, y: (sizes.container.height / 2) - 50 }
	};

	// 根據天氣類型設置動畫
	switch (weather.type) {
		case 'wind':
			animations.windSpeed = 3;
			animations.leafCount = 5;
			break;
		case 'sun':
			animations.windSpeed = 20;
			animations.sunPosition = { x: sizes.card.width / 2, y: sizes.card.height / 2 };
			animations.sunburst = { scale: 1, opacity: 0.8, y: (sizes.card.height / 2) + sizes.card.offset.top };
			break;
		case 'rain':
			animations.rainCount = 10;
			break;
		case 'thunder':
			animations.rainCount = 60;
			animations.windSpeed = 5;
			startLightningTimer(); // 啟動閃電
			break;
		case 'snow':
			animations.snowCount = 40;
			break;
		default:
			break;
	}

	// 應用動畫效果
	TweenMax.to(settings, 3, { 
		windSpeed: animations.windSpeed,
		rainCount: animations.rainCount,
		leafCount: animations.leafCount,
		snowCount: animations.snowCount,
		ease: Power2.easeInOut 
	});

	// 太陽動畫
	TweenMax.to(sun.node, 4, {
		x: animations.sunPosition.x,
		y: animations.sunPosition.y,
		ease: Power2.easeInOut
	});
	TweenMax.to(sunburst.node, 4, {
		scale: animations.sunburst.scale,
		opacity: animations.sunburst.opacity,
		y: animations.sunburst.y,
		ease: Power2.easeInOut
	});
}


let weatherUpdateInterval = null; // 保存定時器的變數

// 定義 GET 請求的函數
function fetchWeatherData(callback) {
	$('#summary').text('載入中...'); // 顯示載入提示
	$.ajax({
		url: "/weather",
		method: "GET",
		success: function (data) {
			if (data.error) {
				console.error("Failed to fetch weather data:", data.error);
				$('#summary').text('天氣數據加載失敗');
				return;
			}

			// 更新天氣卡片
			updateWeatherCard(data);

			// 如果有回調，執行回調，將天氣數據傳遞給外部處理
			if (callback) callback(data);
		},
		error: function (xhr, status, error) {
			console.error("Error fetching weather data:", error);
			$('#summary').text('無法獲取天氣數據，請稍後重試');
		}
	});
}



// 天氣對應字典
const weather_dict = {
	'晴': 'Sun',
	'多雲': 'Wind',
	'陰': 'Wind',
	'短暫陣雨或雷雨': 'Storm',
	'短暫雨': 'Rain',
	'短暫陣雨': 'Rain',
	'雨': 'Rain',
	'雷雨': 'Storm',
	'雪': 'Snow',
	'-99': 'Sun' // 無數據默認為晴天
};

// 動畫類型對應
const weatherMapping = {
	'Sun': 'sun',
	'Wind': 'wind',
	'Rain': 'rain',
	'Storm': 'thunder',
	'Snow': 'snow'
};

// 更新天氣卡片內容
function updateWeatherCard(data) {
	const { station, temperature, time, weather } = data;

	// 更新天氣卡片內容
	$('.temp').html(`${temperature}<span>°C</span>`); // 更新溫度
	$('#summary').text(weather); // 更新摘要
	$('#date').html(`${station} <br> ${time}`); // 使用 <br> 实现换行


	// 獲取對應的動畫類型
	const weatherType = weather_dict[weather] || 'Sun'; // 默認為晴天
	const animationType = weatherMapping[weatherType] || 'sun';

	// 切換動畫
	changeWeather({ type: animationType, name: weather });
}



// 點擊「Current」按鈕事件
$('#button-current').on('click', function () {
	// 發送 GET 請求
	fetchWeatherData(function (data) {
		// 映射返回的天氣名稱到動畫類型
		const weatherType = weather_dict[data.weather] || 'Sun'; // 默認為晴天
		const animationType = weatherMapping[weatherType] || 'sun';

		// 設置 Current 的名稱和動畫
		changeWeather({ type: animationType, name: data.weather });

		// 標記「Current」按鈕為激活狀態，並重置其他按鈕
		$('.weather-button').removeClass('active');
		$('#button-current').addClass('active'); // 使用返回的天氣名稱更新按鈕文字
	});
});




