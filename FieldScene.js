/**
 * フィールド画面管理クラス
 * @classs
 * @constructor
 */
var FieldScene = function (elementId) {
    var self = this;
    this.mouseInfo = new MouseInfo();
    this.frameCount = 0;
    this.canvas = document.getElementById(elementId);
    this.strategy = new FieldStrategyDropEdit(self);
    this.random = new MersenneTwister();
    /** 保存したレイアウト情報。"0121144..."みたいな文字列で保存 */
    this.lastLayout = null;
    /** 保存したルート情報。"01,21144;22,323111..."みたいな文字列で保存。座標＋８方向の順番。 */
    this.lastRoute = null;
    /** ctwモード関連*/
    this.isCtwMode = false;
    this.ctwTimeLimit = 30 * 5;
    this.ctwTimer = 0;
    this.ctwTimerStarted = false;

    this.routeInfos = new Array();
    this.hNum = 6;
    this.vNum = 5 * 2;
    this.balls = new Array(this.hNum * this.vNum);
    this.combos = new Array();
    this.moveNum = 0;
    this.deletedColors = new Array(BallColor.NUM);
    this.slantMove = false;
    for (var i = 0; i < BallColor.NUM; ++i) {
        this.deletedColors[i] = false;
    }
    this.movingBall = null;
    this.initialize = function () {
        if (self.lastLayout) {
            self.reloadByLayout(self.lastLayout);
        } else {
            // ランダム配置
            self.reset();
            // 消させる
            var savedStrategy = fieldScene.strategy;
            self.setStrategy(new FieldStrategyDropDelete(self, true, false));
            // 消し終わったらスキップモードを解除しStrategyを元の状態に戻す
            self.strategy.deleteFinished = function () {
                self.setStrategy(savedStrategy);
                setSkipMode(false);
            };
            // 消去処理は見せないためにスキップモード設定
            setSkipMode(true);
        }
        return;
        // 固定配置
        // for (var y = 0; y < self.vNum; ++y) {
        //     for (var x = 0; x < self.hNum; ++x) {
        //         self.createBall(x, y, (x + y * self.hNum) % (BallColor.NUM - 1));
        //     }
        // }
    };
    this.createBall = function (gridX, gridY, color) {
        self.balls[gridX + gridY * self.hNum] = new Ball(self.gridPointToPoint(new Point(gridX, gridY)), color, BALL_SIZE);
    };
    this.reloadByLayout = function (layout) {
        if (!layout) {
            return;
        }
        if (layout.length == 5 * 6) {
            for (var i = 0; i < layout.length; ++i) {
                self.createBall(Math.floor(i % self.hNum), Math.floor(i / self.hNum) + 5, Number(layout.charAt(i)));
            }
        }
    };
    this.saveLayout = function () {
        self.lastLayout = "";
        for (var y = 5; y < self.vNum; ++y) {
            for (var x = 0; x < self.hNum; ++x) {
                var ball = self.balls[x + y * self.hNum];
                if (ball) {
                    self.lastLayout += String(self.balls[x + y * self.hNum].color);
                } else {
                    self.lastLayout += " ";
                }
            }
        }
    };
    this.saveRoute = function () {
        self.lastRoute = "";
        for (var i = 0; i < self.routeInfos.length; ++i) {
            var routeInfo = self.routeInfos[i];
            self.lastRoute += Number(routeInfo.startGrid.x);
            self.lastRoute += Number(routeInfo.startGrid.y);
            self.lastRoute += ",";
            for (var j = 0; j < routeInfo.route.length; ++j) {
                self.lastRoute += Number(routeInfo.route[j]);
            }
            // 最後に;を付けない
            if (i < self.routeInfos.length - 1) {
                self.lastRoute += "/";
            }
        }
    };
    this.finalize = function () {
        // console.log("FieldScene.finalize");
    };
    this.reset = function () {
        try {
            for (var y = 5; y < self.vNum; ++y) {
                for (var x = 0; x < self.hNum; ++x) {
                    var color = self.random.nextInt(0, /*BallColor.NUM*/ 6);
                    self.balls[x + y * self.hNum] = new Ball(self.gridPointToPoint(new Point(x, y)), color, BALL_SIZE);
                }
            }
        } catch (e) {
            // console.log("Field.reset\n" + e + "\n");
        }
    };
    this.setStrategy = function (strategy) {
        if (self.strategy) {
            self.strategy.finalize();
        }
        self.strategy = strategy;
        strategy.initialize();
    };
    this.update = function () {
        self.strategy.update();
        ++self.frameCount;
    };
    this.draw = function () {
        // console.log("FieldScene.draw");
        var ctx = self.canvas.getContext('2d');
        ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        // 背景描画
        ctx.save();
        ctx.fillStyle = "#332222";
        ctx.fillRect(0, 0, self.canvas.width, self.canvas.height);
        ctx.fillStyle = "#553322";
        for (var y = 0; y < 5; ++y) {
            for (var x = 0; x < 6; ++x) {
                if ((x + y) % 2 == 1) {
                    ctx.fillRect(x * BALL_SIZE, y * BALL_SIZE, BALL_SIZE, BALL_SIZE);
                }
            }
        }
        ctx.restore();
        // ボール描画
        ctx.save();
        ctx.translate(0, - BALL_SIZE * 5);
        var drawBall = function (ball) {
            var image = null;
            switch (ball.color) {
                case BallColor.RED: image = ImageResource.BALL_RED; break;
                case BallColor.GREEN: image = ImageResource.BALL_GREEN; break;
                case BallColor.BLUE: image = ImageResource.BALL_BLUE; break;
                case BallColor.LIGHT: image = ImageResource.BALL_LIGHT; break;
                case BallColor.DARK: image = ImageResource.BALL_DARK; break;
                case BallColor.LIFE: image = ImageResource.BALL_LIFE; break;
                case BallColor.POISON: image = ImageResource.BALL_POISON; break;
                case BallColor.OZYAMA: image = ImageResource.BALL_OZYAMA; break;
                case BallColor.BOMB: image = ImageResource.BALL_BOMB; break;
                case BallColor.POISON2: image = ImageResource.BALL_POISON2; break;
            }
            ctx.globalAlpha = ball.alpha;
            ctx.drawImage(image, ball.point.x, ball.point.y, BALL_SIZE, BALL_SIZE);
        };
        var i;
        // 移動中のを一番上に描画(本当は描画処理自体をレイヤー階層でソートするべきだけど暫定的に)
        for (i = 0; i < self.balls.length; ++i) {
            var ball = self.balls[i];
            if (ball != null && ball.state != BallState.MOVING)
                drawBall(ball);
        }
        if (self.movingBall != null) {
            drawBall(self.movingBall);
        }
        // コンボ描画
        for (i = 0; i < self.combos.length; ++i) {
            self.combos[i].draw(self.canvas);
        }
        // CTW操作中は残り時間のバーを表示
        if (currentMode == Mode.MOVE && self.isCtwMode && self.ctwTimerStarted) {
            var per = 1.0 - self.ctwTimer / self.ctwTimeLimit;
            var barWidth = per * self.canvas.width;
            ctx.fillStyle = "#5555FF";
            ctx.globalAlpha = 1.0;
            ctx.fillRect(0, BALL_SIZE * 5 + 1, barWidth, 3);
        }
        ctx.restore();
    };
    this.updateMouseInfo = function (mouseInfo) {
        self.mouseInfo = mouseInfo.clone();
        self.mouseInfo.point.y = self.mouseInfo.point.y + BALL_SIZE * 5;
    };
    // グリッド座標から座標に
    this.gridPointToPoint = function (gridPoint) {
        return new Point(gridPoint.x * BALL_SIZE, gridPoint.y * BALL_SIZE);
    };
    // 座標からグリッド座標に
    this.pointToGridPoint = function (point) {
        return new Point(Math.floor(point.x / BALL_SIZE), Math.floor(point.y / BALL_SIZE));
    };
    // 座標にあるボールを取得
    this.getBallAtPoint = function (point) {
        var gridX = Math.floor(point.x / BALL_SIZE);
        var gridY = Math.floor(point.y / BALL_SIZE);
        return self.balls[gridX + gridY * self.hNum];
    };
    // グリッドにあるボールを取得
    this.getBallAtGridPoint = function (gridPoint) {
        if (gridPoint.x < 0 || gridPoint.x >= self.hNum || gridPoint.y < 0 || gridPoint.y >= self.vNum) {
            return null;
        }
        return self.balls[gridPoint.x + gridPoint.y * self.hNum];
    };
    // グリッドにあるボールを削除
    this.deleteBallAtGridPoint = function (gridPoint) {
        self.balls[gridPoint.x + gridPoint.y * self.hNum] = null;
    };
    // グリッドにあるボールを設定
    this.setBallAtGridPoint = function (ball, gridPoint) {
        if (ball != null)
            ball.point = self.gridPointToPoint(gridPoint);
        self.balls[gridPoint.x + gridPoint.y * self.hNum] = ball;
    };
    // ボールのグリッド座標を取得
    this.getBallGridPoint = function (ball) {
        return new Point(Math.floor((ball.point.x + BALL_SIZE / 2) / BALL_SIZE), Math.floor((ball.point.y + BALL_SIZE / 2) / BALL_SIZE));
    };
    this.setMoveMode = function (moveMode) {
        switch (moveMode) {
            case MoveMode.NORMAL:
                self.isCtwMode = false;
                break;
            case MoveMode.CTW5:
                self.isCtwMode = true;
                self.ctwTimeLimit = 30 * 5;
                break;
            case MoveMode.CTW7:
                self.isCtwMode = true;
                self.ctwTimeLimit = 30 * 7;
                break;
            case MoveMode.CTW10:
                self.isCtwMode = true;
                self.ctwTimeLimit = 30 * 10;
                break;
        }
    };
    // 落下するべきボールに落下情報を設定 
    this.checkBallToDropping = function () {
        var existsArray = new Array(self.vNum * self.hNum);
        // console.log("checkBallToDropping");
        for (var y = self.vNum - 1; y >= 0; --y) {
            for (var x = 0; x < self.hNum; ++x) {
                // 下側で落下できる箇所を判定
                var ball = self.getBallAtGridPoint(new Point(x, y));
                if (ball != null) {
                    // 底にあるなら
                    if (y >= self.vNum - 1) {
                        existsArray[x + y * self.hNum] = true;
                    }
                    else {
                        // 底ではないけど1つ下に存在するなら
                        if (existsArray[x + (y + 1) * self.hNum] != null) {
                            existsArray[x + y * self.hNum] = true;
                        }
                        // 底ではないし1つ下も存在しないなら落下
                        else {
                            var dropGrid = 0;
                            for (var yy = y; ; ++yy) {
                                if (yy >= self.vNum - 1 || existsArray[x + (yy + 1) * self.hNum] != null) {
                                    existsArray[x + yy * self.hNum] = true;
                                    ball.dropGrid = dropGrid;
                                    ball.setState(BallState.DROPPING);
                                    break;
                                } else {
                                    ++dropGrid;
                                }
                            }
                        }
                    }
                }
            }
        }
    };
};

