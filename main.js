/**
 * bodyのonloadから呼ばれる。色々リソース類を初期化してシーンを開始する。
 */
var fieldScene = null;
var ballSelectScene = null;
var sceneManagerField = null;
var sceneManagerBallSelect = null;
function init() {
  // URLパラメータ取得
  //var arg = new Object;
  var pair = location.search.substring(1).split('&');
  var layout = null;
  var route = null;
  var ctwMode = null;
  for (var i = 0; i < pair.length; ++i) {
    var keyAndValue = pair[i].split('=');
    if (keyAndValue[0] == "layout") {
      layout = keyAndValue[1];
    }
    else if (keyAndValue[0] == "route") {
      route = keyAndValue[1];
    }
    else if (keyAndValue[0] == "date") {
      date = keyAndValue[1];
    }
    else if (keyAndValue[0] == "ctwMode") {
      ctwMode = keyAndValue[1];
    }
  }
  // 画像ファイルが指定されたときの処理
  var inputFile = document.getElementById("inputFile");
  inputFile.onchange = function () {
    function isImage(file) {
      return file.type.match("image.*") ? true : false;
    }
    var files = this.files;
    for (var i = 0; i < files.length; i++) {
      if (isImage(files[i])) {
        layoutImageFileLoaded(files[i]);
      }
    }
  };
  // Elementサイズ設定
  if (touchDevice) {
    document.getElementById("body").style.margin = "0px";
    document.getElementById("buttonEditMode").style.width = "102px";
    document.getElementById("buttonRecordMode").style.width = "102px";
    document.getElementById("buttonPlayMode").style.width = "102px";
    document.getElementById("hr").style.width = "320px";
  } else {
    document.getElementById("buttonEditMode").style.width = "126px";
    document.getElementById("buttonRecordMode").style.width = "126px";
    document.getElementById("buttonPlayMode").style.width = "126px";
    document.getElementById("hr").style.width = "384px";
  }
  document.getElementById("fieldCanvas").width = BALL_SIZE * 6;
  document.getElementById("fieldCanvas").height = BALL_SIZE * 5;
  document.getElementById("dropsCanvas").width = BALL_SIZE * 6;
  document.getElementById("dropsCanvas").height = BALL_SIZE * 2;
  // フィールド
  sceneManagerField = new SceneManager("fieldCanvas", touchDevice);
  sceneManagerField.startInterval(false);
  fieldScene = new FieldScene("fieldCanvas");
  sceneManagerField.changeScene(fieldScene);
  // ドロップ選択
  sceneManagerBallSelect = new SceneManager("dropsCanvas", touchDevice);
  sceneManagerBallSelect.startInterval(false);
  ballSelectScene = new BallSelectScene("dropsCanvas");
  sceneManagerBallSelect.changeScene(ballSelectScene);
  // モード設定
  // dateが存在した場合はある日の配置を解くモード
  if (date) {
    document.getElementById("top").style.display = "block";
    document.getElementById("openTodaysQuestion").style.display = "none";
    document.getElementById("title").innerHTML = "パズドラ 定石メーカー " + date.substring(0, 4) + "/" + date.substring(4, 6) + "/" + date.substring(6, 8) + "の問題";
    document.getElementById("buttonEditMode").disabled = true;
    // 問題の解答を再生
    if (layout && route) {
      fieldScene.lastLayout = layout;
      fieldScene.lastRoute = route;
      setMode(Mode.PLAY);
    }
    // 問題を解く 
    else {
      fieldScene.random = new MersenneTwister(Number(date));
      fieldScene.reset();
      // 消させる
      fieldScene.setStrategy(new FieldStrategyDropDelete(fieldScene, true, false));
      // 消し終わったらスキップモードを解除し移動モードへ
      fieldScene.strategy.deleteFinished = function () {
        setMode(Mode.MOVE);
        setSkipMode(false);
      };
      // 消去処理は見せないためにスキップモード設定
      setSkipMode(true);
    }
  }
  // dateが存在しない場合は好きに配置する
  else {
    // レイアウトとルートがパラメータで指定された場合は再生する
    if (layout && route) {
      fieldScene.lastLayout = layout;
      fieldScene.lastRoute = route;
      setMode(Mode.PLAY);
    }
    else {
      setMode(Mode.EDIT);
    }
  }
  // CTWモードの場合(CTWモード指定がくるのは再生モードの時のみ)
  if (ctwMode && ctwMode === "true") {
    fieldScene.isCtwMode = true;
  }
  // 再生モードの場合はCanvasまでスクロールする
  if (layout && route) {
    var tab = document.getElementById("tab");
    var bounds = tab.getBoundingClientRect();
    window.scrollTo(0, bounds.top);
  }
}

