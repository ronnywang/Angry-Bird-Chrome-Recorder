/*
javascript: var js = document.createElement('script'); js.src = 'http://ronny.tw/abr/abr.js?v=' + Math.random(); document.getElementsByTagName('head')[0].appendChild(js); 
*/

var angryBirdLogger = angryBirdLogger || {
    first: true
    ,event_records: []
    ,record_started: false
};

(function(angryBirdLogger, window, document){
    var uniqid = function(length){
	var str = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
	var ret = '';
	for (var i = 0; i < length; i ++) {
	    ret += str[Math.floor(Math.random() * str.length)];
	}
	return ret;
    };

    var canvas = document.getElementsByTagName('canvas')[0];

    if (angryBirdLogger.first) {
	angryBirdLogger.first = false;
	canvas.addEventListener('mousedown', function(e){ angryBirdLogger.mouseDownEvent(e); });
	canvas.addEventListener('mouseup', function(e){ angryBirdLogger.mouseUpEvent(e); });
	canvas.addEventListener('mousemove', function(e){ angryBirdLogger.mouseMoveEvent(e); });
    }

    if ('undefined' === typeof(angryBirdLogger.panelDom)) {
	angryBirdLogger.panelDom = document.createElement('div');
	document.getElementsByTagName('body')[0].appendChild(angryBirdLogger.panelDom);
    }

    var panelDom = angryBirdLogger.panelDom;
    
    panelDom.style.position = 'absolute';
    panelDom.style.top = '0px';
    panelDom.style.left = '0px';
    panelDom.innerHTML = '';

    var funcReplayBtn = angryBirdLogger.funcReplayBtn = document.createElement('button');
    var funcRecordBtn = angryBirdLogger.funcRecordBtn = document.createElement('button');
    var funcUploadBtn = angryBirdLogger.funcUploadBtn = document.createElement('button');
    var funcImportBtn = angryBirdLogger.funcImportBtn = document.createElement('button');

    // Record Button
    funcRecordBtn.innerHTML = 'RECORD START';
    funcRecordBtn.addEventListener('click', function(e){
	if (angryBirdLogger.record_started) {
	    angryBirdLogger.record_started = false;
	    funcRecordBtn.innerHTML = 'RECORD START';
	    funcReplayBtn.disabled = '';
	    funcUploadBtn.disabled = '';
	} else {
	    angryBirdLogger.event_records = [];
	    angryBirdLogger.record_started = true;
	    funcRecordBtn.innerHTML = 'RECORD END';
	    funcReplayBtn.disabled = 'disabled';
	    funcUploadBtn.disabled = 'disabled';
	}
	return false;
    });
    panelDom.appendChild(funcRecordBtn);
    panelDom.appendChild(document.createElement('br'));

    // Replay Button
    funcReplayBtn.innerHTML = 'REPLAY';
    if (angryBirdLogger.event_records.length == 0) {
	funcReplayBtn.disabled = 'disabled';
    }
    funcReplayBtn.addEventListener('click', function(e){
	funcReplayBtn.disabled = 'disabled';
	funcReplayBtn.innerHTML = 'PLAYING...';
	funcRecordBtn.disabled = 'disabled';
	var i = 0;
	var replayStart = new Date().valueOf();
	var timeStart = angryBirdLogger.event_records[0].time;
	var timeLoop = function(){
	    var now = new Date().valueOf();
	    var record;
	    var data;
	    var event;
	    for (; i < angryBirdLogger.event_records.length; i ++) {
		record = angryBirdLogger.event_records[i];

		if (((now - replayStart) - (record.time - timeStart)) >= 0) {
		    // object.initMouseEvent (eventName, bubbles, cancelable, view, detail, screenX, screenY, clientX, clientY, ctrlKey, altKey, shiftKey, metaKey, button, relatedTarget);
		    data = record.event_data;
		    event = document.createEvent('MouseEvent');
		    event.initMouseEvent(record.type, data.bubbles, data.cancelable, window, data.detail, data.screenX, data.screenY, data.clientX, data.clientY, data.ctrlKey, data.altKey, data.shiftKey, data.metaKey, data.button, null);
		    canvas.dispatchEvent(event);
		    continue;
		}
		setTimeout(timeLoop, 10);
		break;
	    }

	    if (i == angryBirdLogger.event_records.length) {
		funcReplayBtn.disabled = '';
		funcReplayBtn.innerHTML = 'REPLAY';
		funcRecordBtn.disabled = '';
	    }
	};

	setTimeout(timeLoop, 10);
	return false;
    });
    panelDom.appendChild(funcReplayBtn);
    panelDom.appendChild(document.createElement('br'));

    // Upload Button
    funcUploadBtn.innerHTML = 'Upload Replay';
    if (angryBirdLogger.event_records.length == 0) {
	funcUploadBtn.disabled = 'disabled';
    }
    funcUploadBtn.addEventListener('click', function(e){
	var key = uniqid(30);
	var url = 'http://api.openkeyval.org/AngryBirdChromeRecorder-' + key;
	var http = new XMLHttpRequest();
	var params = "data=" + encodeURIComponent(JSON.stringify(angryBirdLogger.event_records));
	http.open("POST", url, true);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	// TODO: 有可能會失敗
	http.send(params);
	alert('Your replay id is ' + key);
	
	return false;
    });
    panelDom.appendChild(funcUploadBtn);
    panelDom.appendChild(document.createElement('br'));

    // Import Button
    funcImportBtn.innerHTML = 'Import Replay';
    funcImportBtn.addEventListener('click', function(e){
	var callback = 'callback_' + Math.floor(Math.random() * 100000);
	var key = prompt('Please input Replay ID');
	var url = 'http://api.openkeyval.org/AngryBirdChromeRecorder-' + encodeURIComponent(key) + '?callback=' + encodeURIComponent(callback);
	window[callback] = function(text){
	    var ret = JSON.parse(text);
	    if (!ret) {
		alert('Import Failed');
	    }

	    angryBirdLogger.event_records = ret;
	    angryBirdLogger.record_started = false;
	    funcRecordBtn.innerHTML = 'RECORD START';
	    funcReplayBtn.disabled = '';
	    funcUploadBtn.disabled = '';
	    delete window[callback];
	    alert('Import done');
	};

	var js = document.createElement('script');
	js.src = url;
	document.getElementsByTagName('head')[0].appendChild(js);

	return false;
    });
    panelDom.appendChild(funcImportBtn);

    var eventRecorder = function(e, type){
	if (angryBirdLogger.record_started) {
	    var data = {time: new Date().valueOf(), type: type, event_data: {}};
	    var list = ['bubbles', 'cancelable', 'detail', 'screenX', 'screenY', 'clientX', 'clientY', 'ctrlKey', 'altKey', 'shiftKey', 'metaKey', 'button'];
	    for (var i = 0; i < list.length; i ++) {
		data.event_data[list[i]] = e[list[i]];
	    }
	    angryBirdLogger.event_records.push(data);
	}
    };

    angryBirdLogger.mouseMoveEvent = function(e){
	eventRecorder(e, 'mousemove');
    };

    angryBirdLogger.mouseDownEvent = function(e){
	eventRecorder(e, 'mousedown');
    };

    angryBirdLogger.mouseUpEvent = function(e){
	eventRecorder(e, 'mouseup');
    };
})(angryBirdLogger, window, document);