/**
 * ドロップ編集時用Strategy
 * @class
 * @constructor
 * @param {Object} parent FieldSceneのオブジェクト 
 */
var FieldStrategyDropEdit = function (parent) {
    var self = this;
    this.lastSetGrid = null;
    this.lastSetColor = null;
    this.initialize = function () { };
    this.finalize = function () { };
    /**
     * 更新関数。
     * クリックorクリックしたままドラッグされたらそのセルにドロップを設置する。
     */
    this.update = function () {
        // console.log("FieldStrategyDropEdit.update");
        // ボタンが押されている
        if (parent.mouseInfo.pressed) {
            var gridPoint = parent.pointToGridPoint(parent.mouseInfo.point);
            var selectedColor = getSelectedColor();
            var doSet = true;
            // 同じグリッドに同じ色を何度も置かないように
            if (self.lastSetGrid != null) {
                if (self.lastSetGrid.x == gridPoint.x && self.lastSetGrid.y == gridPoint.y && self.lastSetColor == selectedColor) {
                    doSet = false;
                }
            }
            if (doSet) {
                parent.deleteBallAtGridPoint(gridPoint);
                var ball = new Ball(parent.gridPointToPoint(gridPoint), selectedColor, BALL_SIZE);
                parent.setBallAtGridPoint(ball, gridPoint);
                self.lastSetGrid = gridPoint.clone();
                self.lastSetColor = selectedColor;
            }
        }
    };
};