function getSelectedColor() {
  return ballSelectScene.selectedColor;
}
function setSkipMode(flag) {
  sceneManagerField.stopInterval();
  sceneManagerField.startInterval(flag);
}
var Mode = {
  EDIT: 0,
  MOVE: 1,
  PLAY: 2
};
var currentMode = Mode.EDIT;
function setMode(mode) {
  try {
    // ボタン選択を全部解除
    var btn1 = document.getElementById("buttonEditMode");
    btn1.style.backgroundColor = "#FFF";
    var btn2 = document.getElementById("buttonRecordMode");
    btn2.style.backgroundColor = "#FFF";
    var btn3 = document.getElementById("buttonPlayMode");
    btn3.style.backgroundColor = "#FFF";
    // コントロール領域を全部見えなく
    var div1 = document.getElementById("editModeControllers");
    div1.style.display = "none";
    var div2 = document.getElementById("moveModeControllers");
    div2.style.display = "none";
    var div3 = document.getElementById("playModeControllers");
    div3.style.display = "none";
    switch (mode) {
      case Mode.EDIT:
        fieldScene.reloadByLayout(fieldScene.lastLayout);
        fieldScene.setStrategy(new FieldStrategyDropEdit(fieldScene));
        btn1.style.backgroundColor = "#AFA";
        div1.style.display = "block";
        break;
      case Mode.MOVE:
        // 配置モードから移動モードに移行する場合はレイアウトをセーブする
        if (currentMode == Mode.EDIT) {
          fieldScene.saveLayout();
        }
        // レイアウトを復元
        if (fieldScene.lastLayout) {
          fieldScene.reloadByLayout(fieldScene.lastLayout);
        }
        fieldScene.setStrategy(new FieldStrategyDropMove(fieldScene, false));
        btn2.style.backgroundColor = "#AFA";
        div2.style.display = "block";
        updateInfo();
        break;
      case Mode.PLAY:
        // レイアウトを復元
        if (fieldScene.lastLayout) {
          fieldScene.reloadByLayout(fieldScene.lastLayout);
        }
        fieldScene.setStrategy(new FieldStrategyDropMove(fieldScene, true));
        if (fieldScene.lastRoute) {
          fieldScene.strategy.frameToRecordPlayStart = 12;
        }
        btn3.style.backgroundColor = "#AFA";
        div3.style.display = "block";
        updateInfo();
        break;
    }
    currentMode = mode;
  }
  catch (e) {
    alert(e);
  }
}
function replaceRandom() {
  // ランダム配置して
  fieldScene.reset();
  // 消させる
  var savedStrategy = fieldScene.strategy;
  fieldScene.setStrategy(new FieldStrategyDropDelete(fieldScene, true, false));
  // 消し終わったらスキップモードを解除しStrategyを元の状態に戻す
  fieldScene.strategy.deleteFinished = function () {
    fieldScene.setStrategy(savedStrategy);
    setSkipMode(false);
  };
  // 消去処理は見せないためにスキップモード設定
  setSkipMode(true);
}
function saveLayout() {
  fieldScene.saveLayout();
  alert("配置を保存しました");
}
function loadLayout() {
  if (fieldScene.lastLayout) {
    fieldScene.reloadByLayout(fieldScene.lastLayout);
  } else {
    alert("保存された配置がありません");
  }
}
function resetMove() {
  fieldScene.setStrategy(new FieldStrategyDropMove(fieldScene, false));
  fieldScene.reloadByLayout(fieldScene.lastLayout);
  updateInfo();
}

