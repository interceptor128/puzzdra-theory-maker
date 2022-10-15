var touchDevice = false;
if (navigator.userAgent.indexOf('iPhone') > 0
    || navigator.userAgent.indexOf('iPod') > 0
    || navigator.userAgent.indexOf('iPad') > 0
    || navigator.userAgent.indexOf('Android') > 0) {
    touchDevice = true;
}

/**
* 点情報クラス
* @classs
* @constructor
*/
var Point = function (x, y) {
    var self = this;
    this.x = x;
    this.y = y;
    this.clone = function () {
        return new Point(self.x, self.y);
    };
};

/**
* マウス情報クラス
* @classs
* @constructor
*/
var MouseInfo = function () {
    var self = this;
    this.point = new Point();
    this.lastPressed = false;
    this.pressed = false;
    this.clone = function () {
        var ret = new MouseInfo();
        ret.point = self.point.clone();
        ret.pressed = self.pressed;
        ret.lastPressed = self.lastPressed;
        return ret;
    };
};

var BALL_SIZE = touchDevice ? 52 : 64;

var BallColor = {
    RED: 0,
    BLUE: 1,
    GREEN: 2,
    LIGHT: 3,
    DARK: 4,
    LIFE: 5,
    OZYAMA: 6,
    BOMB: 7,
    POISON: 8,
    POISON2: 9,
    NUM: 10
};

var Direction8 = {
    TENKEY_1: 0,
    TENKEY_2: 1,                   // ↓
    TENKEY_3: 2,
    TENKEY_4: 3,                   // ←
    TENKEY_6: 4,                   // →
    TENKEY_7: 5,
    TENKEY_8: 6,                   // ↑
    TENKEY_9: 7
};

// 全体で共通の情報
var ImageResource = {
    BALL_RED: null,
    BALL_GREEN: null,
    BALL_BLUE: null,
    BALL_LIGHT: null,
    BALL_DARK: null,
    BALL_LIFE: null,
    BALL_POISON: null,
    BALL_OZYAMA: null,
    BALL_BOMB: null,
    BALL_POISON2: null,
    TITLE_01: null,
};

ImageResource.BALL_RED = new Image();
ImageResource.BALL_RED.src = "images/1_block_fire.webp";
ImageResource.BALL_BLUE = new Image();
ImageResource.BALL_BLUE.src = "images/2_block_water.webp";
ImageResource.BALL_GREEN = new Image();
ImageResource.BALL_GREEN.src = "images/3_block_tree.webp";
ImageResource.BALL_LIGHT = new Image();
ImageResource.BALL_LIGHT.src = "images/4_block_light.webp";
ImageResource.BALL_DARK = new Image();
ImageResource.BALL_DARK.src = "images/5_block_dark.webp";
ImageResource.BALL_LIFE = new Image();
ImageResource.BALL_LIFE.src = "images/6_block_life.webp";
ImageResource.BALL_OZYAMA = new Image();
ImageResource.BALL_OZYAMA.src = "images/7_block_obstacle.webp";
ImageResource.BALL_BOMB = new Image();
ImageResource.BALL_BOMB.src = "images/7_block_bomb.webp";
ImageResource.BALL_POISON = new Image();
ImageResource.BALL_POISON.src = "images/8_block_poison.webp";
ImageResource.BALL_POISON2 = new Image();
ImageResource.BALL_POISON2.src = "images/8_block_deadly-poison.webp";