/**
 * ドロップ消去用Strategy
 * @class
 * @constructor
 * @param {Object} parent FieldSceneのオブジェクト 
 * @param {Boolean} fallNewDrop 上から新しいドロップを落とすか 
 * @param {Boolean} recordPlay 録再生によるものか。これがtrueの場合は最後にコンボ数の反映を行わない。 
 */
var FieldStrategyDropDelete = function (parent, fallNewDrop, recordPlay) {
    var Mode = {
        WAITING: 0,
        TRY_DELETE: 1,
        DELETING: 2,
        TRY_DROP: 3,
        DROPPING: 4
    };
    var self = this;
    self.mode = Mode.TRY_DELETE;
    self.modeFrameCount = 0;
    // 上から新しいブロックを降らせない場合は、画面外に存在するドロップを削除しておく
    if (!fallNewDrop) {
        for (var y = 0; y < 5; ++y) {
            for (var x = 0; x < parent.hNum; ++x) {
                parent.balls[x + y * parent.hNum] = null;
            }
        }
    }
    this.initialize = function () { };
    this.finalize = function () {
        parent.combos = new Array();
        for (var i = 0; i < BallColor.NUM; ++i) {
            parent.deletedColors[i] = false;
        }
        parent.slantMove = false;
    };
    this.update = function () {
        var i;
        for (i = 0; i < parent.balls.length; ++i) {
            if (parent.balls[i] != null)
                parent.balls[i].update();
        }
        for (i = 0; i < parent.combos.length; ++i) {
            parent.combos[i].update();
        }
        switch (self.mode) {
            case Mode.WAITING: break;
            case Mode.TRY_DELETE: self.updateTryDelete(); break;
            case Mode.DELETING: self.updateDeleting(); break;
            case Mode.TRY_DROP: self.updateTryDrop(); break;
            case Mode.DROPPING: self.updateDropping(); break;
        }
        ++self.modeFrameCount;
    };
    this.updateTryDelete = function () {
        // ブロックを走査して消えるもの一覧を取得。
        try {
            // 下半分の分のブロックを取得し消去チェック関数に渡す
            var checkBalls = parent.balls.slice(parent.hNum * parent.vNum / 2, parent.hNum * parent.vNum);
            // 消去ブロック一覧を取得(一気に消さずに順番に消す)
            var deleteLists = createDeleteList(checkBalls, parent.hNum, parent.vNum / 2);
            // 何も消せるものがなければWAITINGに
            if (deleteLists.length == 0) {
                self.mode = Mode.WAITING;
                self.modeFrameCount = 0;
                if (self.deleteFinished) {
                    self.deleteFinished();
                }
                updateInfo();
            }
            else {
                // 消去マークをブロックに設定
                for (var i = 0; i < deleteLists.length; ++i) {
                    var comboPoint = null;
                    var startFrame = 15 * (i + 1);
                    var comboLeft = Number.MAX_VALUE;
                    var comboTop = Number.MAX_VALUE;
                    var comboRight = 0;
                    var comboBottom = 0;
                    for (var j = 0; j < deleteLists[i].length; ++j) {
                        var ball = parent.getBallAtGridPoint(new Point(deleteLists[i][j].x, deleteLists[i][j].y + parent.vNum / 2));
                        parent.deletedColors[ball.color] = true;
                        ball.setState(BallState.DELETING);
                        ball.frameCountToDelete = startFrame;
                        comboLeft = Math.min(comboLeft, ball.point.x);
                        comboTop = Math.min(comboTop, ball.point.y);
                        comboRight = Math.max(comboRight, ball.point.x);
                        comboBottom = Math.max(comboBottom, ball.point.y);
                    }
                    comboPoint = new Point((comboLeft + comboRight) / 2 + BALL_SIZE / 2, (comboTop + comboBottom) / 2 + BALL_SIZE / 2);
                    parent.combos.push(new Combo(parent.combos.length + 1, comboPoint, startFrame - 12));
                }
                self.mode = Mode.DELETING;
                self.modeFrameCount = 0;
            }
        } catch (e) {
            console.log("updateTryDelete\n" + e + "\n");
        }
    };
    this.updateDeleting = function () {
        try {
            // DELETINGなブロックが無くなったらDELETEDなブロックをnullにしてTRY_DROPに
            var allDeleted = true;
            (function () {
                for (var i = 0; i < parent.balls.length; ++i) {
                    if (parent.balls[i] != null && parent.balls[i].state == BallState.DELETING) {
                        allDeleted = false;
                        break;
                    }
                }
            })();
            if (allDeleted) {
                for (var i = 0; i < parent.balls.length; ++i) {
                    if (parent.balls[i] != null && parent.balls[i].state == BallState.DELETED) {
                        parent.balls[i] = null;
                    }
                }
                self.mode = Mode.TRY_DROP;
                self.modeFrameCount = 0;
            }
        } catch (e) {
            console.log("Field.updateDeleting\n" + e + "\n");
        }
    };
    this.updateTryDrop = function () {
        // ブロック落下設定。
        try {
            // 下側のブロックから自分の落下地点を計算してそこにXXフレームで到達する速度を算出。
            // 落下地点判定は下側のブロックから落下場所を埋めながら上側のへ見ていく
            parent.checkBallToDropping();
            self.mode = Mode.DROPPING;
            self.modeFrameCount = 0;
        } catch (e) {
            console.log("Field.updateTryDrop\n" + e + "\n");
        }
    };
    this.updateDropping = function () {
        // ブロック落下処理。ブロックの補充も。
        try {
            // 落下中のブロックがなくなったらブロックのグリッド座標確定してブロック補充してもう一回TRY_DELETEに
            var allDroped = true;
            (function () {
                for (var i = 0; i < parent.balls.length; ++i) {
                    if (parent.balls[i] != null && parent.balls[i].state == BallState.DROPPING) {
                        allDroped = false;
                        break;
                    }
                }
            })();
            if (allDroped) {
                // スワップ用の配列にコピー
                var tmpBalls = new Array();
                (function () {
                    for (var i = 0; i < parent.balls.length; ++i) {
                        tmpBalls.push(parent.balls[i]);
                        parent.balls[i] = null;
                    }
                })();
                // グリッド位置を更新
                (function () {
                    for (var i = 0; i < tmpBalls.length; ++i) {
                        if (tmpBalls[i] != null) {
                            parent.setBallAtGridPoint(tmpBalls[i], parent.pointToGridPoint(tmpBalls[i].point));
                        }
                    }
                })();
                // nullの場所にドロップ生成
                if (fallNewDrop) {
                    for (var y = 0; y < parent.vNum; ++y) {
                        for (var x = 0; x < parent.hNum; ++x) {
                            if (parent.balls[x + y * parent.hNum] == null) {
                                var color = parent.random.nextInt(0, /*BallColor.NUM*/ 6);
                                parent.balls[x + y * parent.hNum] = new Ball(parent.gridPointToPoint(new Point(x, y)), color, BALL_SIZE);
                            }
                        }
                    }
                }
                // もう一度TRY_DROPに
                self.mode = Mode.TRY_DELETE;
                self.modeFrameCount = 0;
            }
        } catch (e) {
            console.log("Field.updateDropping\n" + e + "\n");
        }
    };
};