var MoveMode = {
  NORMAL: 0,
  CTW5: 1,
  CTW7: 2,
  CTW10: 3,
  NUM: 4
};
var moveMode = MoveMode.NORMAL;
function toggleMoveMode() {
  moveMode = (moveMode + 1) % MoveMode.NUM;
  var button = document.getElementById("buttonToggleMoveMode");
  switch (moveMode) {
    case MoveMode.NORMAL:
      button.innerHTML = "通常モード";
      break;
    case MoveMode.CTW5:
      button.innerHTML = "CTW 5秒";
      break;
    case MoveMode.CTW7:
      button.innerHTML = "CTW 7秒";
      break;
    case MoveMode.CTW10:
      button.innerHTML = "CTW 10秒";
      break;
  }
  // FieldSceneに通知
  fieldScene.setMoveMode(moveMode);
}
function play() {
  if (fieldScene.lastLayout) {
    fieldScene.reloadByLayout(fieldScene.lastLayout);
  }
  fieldScene.setStrategy(new FieldStrategyDropMove(fieldScene, true));
  if (fieldScene.lastRoute) {
    fieldScene.strategy.frameToRecordPlayStart = 0;
  } else {
    alert("保存された動作がありません");
  }
}
function stop() {
  if (fieldScene.lastLayout) {
    fieldScene.reloadByLayout(fieldScene.lastLayout);
  }
  fieldScene.setStrategy(new FieldStrategyDropMove(fieldScene, true));
}
function shareTwitter() {
  var useUnuse = slantMove ? '%e6%9c%89%e3%82%8a' : '%e7%84%a1%e3%81%97';
  var red = '%e7%81%ab';
  var green = '%e6%9c%a8';
  var blue = '%e6%b0%b4';
  var light = '%e5%85%89';
  var dark = '%e9%97%87';
  var life = '%e5%9b%9e';
  var colors = '';
  for (var i = 0; i < deletedColors.length; ++i) {
    if (deletedColors[i]) {
      switch (i) {
        case BallColor.RED: colors += red; break;
        case BallColor.GREEN: colors += green; break;
        case BallColor.BLUE: colors += blue; break;
        case BallColor.LIGHT: colors += light; break;
        case BallColor.DARK: colors += dark; break;
        case BallColor.LIFE: colors += life; break;
      }
    }
  }
  var extra = '%28%e6%96%9c%e3%82%81%e7%a7%bb%e5%8b%95%ef%bc%9a' + useUnuse + '%e3%80%81%e6%b6%88%e3%81%97%e3%81%9f%e8%89%b2%ef%bc%9a' + colors + '%29';
  if (date) {
    var param = "?layout=" + fieldScene.lastLayout + "%26route=" + fieldScene.lastRoute + "%26date=" + date + "%26ctwMode=" + fieldScene.isCtwMode;
    var url = window.location.protocol + "//" + window.location.host + window.location.pathname + param;
    window.open('http://twitter.com/intent/tweet?source=webclient&text=%e3%83%91%e3%82%ba%e3%83%89%e3%83%a9%e5%ae%9a%e7%9f%b3%e3%83%a1%e3%83%bc%e3%82%ab%e3%83%bc%20' + date.substring(0, 4) + '%2f' + date.substring(4, 6) + '%2f' + date.substring(6, 8) + '%e3%81%ae%e4%be%8b%e9%a1%8c%e3%82%92' + moveNum + '%e6%89%8b%e3%81%a7' + comboNum + '%e9%80%a3%e9%8e%96%e3%81%97%e3%81%9f%e3%82%88%e3%80%82%20' + extra + '%20' + url + '%20%23puzzdra_theory_maker');
  }
  else {
    var param = "?layout=" + fieldScene.lastLayout + "%26route=" + fieldScene.lastRoute + "%26ctwMode=" + fieldScene.isCtwMode;
    var url = window.location.protocol + "//" + window.location.host + window.location.pathname + param;
    window.open('http://twitter.com/intent/tweet?source=webclient&text=%e3%83%91%e3%82%ba%e3%83%89%e3%83%a9%e5%ae%9a%e7%9f%b3%e3%83%a1%e3%83%bc%e3%82%ab%e3%83%bc%20%e3%81%93%e3%81%ae%e9%85%8d%e7%bd%ae%e3%81%a7' + moveNum + '%e6%89%8b%e3%81%a7' + comboNum + '%e9%80%a3%e9%8e%96%e3%81%97%e3%81%9f%e3%82%88%e3%80%82%20' + extra + '%20' + url + '%20%23puzzdra_theory_maker');
  }
}
function shareImage() {
  fieldScene.combos = new Array();
  fieldScene.movingBall = null;
  // レイアウトを復元
  if (fieldScene.lastLayout) {
    fieldScene.reloadByLayout(fieldScene.lastLayout);
    fieldScene.draw();
  }
  var canvas = document.getElementById("fieldCanvas");
  drawRoute(canvas, parseRouteInfo(fieldScene.lastRoute));
  var image = new Image();
  image.src = canvas.toDataURL("image/png");
  window.open(image.src, null);
}
function shareWeb() {
  // パラメータ作成
  var param = "?layout=" + fieldScene.lastLayout + "&route=" + fieldScene.lastRoute + "&ctwMode=" + fieldScene.isCtwMode;
  window.open("index.html" + param, null);
}
var comboNum = 0;
var moveNum = 0;
var slantMove = false;
var deletedColors = new Array();
var date = null;
function updateInfo() {
  comboNum = fieldScene.combos.length;
  moveNum = fieldScene.moveNum;
  slantMove = fieldScene.slantMove;
  var infoElement = document.getElementById("info");
  infoElement.innerHTML = "コンボ数:" + comboNum + " 手数:" + moveNum;
  deletedColors = fieldScene.deletedColors;
  document.getElementById("red").style.opacity = deletedColors[BallColor.RED] ? "1.0" : "0.4";
  document.getElementById("blue").style.opacity = deletedColors[BallColor.BLUE] ? "1.0" : "0.4";
  document.getElementById("green").style.opacity = deletedColors[BallColor.GREEN] ? "1.0" : "0.4";
  document.getElementById("light").style.opacity = deletedColors[BallColor.LIGHT] ? "1.0" : "0.4";
  document.getElementById("dark").style.opacity = deletedColors[BallColor.DARK] ? "1.0" : "0.4";
  document.getElementById("life").style.opacity = deletedColors[BallColor.LIFE] ? "1.0" : "0.4";
  document.getElementById("ozyama").style.opacity = deletedColors[BallColor.OZYAMA] ? "1.0" : "0.4";
  document.getElementById("bomb").style.opacity = deletedColors[BallColor.BOMB] ? "1.0" : "0.4";
  document.getElementById("poison").style.opacity = deletedColors[BallColor.POISON] ? "1.0" : "0.4";
  document.getElementById("poison2").style.opacity = deletedColors[BallColor.POISON2] ? "1.0" : "0.4";
}
function openTodaysQuestion() {
  // パラメータ作成
  var date = new Date();
  var yy = date.getYear();
  var mm = date.getMonth() + 1;
  var dd = date.getDate();
  if (yy < 2000) { yy += 1900; }
  if (mm < 10) { mm = "0" + mm; }
  if (dd < 10) { dd = "0" + dd; }
  var param = "?date=" + yy + mm + dd;
  window.open("index.html" + param, null);
}

