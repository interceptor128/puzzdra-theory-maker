/**
* シーン管理クラス
* @classs
* @constructor
* @param {String} elementId 対象エレメントID。対象エレメントのマウスイベントを取得して色々する。
* @param {Bool} touchDevice trueならスマートフォン等のタッチパネル操作のブラウザ。falseならPC等のマウス操作のブラウザ。
*/
var SceneManager = function (elementId, touchDevice) {
    var self = this;
    this.scene = null;
    this.mouseInfo = new MouseInfo();
    this.skipMode = false;
    this.nextScene = null;
    this.element = document.getElementById(elementId);
    /**
    * シーンを切り替える
    * @param {Object} scene 切り替える対象のシーン
    */
    this.changeScene = function (scene) {
        this.nextScene = scene;
    };
    this.updateMousePoint = function (event) {
        var rect = event.target.getBoundingClientRect();
        self.mouseInfo.point.x = event.clientX - rect.left;
        self.mouseInfo.point.y = event.clientY - rect.top;
    };
    this.mouseDown = function (event) {
        self.updateMousePoint(event);
        self.mouseInfo.pressed = true;
        if (self.scene)
            self.scene.updateMouseInfo(self.mouseInfo);
        return false;
    };
    this.mouseUp = function (event) {
        self.updateMousePoint(event);
        self.mouseInfo.pressed = false;
        if (self.scene)
            self.scene.updateMouseInfo(self.mouseInfo);
        return false;
    };
    this.mouseMove = function (event) {
        self.updateMousePoint(event);
        if (self.scene)
            self.scene.updateMouseInfo(self.mouseInfo);
        return false;
    };
    this.mouseOut = function (event) {
        self.updateMousePoint(event);
        self.mouseInfo.pressed = false;
        if (self.scene)
            self.scene.updateMouseInfo(self.mouseInfo);
        return false;
    };
    this.touchStart = function () {
        var e = event.touches[0];
        self.updateMousePoint(e);
        self.mouseInfo.pressed = true;
        if (self.scene)
            self.scene.updateMouseInfo(self.mouseInfo);
        return false;
    };
    this.touchEnd = function () {
        try {
            self.mouseInfo.pressed = false;
            if (self.scene)
                self.scene.updateMouseInfo(self.mouseInfo);
            if (touchDevice) {
                self.click();
            }
        } catch (e) {
            alert(e);
        }
        return false;
    };
    this.click = function (event) {
        if (self.onCanvasClick)
            self.onCanvasClick();
    };
    this.touchMove = function () {
        var e = event.touches[0];
        self.updateMousePoint(e);
        if (self.scene)
            self.scene.updateMouseInfo(self.mouseInfo);
        return false;
    };
    this.timerFunc = function () {
        self.update();
        self.draw();
        ++self.frameCount;
    };
    this.update = function () {
        self.mouseInfo.lastPressed = self.mouseInfo.pressed;
        if (self.nextScene) {
            if (self.scene) {
                self.scene.finalize();
                self.scene = null;
            }
            self.scene = self.nextScene;
            self.nextScene = null;
            self.scene.initialize();
        }
        if (self.scene) {
            self.scene.update();
        }
    };
    this.draw = function () {
        if (!self.skipMode) {
            if (self.scene) {
                self.scene.draw();
            }
        }
    };
    this.stopInterval = function () {
        clearInterval(self.timerId);
        self.timerId = null;
    };
    this.startInterval = function (skipMode) {
        self.skipMode = skipMode;
        clearInterval(self.timerId);
        if (self.skipMode) {
            self.timerId = setInterval(self.timerFunc, 0);
        } else {
            self.timerId = setInterval(self.timerFunc, 33);
        }
    };
    if (!touchDevice) {
        this.element.onmousemove = this.mouseMove;
        this.element.onmousedown = this.mouseDown;
        this.element.onmouseup = this.mouseUp;
        this.element.onmouseout = this.mouseOut;
    } else {
        this.element.ontouchmove = this.touchMove;
        this.element.ontouchstart = this.touchStart;
        this.element.ontouchend = this.touchEnd;
    }
    this.element.onclick = this.click;
};