/**
 * ドロップ移動用Strategy
 * @class
 * @constructor
 * @param {Object} parent FieldSceneのオブジェクト 
 * @param {Boolean} recordPlay lastRouteを再生するか？
 */
var FieldStrategyDropMove = function (parent, recordPlay) {
    var Mode = {
        WAITING: 0,
        MOVING: 1
    };
    var self = this;
    self.recordPlay = recordPlay;
    self.mode = Mode.WAITING;
    self.modeFrameCount = 0;
    self.recordPlayMouseInfo = null;
    self.recordRouteInfos = null;
    self.recordRouteInfo = null;
    self.recordRouteIndex = 0;
    self.frameToRecordPlayStart = -1;
    self.recordPlayFrameCount = 0;
    self.tmpRouteInfo = null;
    var MovingInfo = function () {
        this.lastMousePoint = null;
    };
    this.initialize = function () {
        parent.moveNum = 0;
        for (var i = 0; i < BallColor.NUM; ++i) {
            parent.deletedColors[i] = false;
        }
        parent.slantMove = false;
        parent.ctwTimer = 0;
        parent.ctwTimerStarted = false;
        parent.routeInfos = new Array();
    };
    this.finalize = function () {
        parent.movingBall = null;
    };
    this.update = function () {
        var i;
        for (i = 0; i < parent.balls.length; ++i) {
            if (parent.balls[i] != null)
                parent.balls[i].update();
        }
        if (recordPlay) {
            self.updateRecordPlayMouseInfo();
        }
        switch (self.mode) {
            case Mode.WAITING:
                self.updateWaiting();
                break;
            case Mode.MOVING:
                self.updateMoving();
                break;
        }
        if (parent.isCtwMode && parent.ctwTimerStarted) {
            // console.log("ctwTimer=" + parent.ctwTimer);
            ++parent.ctwTimer;
        }
        ++self.modeFrameCount;
    };
    this.updateRecordPlayMouseInfo = function () {
        // -1指定の場合はRecordPlayしない
        if (self.frameToRecordPlayStart == -1) {
            return;
        }
        // 1以上の場合はデクリメントしていって0になったらRecordPlay開始
        if (self.frameToRecordPlayStart >= 1) {
            --self.frameToRecordPlayStart;
            if (self.frameToRecordPlayStart >= 1) {
                return;
            }
        }
        // 開始座標とルートを展開
        if (self.recordPlayFrameCount == 0) {
            self.recordRouteInfos = parseRouteInfo(parent.lastRoute);
            self.recordRouteInfo = self.recordRouteInfos[self.recordRouteIndex];
            if (parent.isCtwMode) {
                self.recordPlayFrameCount = 2;
            }
        }
        // ドロップをつかむ開始
        if (self.recordPlayFrameCount == 8) {
            self.recordPlayMouseInfo = new MouseInfo();
            self.recordPlayMouseInfo.point = new Point(self.recordRouteInfo.startGrid.x * BALL_SIZE + BALL_SIZE / 2, self.recordRouteInfo.startGrid.y * BALL_SIZE + BALL_SIZE / 2);
            self.recordPlayMouseInfo.lastPressed = false;
            self.recordPlayMouseInfo.pressed = true;
            if (parent.isCtwMode) {
                self.recordPlayFrameCount = 18;
            }
        }
        var FRAME_TO_MOVE = 9;      // 何フレームで1マス進むか
        var SPEED = BALL_SIZE / FRAME_TO_MOVE;
        // 移動開始
        if (self.recordPlayFrameCount >= 24) {
            var routeIndex = Math.floor((self.recordPlayFrameCount - 24) / Math.floor(FRAME_TO_MOVE));
            // もう存在しないならボタン離す
            if (routeIndex >= self.recordRouteInfo.route.length) {
                self.recordPlayMouseInfo.lastPressed = true;
                self.recordPlayMouseInfo.pressed = false;
                // 次のルートがあるなら設定しとく
                if (self.recordRouteIndex < self.recordRouteInfos.length - 1) {
                    self.recordPlayFrameCount = 0;
                }
                ++self.recordRouteIndex;
                return;
            } else {
                self.recordPlayMouseInfo.lastPressed = true;
                self.recordPlayMouseInfo.pressed = true;
            }
            var direction8 = self.recordRouteInfo.route[routeIndex];
            switch (direction8) {
                // 上下左右
                case Direction8.TENKEY_4:
                    self.recordPlayMouseInfo.point.x -= SPEED;
                    break;
                case Direction8.TENKEY_8:
                    self.recordPlayMouseInfo.point.y -= SPEED;
                    break;
                case Direction8.TENKEY_6:
                    self.recordPlayMouseInfo.point.x += SPEED;
                    break;
                case Direction8.TENKEY_2:
                    self.recordPlayMouseInfo.point.y += SPEED;
                    break;
                // 斜め
                case Direction8.TENKEY_1:
                    self.recordPlayMouseInfo.point.x -= SPEED;
                    self.recordPlayMouseInfo.point.y += SPEED;
                    break;
                case Direction8.TENKEY_3:
                    self.recordPlayMouseInfo.point.x += SPEED;
                    self.recordPlayMouseInfo.point.y += SPEED;
                    break;
                case Direction8.TENKEY_7:
                    self.recordPlayMouseInfo.point.x -= SPEED;
                    self.recordPlayMouseInfo.point.y -= SPEED;
                    break;
                case Direction8.TENKEY_9:
                    self.recordPlayMouseInfo.point.x += SPEED;
                    self.recordPlayMouseInfo.point.y -= SPEED;
                    break;
            }
        }
        ++self.recordPlayFrameCount;
    };
    this.updateWaiting = function () {
        var mouseInfo = recordPlay ? self.recordPlayMouseInfo : parent.mouseInfo;
        // マウスが押されたら
        if (mouseInfo && mouseInfo.pressed) {
            // console.log("pressed");
            self.movingInfo = new MovingInfo();
            self.movingInfo.lastMousePoint = mouseInfo.point.clone();
            parent.movingBall = parent.getBallAtPoint(mouseInfo.point);
            parent.movingBall.setState(BallState.MOVING);
            if (self.mode == Mode.WAITING) {
                self.mode = Mode.MOVING;
                // ctwモードの場合はWAITING->MOVINGになった瞬間にタイマーリセット
                if (parent.isCtwMode && !parent.ctwTimerStarted) {
                    parent.ctwTimer = 0;
                    parent.ctwTimerStarted = true;
                }
            }
            self.modeFrameCount = 0;
            // 記録
            if (!recordPlay) {
                self.tmpRouteInfo = new RouteInfo();
                self.tmpRouteInfo.startGrid = parent.pointToGridPoint(parent.movingBall.point);
            }
        }
        // CTWモードで且つ再生モードでないなら、CTW操作時間オーバーを検出しドロップ消去用Strategyへ
        var ctwTimeOver = parent.ctwTimer >= parent.ctwTimeLimit;
        if (!recordPlay) {
            if (parent.isCtwMode && ctwTimeOver) {
                parent.saveRoute();
                parent.setStrategy(new FieldStrategyDropDelete(parent, false, recordPlay));
            }
        }
    };
    this.lastGridPoint = null;
    this.updateMoving = function () {
        var mouseInfo = recordPlay ? self.recordPlayMouseInfo : parent.mouseInfo;
        try {
            var mouseMoved = mouseInfo && mouseInfo.point.x != self.movingInfo.lastMousePoint.x || mouseInfo.point.y != self.movingInfo.lastMousePoint.y;
            var mouseReleased = mouseInfo && !mouseInfo.pressed;
            var ctwTimeOver = parent.ctwTimer >= parent.ctwTimeLimit;
            // CTWモードでは時間切れの場合に強制的にマウスが離された事にする。
            if (!recordPlay) {
                if (parent.isCtwMode && ctwTimeOver) {
                    mouseMoved = false;
                    mouseReleased = true;
                }
            }
            // マウスが動いたら
            if (mouseMoved) {
                // マウス移動の差分だけボールを移動
                var movePoint = new Point(mouseInfo.point.x - self.movingInfo.lastMousePoint.x, mouseInfo.point.y - self.movingInfo.lastMousePoint.y);
                self.movingInfo.lastMousePoint = mouseInfo.point.clone();
                if (self.lastGridPoint == null)
                    self.lastGridPoint = parent.getBallGridPoint(parent.movingBall);
                parent.movingBall.point.x += movePoint.x;
                parent.movingBall.point.y += movePoint.y;
                // ボールの位置を範囲外に行かないように補正
                parent.movingBall.point.x = Math.min(Math.max(parent.movingBall.point.x, - BALL_SIZE + BALL_SIZE / 2 + 1), BALL_SIZE * parent.hNum - (BALL_SIZE / 2 + 1));
                parent.movingBall.point.y = Math.min(Math.max(parent.movingBall.point.y, BALL_SIZE * (parent.vNum / 2 - 1) + BALL_SIZE / 2 + 1), BALL_SIZE * parent.vNum - (BALL_SIZE / 2 + 1));
                var newGridPoint = parent.getBallGridPoint(parent.movingBall);
                var direction = getDirectionByGridPoints(self.lastGridPoint, newGridPoint);
                var angle = getAngleByPoints(parent.gridPointToPoint(self.lastGridPoint), parent.movingBall.point);
                var angleIsSlant = (angle > (90 * 0) + 45 - 15 && angle < (90 * 0) + 45 + 15) || (angle > (90 * 1) + 45 - 15 && angle < (90 * 1) + 45 + 15) || (angle > (90 * 2) + 45 - 15 && angle < (90 * 2) + 45 + 15) || (angle > (90 * 3) + 45 - 15 && angle < (90 * 3) + 45 + 15);
                // ボールの存在グリッドが変わったかを判定
                if (self.lastGridPoint.x != newGridPoint.x || self.lastGridPoint.y != newGridPoint.y) {
                    var slantMove = (direction == Direction8.TENKEY_1) || (direction == Direction8.TENKEY_3) || (direction == Direction8.TENKEY_7) || (direction == Direction8.TENKEY_9);
                    // 移動した角度が45度に近い場合は斜め移動以外は移動を保留
                    if (!slantMove && angleIsSlant) {
                        return;
                    }
                    ++parent.moveNum;
                    parent.slantMove = slantMove ? true : parent.slantMove;
                    // 新しいグリッドに存在するボールを前のグリッドに移動する
                    var ball = parent.getBallAtGridPoint(newGridPoint);
                    // console.log(ball);
                    parent.deleteBallAtGridPoint(newGridPoint);
                    parent.setBallAtGridPoint(ball, self.lastGridPoint);
                    self.lastGridPoint = newGridPoint.clone();
                    // 記録
                    if (!recordPlay) {
                        self.tmpRouteInfo.route.push(direction);
                    }
                    updateInfo();
                }
            }
            // マウスが離されたら
            if (mouseReleased) {
                var gridPoint = parent.getBallGridPoint(parent.movingBall);
                var tagetBall = parent.getBallAtGridPoint(gridPoint);
                parent.setBallAtGridPoint(parent.movingBall, gridPoint);
                parent.movingBall.setState(BallState.NORMAL);
                self.movingInfo = null;
                parent.movingBall = null;
                self.mode = Mode.WAITING;
                self.modeFrameCount = 0;
                self.lastGridPoint = null;
                // 記録中でない
                if (!recordPlay)
                    parent.routeInfos.push(self.tmpRouteInfo);
                // ドロップ消去用Strategyへ
                // 「非CTWモード」の場合は再生モード、操作モード共に消去Strategyに
                if (!parent.isCtwMode) {
                    if (!recordPlay)
                        parent.saveRoute();
                    parent.setStrategy(new FieldStrategyDropDelete(parent, false, recordPlay));
                }
                // 「CTWモード」の場合は再生モード時は時間切れで消去Strategyに、操作モード時は操作の完了を以て消去Strategyに
                else {
                    if (!recordPlay) {
                        if (ctwTimeOver) {
                            parent.saveRoute();
                            parent.setStrategy(new FieldStrategyDropDelete(parent, false, recordPlay));
                        }
                    } else {
                        // 普通に考えるとlastRoute = self.recordRouteIndex == self.recordRouteInfos.length;とするべきだがself.recordRouteIndexは操作再生の処理で一足先にインクリメントされているので。
                        var lastRoute = self.recordRouteIndex == self.recordRouteInfos.length;
                        console.log(self.recordRouteIndex + "," + self.recordRouteInfos.length);
                        if (lastRoute) {
                            parent.setStrategy(new FieldStrategyDropDelete(parent, false, recordPlay));
                        }
                    }
                }
                return;
            }
        } catch (e) {
            console.log("Field.updateMoving\n" + e + "\n");
        }
    };
};

