//クライアントサイドのJavaScriptでrequireを使う際には、nodeRequireを使う
const {ipcRenderer} = nodeRequire("electron");

let vm = new Vue({
    el: "#connection",
    data: {
        img_url: "",
        progress: ""
    },
    methods: {
        startConnection: function () {
            //ボタンを無効化
            let btn = document.getElementById("connect_btn");
            btn.disabled = "disabled";

            //ステータスの初期化
            this.progress = "Searching device";
            this.img_url = "../../assets/progress.gif";

            //Bluetooth通信の開始を要求
            ipcRenderer.send("BT_CONNECT");
            //通信ステータスの変更を反映
            ipcRenderer.on("CHANGE_STATE", (event, arg) => {
                this.progress = arg;
            });
        }
    }
});