const {ipcRenderer} = nodeRequire("electron");

let vm = new Vue({
    el: "#list",
    data: {
        rows: []
    }
});

//ジェスチャデータのリクエストを送信
ipcRenderer.send("REQUEST_ACTION_DATA");

//ジェスチャデータの内容をリストのビューモデルに反映
ipcRenderer.on("SEND_ACTION_DATA", (event, actions) => {
    vm.rows = actions;
});