const {app, BrowserWindow, ipcMain} = require("electron");
const btSerial = new (require("bluetooth-serial-port")).BluetoothSerialPort();

let win;

app.on("ready", () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        resizable: false
    });
    win.loadFile("./app/html/connect.html");
    win.on("closed", () => {
        win = null;
    });
});

app.on("window-all-closed", () => {
    if (process.platform != "darwin") {
        app.quit();
    }
});

ipcMain.on("BT_CONNECT", (event, arg) => {
    console.log("start search device");

    //Bluetooth機器が見つかった際の処理
    btSerial.on("found", (address, name) => {    
        console.log("address: " + address + " name: " + name);
        event.sender.send("CHANGE_STATE", "Searching serial port");
        //this.progress = "Searching serial port";
        

        //シリアルポートが見つかった際の処理
        btSerial.findSerialPortChannel(address, (channel) => {
            console.log("find serial port");
            event.sender.send("CHANGE_STATE", "Trying connect");

            //接続した際の処理
            btSerial.connect(address, channel, () => {
                console.log("connected!");
                win.loadFile("./app/html/index.html");
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
        });
    });

    //デバイスの探索を開始
    btSerial.inquire();
});