var Ball = function (point, color, size) {
    var self = this;
    this.state = BallState.NORMAL;
    this.point = point;
    this.color = color;
    this.size = size;
    this.stateFrameCount = 0;
    this.alpha = 1.0;
    // this.alpha = 0.05;
    this.frameCountToDelete = 15;
    this.dropGrid = 0;
    this.frameCountToDropEnd = 16;
    this.setState = function (state) {
        self.state = state;
        self.stateFrameCount = 0;
        if (self.state == BallState.MOVING) {
            self.alpha = 0.5;
        }
        else if (self.state == BallState.DELETED) {
            self.alpha = 0.0;
        }
        else {
            self.alpha = 1.0;
        }
    };
    this.update = function () {
        if (self.state == BallState.DELETING) {
            if (self.stateFrameCount >= self.frameCountToDelete - 15) {
                self.alpha = 1.0 * (self.frameCountToDelete - self.stateFrameCount) / 15.0;
            }
            if (self.stateFrameCount >= self.frameCountToDelete) {
                self.setState(BallState.DELETED);
            }
        }
        else if (self.state == BallState.DROPPING) {
            self.point.y = self.point.y + (self.size / self.frameCountToDropEnd) * self.dropGrid;
            if (self.stateFrameCount == self.frameCountToDropEnd - 1) {
                self.setState(BallState.NORMAL);
            }
        }
        ++self.stateFrameCount;
    };
};

