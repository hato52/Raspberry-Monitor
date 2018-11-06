const {ipcRenderer} = nodeRequire("electron");

let vm = new Vue({
    el: "#list",
    data: {
        rows: []
    }
});

//ジェスチャデータのリクエストを送信
ipcRenderer.send("REQUEST_GESTURE_DATA");

//ジェスチャデータの内容を受け取る
ipcRenderer.on("SEND_GESTURE_DATA", (event, data) => {
    //リストの表示
    for (row of data) {
        let row_hash = {};
        
        row_hash["name"] = row.name;
        row_hash["tag"] = row.tag;
        row_hash["status"] = row.status;

        vm.rows.push(row_hash);
    }
});