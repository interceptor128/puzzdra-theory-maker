/**
 * ボール選択画面管理クラス
 * @classs
 * @constructor
 */
var BallSelectScene = function (elementId) {
    var self = this;
    var MARGINE = 2;
    this.mouseInfo = new MouseInfo();
    this.frameCount = 0;
    /** 選択されている色情報。フィールド側のブロック配置時に参照する。 */
    this.selectedColor = BallColor.RED;
    /** 描画の更新が必要になったら、このフラグを立てて再描画する。 */
    this.invalidate = true;
    this.canvas = document.getElementById(elementId);
    this.timers = [];
    this.initialize = function () {
        // console.log("BallSelectScene.initialize");
    };
    this.finalize = function () {
        // console.log("BallSelectScene.finalize");
    };
    this.update = function () {
        // console.log("BallSelectScene.update");
        // もしマウスが離されたら
        if (self.mouseInfo.pressed == false && self.mouseInfo.lastPressed == true) {
            var x = Math.floor(self.mouseInfo.point.x / BALL_SIZE);
            var y = Math.floor(self.mouseInfo.point.y / BALL_SIZE);
            self.selectedColor = Math.min(BallColor.NUM - 1, x + y * 6);
            self.invalidate = true;
        }
        ++self.frameCount;
    };
    this.draw = function () {
        if (self.invalidate) {
            var ctx = self.canvas.getContext('2d');
            ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
            ctx.fillStyle = "#332222";
            ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);
            ctx.save(0, 0, self.canvas.width, self.canvas.height);
            // ボール描画
            ctx.drawImage(ImageResource.BALL_RED, BALL_SIZE * 0 + MARGINE, MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            ctx.drawImage(ImageResource.BALL_BLUE, BALL_SIZE * 1 + MARGINE, MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            ctx.drawImage(ImageResource.BALL_GREEN, BALL_SIZE * 2 + MARGINE, MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            ctx.drawImage(ImageResource.BALL_LIGHT, BALL_SIZE * 3 + MARGINE, MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            ctx.drawImage(ImageResource.BALL_DARK, BALL_SIZE * 4 + MARGINE, MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            ctx.drawImage(ImageResource.BALL_LIFE, BALL_SIZE * 5 + MARGINE, MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            ctx.drawImage(ImageResource.BALL_OZYAMA, BALL_SIZE * 0 + MARGINE, BALL_SIZE * 1 + MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            ctx.drawImage(ImageResource.BALL_BOMB, BALL_SIZE * 1 + MARGINE, BALL_SIZE * 1 + MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            ctx.drawImage(ImageResource.BALL_POISON, BALL_SIZE * 2 + MARGINE, BALL_SIZE * 1 + MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            ctx.drawImage(ImageResource.BALL_POISON2, BALL_SIZE * 3 + MARGINE, BALL_SIZE * 1 + MARGINE, BALL_SIZE - MARGINE * 2, BALL_SIZE - MARGINE * 2);
            // 枠線描画
            ctx.strokeStyle = "#AAFFAA";
            ctx.lineWidth = 3;
            var x = self.selectedColor % 6;
            var y = Math.floor(self.selectedColor / 6);
            ctx.strokeRect(1.5 + (BALL_SIZE * x), 1.5 + (BALL_SIZE * y), BALL_SIZE - 3, BALL_SIZE - 3);
            ctx.restore();
            self.invalidate = false;
        }
    };
    this.updateMouseInfo = function (mouseInfo) {
        self.mouseInfo = mouseInfo.clone();
    };
};