var BallState = {
    NORMAL: 0,
    MOVING: 1,
    DELETING: 2,
    DELETED: 3
};

var Combo = function (count, point, startFrame) {
    var self = this;
    this.count = count;
    this.point = point;
    this.startFrame = startFrame;
    this.frameCount = 0;
    this.scale = 5.0;
    this.alpha = 0.0;
    this.text = self.count + " Combo";
    this.textWidth = null;
    this.rgb = "rgb(255,0,0)";
    this.state = ComboState.WAITING;
    this.update = function () {
        if (self.state >= ComboState.STARTED) {
            if (self.state == ComboState.STARTED) {
                self.scale -= 0.30;
                self.alpha += 0.03;
                if (self.scale < 1.0) {
                    self.scale = 1.0;
                }
                if (self.alpha > 1.0) {
                    self.alpha = 1.0;
                }
            }
            else if (self.state == ComboState.DELETING) {
                self.scale += 0.20;
                self.alpha -= 0.08;
                if (self.alpha < 0.0) {
                    self.alpha = 0.0;
                    self.state = ComboState.DELETED;
                }
            }
            switch (self.frameCount % 6) {
                case 0: self.rgb = "rgb(255,100,100)"; break;
                case 1: self.rgb = "rgb(255,255,100)"; break;
                case 2: self.rgb = "rgb(100,255,100)"; break;
                case 3: self.rgb = "rgb(100,255,255)"; break;
                case 4: self.rgb = "rgb(100,100,255)"; break;
                case 5: self.rgb = "rgb(255,100,255)"; break;
            }
        }
        if (self.state == ComboState.WAITING && self.frameCount > self.startFrame) {
            self.state = ComboState.STARTED;
        }
        if (self.state == ComboState.STARTED && self.frameCount > self.startFrame + 60) {
            self.state = ComboState.DELETING;
        }
        ++self.frameCount;
    };
    this.draw = function (canvas) {
        try {
            if (self.state == ComboState.WAITING || self.state == ComboState.DELETED || count <= 1) {
                return;
            }
            var ctx = canvas.getContext('2d');
            ctx.save();
            ctx.globalAlpha = self.alpha;
            // 影の色
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            // ぼかしのサイズ
            ctx.shadowBlur = 1;
            // X方向のオフセット
            ctx.shadowOffsetX = 2;
            // Y方向のオフセット
            ctx.shadowOffsetY = 2;

            ctx.font = "bold 16px Arial";
            ctx.textBaseline = "middle";
            ctx.lineWidth = 0.5;
            ctx.fillStyle = self.rgb;
            ctx.translate(self.point.x, self.point.y);
            ctx.scale(self.scale, self.scale);
            if (self.textWidth == null)
                self.textWidth = ctx.measureText(self.text).width;
            ctx.fillText(self.text, - self.textWidth / 2, 0);
            ctx.restore();
        } catch (e) {
            debugTrace(e);
        }
    };
};

var ComboState = {
    WAITING: 0,
    STARTED: 1,
    DELETING: 2,
    DELETED: 3
};

var RouteInfo = function () {
    this.startGrid = new Point(0, 0);
    this.route = new Array();
};
