//クライアントサイドのJavaScriptでrequireを使う際には、nodeRequireを使う
const {ipcRenderer} = nodeRequire("electron");

let vm = new Vue({
    el: "#connection",
    data: {
        progress: "",
        isDisplayed: false,
        isDisabled: false
    },
    methods: {
        startConnection: function () {
            //ボタンを無効化
            this.isDisabled = true;

            //ステータス表示の初期化
            this.progress = "接続中";
            this.isDisplayed = true;

            //Bluetooth通信の開始を要求
            ipcRenderer.send("BT_CONNECT");
            //通信ステータスの変更を反映
            ipcRenderer.on("CHANGE_STATE", (event, arg) => {
                this.progress = arg;
            });
            ipcRenderer.on("FAILED", (event, arg) => {
                this.progress = arg;
                this.isDisabled = false;
                this.isDisplayed = false;
            });
        }
    }
});