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
    win.loadFile("./app/html/allocation.html");
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
        if (err) {
            return console.log(err);
        }
        event.sender.send("SEND_ACTION_DATA", docs);
    });

});

//プルダウン用データの送信
ipcMain.on("REQUEST_APPLIED_DATA", (event, arg) => {
    //適用データを取得
    db.applied.find({}, (err, applied_docs) => {
        if (err) {
            return console.log(err);
        }

        let applied_list = [];
        let i = 1;
        //適用された動作データを取得
        for (applied_doc of applied_docs) {
            //データの取得を待機して実行
            createSendData(applied_doc).then((applied) => {
                applied_list.push(applied);

                if (i == applied_docs.length) {
                    event.sender.send("SEND_APPLIED_DATA", applied_list);
                }
                i++;
            });
        }
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
                if (err) {
                    return console.log(err);
                }

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

//プルダウンに適用するデータを作成
function createSendData(applied_doc) {
    return new Promise((resolve, reject) => {
        let applied = {};

        db.actions.find({id: applied_doc.action_id}, (err, actions_docs) => {
            applied["id"] = applied_doc.id;
            applied["action_id"] = actions_docs[0].id;
            applied["action_name"] = actions_docs[0].name;

            resolve(applied);
        });
    });
}

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
            btSerial.write(new Buffer("my data", "utf-8"), (err, bytesWritten) => {
                if (err) console.log(err);
            });

            //データを受け取った際の処理
            btSerial.on("data", (buffer) => {
                console.log(buffer.toString("utf-8"));
            });
        }, () => {
            //connectのエラーコールバック
            console.log("cannot connect");
        });

        btSerial.close();
    }, () => {
        //findSerialPortChannelのエラーコールバック
        console.log("found nothing");
        event.sender.send("FAILED", "接続に失敗")
        btSerial.close();
    });

    //デバイスの探索を開始
    btSerial.inquire();
});

//名前付きパイプの作成
function createPipe() {
    const PIPE_NAME = "\\\\.\\pipe\\mypipe";

    let server = net.createServer((stream) => {
        console.log("Server: on connection");

        //モーション検出を受け取ったらラズパイにデータを送信
        stream.on("data", (data) => {
            console.log("Server on data: ", data.toString());
            btSerial.write(new Buffer(data.toString(), "utf-8"), (err, bytesWritten) => {
                if (err) console.log(err);
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

function addSeedData() {
    db.actions.remove({}, {multi: true}, (err, docs) => {});
    db.applied.remove({}, {multi: true}, (err, docs) => {});

    db.actions.insert([
        {
            id: "action_1",
            name: "test 1",
            tag: "aircon",
            status: 1
        },
        {
            id: "action_2",
            name: "test 2",
            tag: "aircon",
            status: 2
        },
        {
            id: "action_3",
            name: "test 3",
            tag: "aircon",
            status: 3
        },
        {
            id: "action_4",
            name: "test not use",
            tag: "aircon",
            status: 0
        },
        {
            id: "action_5",
            name: "test 5",
            tag: "hoge",
            status: 5
        },
        {
            id: "action_6",
            name: "test 6",
            tag: "aircon",
            status: 6
        },
    ]);

    db.applied.insert([
        {
            id: "push",
            action_id: "action_1"
        },
        {
            id: "pull",
            action_id: "action_2"
        },
        {
            id: "up",
            action_id: "action_3"
        },
        {
            id: "down",
            action_id: "action_4"
        },
        {
            id: "right",
            action_id: "action_5"
        },
        {
            id: "left",
            action_id: "action_6"
        },
    ]);
}