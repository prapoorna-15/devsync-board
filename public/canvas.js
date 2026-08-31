'use strict';

(function() {
  // NEW: Automatically extract ?room= from URL or default to 'main'
var urlParams = new URLSearchParams(window.location.search);
var currentRoom = urlParams.get('room') || 'main';

var socket = io({
  query: { room: currentRoom }
});
  var tools = {};
  var textarea;

  function getColor() {
    var picker = document.getElementById('colour-picker');
    if (!picker) return '#ffffff';
    var val = picker.value;
    return val.startsWith('#') ? val : '#' + val;
  }

  if (window.addEventListener) {
    window.addEventListener('load', function () {
      var canvas, context, canvaso, contexto;
      var tool;
      var tool_default = 'pencil';

      function renderDrawing(data) {
        if (!data) return;
        
        contexto.strokeStyle = data.color || '#ffffff';
        contexto.fillStyle = data.color || '#ffffff';
        contexto.lineWidth = data.size || 1;

        if (data.tool === 'pencil') {
          if (data.state === 'start') {
            contexto.beginPath();
            contexto.moveTo(data.x1, data.y1);
          } else if (data.state === 'move') {
            contexto.lineTo(data.x1, data.y1);
            contexto.stroke();
          }
        } else if (data.tool === 'rect') {
          var x = Math.min(data.x1, data.x0);
          var y = Math.min(data.y1, data.y0);
          var w = Math.abs(data.x1 - data.x0);
          var h = Math.abs(data.y1 - data.y0);
          contexto.strokeRect(x, y, w, h);
        } else if (data.tool === 'circle') {
          var radius = Math.sqrt(Math.pow(data.x1 - data.x0, 2) + Math.pow(data.y1 - data.y0, 2));
          contexto.beginPath();
          contexto.arc(data.x0, data.y0, radius, 0, 2 * Math.PI);
          contexto.stroke();
        } else if (data.tool === 'ellipse') {
          var rx = Math.abs(data.x1 - data.x0) / 2;
          var ry = Math.abs(data.y1 - data.y0) / 2;
          var cx = Math.min(data.x0, data.x1) + rx;
          var cy = Math.min(data.y0, data.y1) + ry;
          contexto.beginPath();
          contexto.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
          contexto.stroke();
        } else if (data.tool === 'line') {
          contexto.beginPath();
          contexto.moveTo(data.x0, data.y0);
          contexto.lineTo(data.x1, data.y1);
          contexto.stroke();
        } else if (data.tool === 'text') {
          if (!data.text) return;
          if (data.font) {
            contexto.font = data.font;
          } else {
            var fontSize = data.fontSize || 20;
            var fontFamily = data.fontFamily || 'Arial';
            contexto.font = fontSize + 'px ' + fontFamily;
          }
          var textX = (data.x !== undefined) ? data.x : ((data.x0 !== undefined) ? data.x0 : data.x1);
          var textY = (data.y !== undefined) ? data.y : ((data.y0 !== undefined) ? data.y0 : data.y1);
          contexto.fillText(data.text, textX, textY);
        }
      }

      function init () {
        canvaso = document.getElementById('imageView');
        if (!canvaso || !canvaso.getContext) return;

        contexto = canvaso.getContext('2d');
        if (!contexto) return;

        var container = canvaso.parentNode;
        canvas = document.createElement('canvas');
        if (!canvas) return;

        canvas.id = 'imageTemp';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '2';
        container.appendChild(canvas);

        context = canvas.getContext('2d');

        function setCanvasSize() {
          var w = container.clientWidth || window.innerWidth;
          var h = container.clientHeight || window.innerHeight;

          var tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvaso.width;
          tempCanvas.height = canvaso.height;
          var tempCtx = tempCanvas.getContext('2d');
          if (canvaso.width > 0 && canvaso.height > 0) {
            tempCtx.drawImage(canvaso, 0, 0);
          }

          canvaso.width = w;
          canvaso.height = h;
          canvas.width = w;
          canvas.height = h;

          if (tempCanvas.width > 0 && tempCanvas.height > 0) {
            contexto.drawImage(tempCanvas, 0, 0);
          }
        }

        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);

        if (tools[tool_default]) {
          tool = new tools[tool_default]();
        }

        document.getElementById('pencil-button').onclick = function() { tool = new tools.pencil(); };
        document.getElementById('rect-button').onclick = function() { tool = new tools.rect(); };
        document.getElementById('circle-button').onclick = function() { tool = new tools.circle(); };
        document.getElementById('ellipse-button').onclick = function() { tool = new tools.ellipse(); };
        document.getElementById('line-button').onclick = function() { tool = new tools.line(); };
        document.getElementById('text-button').onclick = function() { tool = new tools.text(); };

        socket.on('users_count', function(count) {
          var userCountBadge = document.getElementById('user-count');
          if (userCountBadge) {
            userCountBadge.textContent = count + (count === 1 ? ' User Online' : ' Users Online');
          }
        });

        var clearBtn = document.getElementById('clear-all') || document.getElementById('clear-btn');
        if (clearBtn) {
          clearBtn.onclick = function() {
            contexto.clearRect(0, 0, canvaso.width, canvaso.height);
            socket.emit('Clearboard', true);
          };
        }

        canvas.addEventListener('mousedown', ev_canvas, false);
        canvas.addEventListener('mousemove', ev_canvas, false);
        canvas.addEventListener('mouseup',   ev_canvas, false);
      }

      function ev_canvas (ev) {
        var rect = canvas.getBoundingClientRect();
        ev._x = ev.clientX - rect.left;
        ev._y = ev.clientY - rect.top;

        if (tool && tool[ev.type]) {
          tool[ev.type](ev);
        }
      }

      function img_update () {
        contexto.drawImage(canvas, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      tools.pencil = function () {
        var tool = this;
        this.started = false;

        this.mousedown = function (ev) {
          context.beginPath();
          context.moveTo(ev._x, ev._y);
          tool.started = true;
          
          socket.emit('drawing', {
            x1: ev._x, y1: ev._y, x2: ev._x, y2: ev._y,
            color: getColor(), 
            size: document.getElementById('line-width').value, 
            tool: 'pencil', state: 'start'
          });
        };

        this.mousemove = function (ev) {
          if (tool.started) {
            context.strokeStyle = getColor();
            context.lineWidth = document.getElementById('line-width').value;
            context.lineTo(ev._x, ev._y);
            context.stroke();

            socket.emit('drawing', {
              x1: ev._x, y1: ev._y,
              color: getColor(),
              size: document.getElementById('line-width').value,
              tool: 'pencil', state: 'move'
            });
          }
        };

        this.mouseup = function (ev) {
          if (tool.started) {
            tool.mousemove(ev);
            tool.started = false;
            img_update();
          }
        };
      };

      tools.rect = function () {
        var tool = this;
        this.started = false;

        this.mousedown = function (ev) {
          tool.started = true;
          tool.x0 = ev._x;
          tool.y0 = ev._y;
        };

        this.mousemove = function (ev) {
          if (!tool.started) return;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.strokeStyle = getColor();
          context.lineWidth = document.getElementById('line-width').value;
          
          var x = Math.min(ev._x, tool.x0);
          var y = Math.min(ev._y, tool.y0);
          var w = Math.abs(ev._x - tool.x0);
          var h = Math.abs(ev._y - tool.y0);

          context.strokeRect(x, y, w, h);
        };

        this.mouseup = function (ev) {
          if (tool.started) {
            tool.mousemove(ev);
            tool.started = false;
            img_update();
            socket.emit('drawing', {
              x0: tool.x0, y0: tool.y0, x1: ev._x, y1: ev._y,
              color: getColor(),
              size: document.getElementById('line-width').value, tool: 'rect'
            });
          }
        };
      };

      tools.circle = function () {
        var tool = this;
        this.started = false;

        this.mousedown = function (ev) {
          tool.started = true;
          tool.x0 = ev._x;
          tool.y0 = ev._y;
        };

        this.mousemove = function (ev) {
          if (!tool.started) return;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.strokeStyle = getColor();
          context.lineWidth = document.getElementById('line-width').value;

          var radius = Math.sqrt(Math.pow(ev._x - tool.x0, 2) + Math.pow(ev._y - tool.y0, 2));
          context.beginPath();
          context.arc(tool.x0, tool.y0, radius, 0, 2 * Math.PI);
          context.stroke();
        };

        this.mouseup = function (ev) {
          if (tool.started) {
            tool.mousemove(ev);
            tool.started = false;
            img_update();
            socket.emit('drawing', {
              x0: tool.x0, y0: tool.y0, x1: ev._x, y1: ev._y,
              color: getColor(),
              size: document.getElementById('line-width').value, tool: 'circle'
            });
          }
        };
      };

      tools.ellipse = function () {
        var tool = this;
        this.started = false;

        this.mousedown = function (ev) {
          tool.started = true;
          tool.x0 = ev._x;
          tool.y0 = ev._y;
        };

        this.mousemove = function (ev) {
          if (!tool.started) return;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.strokeStyle = getColor();
          context.lineWidth = document.getElementById('line-width').value;

          var rx = Math.abs(ev._x - tool.x0) / 2;
          var ry = Math.abs(ev._y - tool.y0) / 2;
          var cx = Math.min(tool.x0, ev._x) + rx;
          var cy = Math.min(tool.y0, ev._y) + ry;

          context.beginPath();
          context.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
          context.stroke();
        };

        this.mouseup = function (ev) {
          if (tool.started) {
            tool.mousemove(ev);
            tool.started = false;
            img_update();
            socket.emit('drawing', {
              x0: tool.x0, y0: tool.y0, x1: ev._x, y1: ev._y,
              color: getColor(),
              size: document.getElementById('line-width').value, tool: 'ellipse'
            });
          }
        };
      };

      tools.line = function () {
        var tool = this;
        this.started = false;

        this.mousedown = function (ev) {
          tool.started = true;
          tool.x0 = ev._x;
          tool.y0 = ev._y;
        };

        this.mousemove = function (ev) {
          if (!tool.started) return;
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.strokeStyle = getColor();
          context.lineWidth = document.getElementById('line-width').value;

          context.beginPath();
          context.moveTo(tool.x0, tool.y0);
          context.lineTo(ev._x, ev._y);
          context.stroke();
        };

        this.mouseup = function (ev) {
          if (tool.started) {
            tool.mousemove(ev);
            tool.started = false;
            img_update();
            socket.emit('drawing', {
              x0: tool.x0, y0: tool.y0, x1: ev._x, y1: ev._y,
              color: getColor(),
              size: document.getElementById('line-width').value, tool: 'line'
            });
          }
        };
      };

      tools.text = function () {
        var tool = this;
        this.mousedown = function (ev) {};
        this.mousemove = function (ev) {};

        this.mouseup = function (ev) {
          if (textarea) return;
          textarea = document.createElement('textarea');
          textarea.id = 'text_tool';
          textarea.style.position = 'absolute';
          textarea.style.top = ev.clientY + 'px';
          textarea.style.left = ev.clientX + 'px';
          textarea.style.color = getColor();
          textarea.style.fontFamily = document.getElementById('draw-text-font-family').value;
          textarea.style.fontSize = document.getElementById('draw-text-font-size').value + 'px';
          textarea.style.outline = 'none';
          textarea.style.zIndex = '1001';

          textarea.onblur = function () {
            var text = textarea.value;
            if (text) {
              var font = textarea.style.fontSize + " " + textarea.style.fontFamily;
              var color = textarea.style.color;
              var x = parseInt(textarea.style.left);
              var y = parseInt(textarea.style.top) + parseInt(textarea.style.fontSize);

              contexto.font = font;
              contexto.fillStyle = color;
              contexto.fillText(text, x, y);

              socket.emit('drawing', {
                text: text,
                x: x,
                y: y,
                font: font,
                color: color,
                tool: 'text'
              });
            }
            if (textarea.parentNode) {
              textarea.parentNode.removeChild(textarea);
            }
            textarea = null;
          };

          document.body.appendChild(textarea);
          setTimeout(function() { textarea.focus(); }, 10);
        };
      };

      socket.on('drawing', renderDrawing);

      socket.on('history', function (historyData) {
        if (Array.isArray(historyData)) {
          historyData.forEach(function (data) {
            renderDrawing(data);
          });
        }
      });

      socket.on('Clearboard', function () {
        contexto.clearRect(0, 0, canvaso.width, canvaso.height);
      });

      init();
    }, false);
  }
})();

(function() {
  window.addEventListener('load', function() {
    var downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        var canvas = document.getElementById('imageView');
        if (!canvas) return;

        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        var tempCtx = tempCanvas.getContext('2d');

        var isLight = document.body.classList.contains('light-theme');
        tempCtx.fillStyle = isLight ? '#f8f9fa' : '#0d1117';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        tempCtx.drawImage(canvas, 0, 0);

        var link = document.createElement('a');
        link.download = 'whiteboard-' + Date.now() + '.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
      });
    }

    var themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function() {
        document.body.classList.toggle('light-theme');
      });
    }
  });
})();