// ブロックのつながりを調べて削除情報を作成
function createDeleteList(blocks, hNum, vNum) {
    var Info = function (gridPoints, color, isVertical) {
        this.gridPoints = gridPoints;
        this.color = color;
        this.isVertical = isVertical;   // 縦並びか
        this.marked = false;         // 調査済みか
    };
    try {
        var deleteBlocksList = new Array();
        // 縦方向でつながっているものをすべて取得
        (function () {
            for (var x = 0; x < hNum; ++x) {
                var color = -1;
                var startIndex = 0;
                var tmpArray = null;
                for (var y = 0; y < vNum; ++y) {
                    var ball = blocks[x + y * hNum];
                    if (ball != null && ball.color == color) {
                        // 3つ以上連続した
                        if (y - startIndex >= 2) {
                            // ちょうど3つ目なら入れるための配列作成し3つ入れる
                            if (y - startIndex == 2) {
                                tmpArray = new Array();
                                for (var tmp = startIndex; tmp <= y; ++tmp) {
                                    tmpArray.push(new Point(x, tmp));
                                }
                            }
                            // それより大きいなら作成済みの配列に追加
                            else {
                                tmpArray.push(new Point(x, y));
                            }
                        }
                        // 最後のインデックスならtmpArrayが存在したら追加
                        if (y == vNum - 1) {
                            if (tmpArray != null) {
                                deleteBlocksList.push(new Info(tmpArray, color, true));
                                tmpArray = null;
                            }
                        }
                    } else {
                        // 色が違う状態でtmpArrayが存在したら追加
                        if (tmpArray != null) {
                            deleteBlocksList.push(new Info(tmpArray, color, true));
                            tmpArray = null;
                        }
                        color = ball != null ? ball.color : -1;
                        startIndex = y;
                    }
                }
            }
        })();
        // 横方向でつながっているものをすべて取得
        (function () {
            for (var y = 0; y < vNum; ++y) {
                var color = -1;
                var startIndex = 0;
                var tmpArray = null;
                for (var x = 0; x < hNum; ++x) {
                    var ball = blocks[x + y * hNum];
                    if (ball != null && ball.color == color) {
                        // 3つ以上連続した
                        if (x - startIndex >= 2) {
                            // ちょうど3つ目なら入れるための配列作成し3つ入れる
                            if (x - startIndex == 2) {
                                tmpArray = new Array();
                                for (var tmp = startIndex; tmp <= x; ++tmp) {
                                    tmpArray.push(new Point(tmp, y));
                                }
                            }
                            // それより大きいなら作成済みの配列に追加
                            else {
                                tmpArray.push(new Point(x, y));
                            }
                        }
                        // 最後のインデックスならtmpArrayが存在したら追加
                        if (x == hNum - 1) {
                            if (tmpArray != null) {
                                deleteBlocksList.push(new Info(tmpArray, color, false));
                                tmpArray = null;
                            }
                        }
                    } else {
                        // 色が違う状態でtmpArrayが存在したら追加
                        if (tmpArray != null) {
                            deleteBlocksList.push(new Info(tmpArray, color, false));
                            tmpArray = null;
                        }
                        color = ball != null ? ball.color : -1;
                        startIndex = x;
                    }
                }
            }
        })();
        var ret = new Array();
        // 重複を除いて追加
        function concatArray(arr1, arr2) {
            for (var i = 0; i < arr2.length; ++i) {
                var found = false;
                for (var j = 0; j < arr1.length; ++j) {
                    if (arr1[j].x == arr2[i].x && arr1[j].y == arr2[i].y) {
                        found = true;
                    }
                }
                if (!found) {
                    arr1.push(arr2[i]);
                }
            }
        };
        // 重なるかどうかを判定
        function checkOverlap(list1, list2) {
            for (var i = 0; i < list1.length; ++i) {
                for (var j = 0; j < list2.length; ++j) {
                    if ((Math.abs(list1[i].x - list2[j].x) <= 1 && list1[i].y == list2[j].y) || (Math.abs(list1[i].y - list2[j].y) <= 1 && list1[i].x == list2[j].x)) {
                        return true;
                    }
                }
            }
            return false;
        };
        // マージ
        (function () {
            // markされてないブロック群を一つ選んで他のmarkされてないブロック群と比べて隣接してたらマージして
            function traverse(deleteBlocks, list) {
                if (deleteBlocks.marked) {
                    return;
                } else {
                    deleteBlocks.marked = true;
                }
                // まずはblocksの中身をlistに追加
                concatArray(list, deleteBlocks.gridPoints);
                for (var i = 0; i < deleteBlocksList.length; ++i) {
                    // 同じ色の消えるドロップ群でマークしてないのがあれば
                    if (!deleteBlocksList[i].marked && deleteBlocks.color == deleteBlocksList[i].color) {
                        // 重なるかどうかを調査し、重なるならそいつ自身を指定してtraverseを再起的に呼び出す
                        if (checkOverlap(deleteBlocks.gridPoints, deleteBlocksList[i].gridPoints)) {
                            traverse(deleteBlocksList[i], list);
                        }
                    }
                }
            };
            for (; ;) {
                var allMarked = true;
                for (var j = 0; j < deleteBlocksList.length; ++j) {
                    if (!deleteBlocksList[j].marked) {
                        var list = new Array();
                        traverse(deleteBlocksList[j], list);
                        ret.push(list);
                        allMarked = false;
                    }
                }
                if (allMarked) {
                    console.log("allMarked");
                    break;
                }
            }
        })();
        return ret;
    } catch (e) {
        console.log("createDeleteList/n" + e);
        return ret;
    }
};
function getDirectionByGridPoints(oldGridPoint, newGridPoint) {
    // 右
    if (newGridPoint.x > oldGridPoint.x) {
        // 右
        if (newGridPoint.y == oldGridPoint.y) {
            return Direction8.TENKEY_6;
        }
        // 右下
        else if (newGridPoint.y > oldGridPoint.y) {
            return Direction8.TENKEY_3;
        }
        // 右上
        else if (newGridPoint.y < oldGridPoint.y) {
            return Direction8.TENKEY_9;
        }
    }
    // 左
    else if (newGridPoint.x < oldGridPoint.x) {
        // 左
        if (newGridPoint.y == oldGridPoint.y) {
            return Direction8.TENKEY_4;
        }
        // 左下
        else if (newGridPoint.y > oldGridPoint.y) {
            return Direction8.TENKEY_1;
        }
        // 左上
        else if (newGridPoint.y < oldGridPoint.y) {
            return Direction8.TENKEY_7;
        }
    }
    // 上下
    else {
        // 下
        if (newGridPoint.y > oldGridPoint.y) {
            return Direction8.TENKEY_2;
        }
        // 上
        else if (newGridPoint.y < oldGridPoint.y) {
            return Direction8.TENKEY_8;
        }
    }
    return null;
}
function getAngleByPoints(lhs, rhs) {
    var offsetX = rhs.x - lhs.x;
    var offsetY = rhs.y - lhs.y;
    var angle = Math.atan2(offsetY, offsetX) * (180.0 / 3.141592) + 90;
    angle = (angle + 360) % 360;
    return angle;
}

