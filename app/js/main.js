const {app, BrowserWindow, ipcMain} = require("electron");
const btSerial = new (require("bluetooth-serial-port")).BluetoothSerialPort();
const net = require("net");
const NeDB = require("nedb")

let win;
let db = {actions: "", applied: ""};
const RASPBERRY_PI_ADDRESS = "B8:27:EB:CF:0F:53";

app.on("ready", () => {
    win = new BrowserWindow({
        width: 1000,
        height: 800,
        resizable: false
    });
    win.loadFile("./app/html/template.html");
    win.on("closed", () => {
        win = null;
    });
    createPipe();
    //DBの初期化
    db.actions = new NeDB({
        filename: __dirname + "/../../db/actions.db",
        autoload: true
    });
    db.applied = new NeDB({
        filename: __dirname + "/../../db/applied.db",
        autoload: true
    })
    //addSeedData();
});

app.on("window-all-closed", () => {
    if (process.platform != "darwin") {
        app.quit();
    }
});

//リスト用データの送信
ipcMain.on("REQUEST_ACTION_DATA", (event, arg) => {
    //NeDBからデータを取り出す
    db.actions.find({}, (err, docs) => {
        if (err) return console.log(err);

        event.sender.send("SEND_ACTION_DATA", docs);
    });

});

//プルダウン用データの送信
ipcMain.on("REQUEST_APPLIED_DATA", (event, arg) => {
    //適用データを取得
    db.applied.find({}, (err, applied_docs) => {
        if (err) return console.log(err);

        let applied_list = [];  //適用されているアクションのリスト
        let i = 1;

        //全てのアクションデータを取得
        db.actions.find({}, (err, actions) => {
            if (err) return console.log(err);

            //適用された動作データを取得
            for (applied_doc of applied_docs) {
                //データの取得を待機して実行
                createSendData(applied_doc).then((applied) => {
                    applied_list.push(applied);

                    if (i == applied_docs.length) {
                        //全アクションデータと適用データを送信
                        event.sender.send("SEND_APPLIED_DATA", applied_list, actions);
                    }
                    i++;
                });
            }
        });
    });
});

//動作データのステータスを更新
ipcMain.on("UPDATE_APPLIED_DATA", (event, applied_list, gesture_type) => {
    //エラーチェック
    if (applied_list.length != gesture_type.length) {
        return console.log("length of list is different");
    }

    let name;
    for (let i = 0; i < applied_list.length; i++) {
        //applied_listのIDと等しいnameをactionsから取得する
        db.actions.find({id: applied_list[i]}, 
            (err, docs) => {
                if (err) return console.log(err);

                name = docs[0].name;  
                //dbの情報を更新する
                db.applied.update({id: gesture_type[i]},
                    {$set: {action_id: applied_list[i]}},
                    (err, docs) => {
                        if (err) {
                            return console.log(err);
                        }
                    }
                );
            }
        );
    }
});

//Bluetoothでラズパイへの接続を行う
ipcMain.on("BT_CONNECT", (event, arg) => {
    console.log("start search device");

    //シリアルポートが見つかった際の処理
    btSerial.findSerialPortChannel(RASPBERRY_PI_ADDRESS, (channel) => {
        console.log("find serial port");
        event.sender.send("CHANGE_STATE", "接続中");

        //接続した際の処理
        btSerial.connect(RASPBERRY_PI_ADDRESS, channel, () => {
            console.log("connected!");
            win.loadFile("./app/html/allocation.html");

            //データを送信
            // btSerial.write(new Buffer("my data", "utf-8"), (err, bytesWritten) => {
            //     if (err) console.log(err);
            // });

            //データを受け取った際の処理
            btSerial.on("data", (buffer) => {
                code = buffer.toString("utf-8");
                console.log("code: " + code);

                //受け取ったデータによる処理を開始
                switch(code) {
                    case "IR_FAILED":
                    case null:
                        console.log("IR_FAILED");
                        win.webContents.send("IR_FAILED", "受信できませんでした");
                        break;
                    //ID生成時
                    default:
                        console.log("IR_SUCCESS");
                        win.webContents.send("IR_SUCCESS", code);
                        break;
                }
            });
        }, () => {
            //connectのエラーコールバック
            console.log("cannot connect");
        });

        btSerial.close();
    }, () => {
        //findSerialPortChannelのエラーコールバック
        console.log("found nothing");
        event.sender.send("BT_FAILED", "接続に失敗")
        btSerial.close();
    });

    //デバイスの探索を開始
    btSerial.inquire();
});

//赤外線の受信を開始
ipcMain.on("IR_CAPTURE", (event, arg) => {
    //event.sender.send("IR_SUCCESS", "test data");
    console.log("ADD_SIGNAL");
    btSerial.write(new Buffer("ADD_SIGNAL", "utf-8"), (err, bytesWritten) => {
        if (err) console.log(err);
    });
});

//完了の通知を送る
ipcMain.on("ENTRY_COMPLETE", (eveht, arg) => {
    console.log("ENTRY_COMPLETE");
    btSerial.write(new Buffer("COMPLETE", "utf-8"), (err, bytesWritten) => {
        if (err) return console.log(err);
    });

    //DBに保存する
    db.actions.insert(
        {
            id: arg["id"],
            name: arg["name"],
            tag: arg["tag"]
        },
        (err, docs) => {
            if (err) return console.log(err);
            //更新されたDB情報を送る
            db.actions.find({}, (err, docs) => {
                if (err) return console.log(err);

                event.sender.send("SEND_ACTION_DATA", docs);
            });
        }
    );
});

//アクションの削除
ipcMain.on("DB_REMOVE", (event, remove_id) => {
    console.log("DB_REMOVE");
    // btSerial.write(new Buffer("REMOVE", "utf-8"), (err, bytesWritten) => {
    //     if (err) return console.log(err);
    // });

    //DBの中身を削除する
    db.actions.remove({id: remove_id}, (err, docs) => {
        if (err) return console.log(err);
        //NeDBからデータを取り出す
        db.actions.find({}, (err, docs) => {
            if (err) return console.log(err);

            event.sender.send("SEND_ACTION_DATA", docs);
        });
    });
});

//プルダウンに適用するデータを作成
function createSendData(applied_doc) {
    return new Promise((resolve, reject) => {
        let applied = {};

        db.actions.find({id: applied_doc.action_id}, (err, actions_docs) => {
            if (err) return console.log(err);

            applied["id"] = applied_doc.id;
            if (actions_docs.length <= 0) {
                applied["action_id"] = "";
            }else{
                applied["action_id"] = actions_docs[0].id;
            }

            resolve(applied);
        });
    });
}

//名前付きパイプの作成
function createPipe() {
    const PIPE_NAME = "\\\\.\\pipe\\mypipe";

    let server = net.createServer((stream) => {
        console.log("Server: on connection");

        //モーション検出を受け取ったらラズパイにデータを送信
        stream.on("data", (data) => {
            received = data.toString();
            console.log("Server on data: ", received);
            //DBからアクションに対応したidを取得する
            db.applied.find({id: received}, (err, docs) => {
                if (err) return console.log(err);

                console.log("docs is " + docs);
                signal = docs[0].action_id
                console.log("send signal is: " + signal);
                //ラズパイにidを送信
                btSerial.write(new Buffer(signal, "utf-8"), (err, bytesWritten) => {
                    if (err) console.log(err);
                });
            });
        });

        stream.on("end", () => {
            console.log("Server on end");
            server.close();
        });
    });

    server.on("close", () => {
        console.log("Server: on close");
    });

    server.listen(PIPE_NAME, () => {
        console.log("Server: on listening");
    });
}