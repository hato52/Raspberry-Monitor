const {app, BrowserWindow, ipcMain} = require("electron");
const btSerial = new (require("bluetooth-serial-port")).BluetoothSerialPort();
const net = require("net");

let win;
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
});

app.on("window-all-closed", () => {
    if (process.platform != "darwin") {
        app.quit();
    }
});

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