function layoutImageFileLoaded(file) {
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext('2d');
  var img = new Image();
  var fr = new FileReader();
  fr.onload = function () {
    // 画像がloadされた後に、canvasに描画する
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      // ピクセル取得
      var colorArray = new Array(6 * 5);
      // 座標の色を入れてく
      var V_NUM = 5;
      var H_NUM = 6;
      function toAbsoluteX(x) {
        switch (x) {
          case 0:
            return 56;
          case 1:
            return 161;
          case 2:
            return 266;
          case 3:
            return 371;
          case 4:
            return 476;
          case 5:
            return 581;
        }
      }
      function toAbsoluteY(y) {
        switch (y) {
          case 0:
            return canvas.height - 474;
          case 1:
            return canvas.height - 369;
          case 2:
            return canvas.height - 264;
          case 3:
            return canvas.height - 159;
          case 4:
            return canvas.height - 54;
        }
      }
      function toBallColor(r, g, b) {
        if (Math.abs(r - 223) < 24 && Math.abs(g - 40) < 24 && Math.abs(b - 140) < 24) {
          return BallColor.LIFE;
        }
        else if (Math.abs(r - 255) < 10 && Math.abs(g - 119) < 40 && Math.abs(b - 68) < 40) {
          return BallColor.RED;
        }
        else if (Math.abs(r - 201) < 24 && Math.abs(g - 101) < 24 && Math.abs(b - 187) < 24) {
          return BallColor.DARK;
        }
        else if (Math.abs(r - 68) < 40 && Math.abs(g - 255) < 10 && Math.abs(b - 102) < 40) {
          return BallColor.GREEN;
        }
        else if (Math.abs(r - 255) < 10 && Math.abs(g - 255) < 10 && Math.abs(b - 136) < 24) {
          return BallColor.LIGHT;
        }
        else if (Math.abs(r - 66) < 40 && Math.abs(g - 238) < 40 && Math.abs(b - 255) < 10) {
          return BallColor.BLUE;
        }
        return BallColor.RED;
      }
      var layout = "";
      for (var y = 0; y < V_NUM; ++y) {
        for (var x = 0; x < H_NUM; ++x) {
          var pixelX = toAbsoluteX(x);
          var pixelY = toAbsoluteY(y);
          var imageData = ctx.getImageData(pixelX, pixelY, 1, 1);
          colorArray[x + y * H_NUM] = new Object();
          colorArray[x + y * H_NUM].red = imageData.data[0];
          colorArray[x + y * H_NUM].green = imageData.data[1];
          colorArray[x + y * H_NUM].blue = imageData.data[2];
          colorArray[x + y * H_NUM].alpha = imageData.data[3];
          layout += String(toBallColor(colorArray[x + y * H_NUM].red, colorArray[x + y * H_NUM].green, colorArray[x + y * H_NUM].blue));
        }
      }
      fieldScene.lastLayout = layout;
      loadLayout();
    };
    img.src = fr.result;  // 読み込んだ画像データをsrcにセット
  };
  fr.readAsDataURL(file);  // 画像読み込み
}