function parseRouteInfo(recordInfoString) {
    var ret = new Array();
    var routesText = recordInfoString.split("/");
    for (var i = 0; i < routesText.length; ++i) {
        var routeText = routesText[i].split(",");
        // 開始座標
        var route = new RouteInfo();
        route.startGrid.x = Number(routeText[0].charAt(0));
        route.startGrid.y = Number(routeText[0].charAt(1));
        // ルート
        for (var j = 0; j < routeText[1].length; ++j) {
            route.route[j] = Number(routeText[1].charAt(j));
        }
        ret.push(route);
    }
    return ret;
}

// Todo! Start,Goalの文字も表示する。
function drawRoute(canvas, routeInfos) {
    var ctx = canvas.getContext('2d');
    for (var ri = 0; ri < routeInfos.length; ++ri) {
        var routeInfo = routeInfos[ri];
        var grids = new Array();
        var currentGrid = routeInfo.startGrid.clone();
        grids.push(currentGrid.clone());
        // グリッド一覧作成
        for (var i = 0; i < routeInfo.route.length; ++i) {
            switch (routeInfo.route[i]) {
                case Direction8.TENKEY_1:
                    currentGrid.x -= 1;
                    currentGrid.y += 1;
                    break;
                case Direction8.TENKEY_2:
                    currentGrid.y += 1;
                    break;
                case Direction8.TENKEY_3:
                    currentGrid.x += 1;
                    currentGrid.y += 1;
                    break;
                case Direction8.TENKEY_4:
                    currentGrid.x -= 1;
                    break;
                case Direction8.TENKEY_6:
                    currentGrid.x += 1;
                    break;
                case Direction8.TENKEY_7:
                    currentGrid.x -= 1;
                    currentGrid.y -= 1;
                    break;
                case Direction8.TENKEY_8:
                    currentGrid.y -= 1;
                    break;
                case Direction8.TENKEY_9:
                    currentGrid.x += 1;
                    currentGrid.y -= 1;
                    break;
            }
            grids.push(currentGrid.clone());
        }
        // グリッドをつなぐ線を描画(輪郭)
        ctx.save();
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.lineWidth = 6;
        ctx.beginPath();
        for (var i = 0; i < grids.length; ++i) {
            if (i == 0) {
                ctx.moveTo(grids[i].x * BALL_SIZE + BALL_SIZE / 2, (grids[i].y - 5) * BALL_SIZE + BALL_SIZE / 2);
            }
            // ２つ先のグリッドが存在するなら
            if (i < grids.length - 2) {
                ctx.arcTo(
                    grids[i + 1].x * BALL_SIZE + BALL_SIZE / 2, (grids[i + 1].y - 5) * BALL_SIZE + BALL_SIZE / 2,
                    grids[i + 2].x * BALL_SIZE + BALL_SIZE / 2, (grids[i + 2].y - 5) * BALL_SIZE + BALL_SIZE / 2,
                    12);
            }
            // １つ先のグリッドが存在するなら
            else if (i < grids.length - 1) {
                ctx.lineTo(grids[i + 1].x * BALL_SIZE + BALL_SIZE / 2, (grids[i + 1].y - 5) * BALL_SIZE + BALL_SIZE / 2);
            }
        }
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
        // グリッドをつなぐ線を描画
        ctx.save();
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (var i = 0; i < grids.length; ++i) {
            if (i == 0) {
                ctx.moveTo(grids[i].x * BALL_SIZE + BALL_SIZE / 2, (grids[i].y - 5) * BALL_SIZE + BALL_SIZE / 2);
            }
            // ２つ先のグリッドが存在するなら
            if (i < grids.length - 2) {
                ctx.arcTo(
                    grids[i + 1].x * BALL_SIZE + BALL_SIZE / 2, (grids[i + 1].y - 5) * BALL_SIZE + BALL_SIZE / 2,
                    grids[i + 2].x * BALL_SIZE + BALL_SIZE / 2, (grids[i + 2].y - 5) * BALL_SIZE + BALL_SIZE / 2,
                    12);
            }
            // １つ先のグリッドが存在するなら
            else if (i < grids.length - 1) {
                ctx.lineTo(grids[i + 1].x * BALL_SIZE + BALL_SIZE / 2, (grids[i + 1].y - 5) * BALL_SIZE + BALL_SIZE / 2);
            }
        }
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
        // 最初の座標に丸を描く
        ctx.save();
        ctx.beginPath();
        ctx.arc(routeInfo.startGrid.x * BALL_SIZE + BALL_SIZE / 2,
            (routeInfo.startGrid.y - 5) * BALL_SIZE + BALL_SIZE / 2,
            7,                              // 半径
            0,
            Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();
        ctx.beginPath();
        ctx.arc(routeInfo.startGrid.x * BALL_SIZE + BALL_SIZE / 2,
            (routeInfo.startGrid.y - 5) * BALL_SIZE + BALL_SIZE / 2,
            6,                              // 半径
            0,
            Math.PI * 2);
        ctx.fillStyle = "orange";
        ctx.fill();
        ctx.closePath();
        ctx.restore();
        // 最後の座標に四角を描く
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.fillRect(currentGrid.x * BALL_SIZE + BALL_SIZE / 2 - 6, (currentGrid.y - 5) * BALL_SIZE + BALL_SIZE / 2 - 6, 12, 12);
        ctx.closePath();
        ctx.beginPath();
        ctx.fillStyle = "orange";
        ctx.fillRect(currentGrid.x * BALL_SIZE + BALL_SIZE / 2 - 5, (currentGrid.y - 5) * BALL_SIZE + BALL_SIZE / 2 - 5, 10, 10);
        ctx.closePath();
        ctx.restore();
    }
};

