vm_allocate = new Vue({
    el: "#allocate",
    data: {
        isPushed: false,
        isDisabled: true,
        push: "",
        pull: "",
        up: "",
        down: "",
        right: "",
        left: "",
        gestures: []
    },
    methods: {
        editStatus: function () {
            this.isPushed = true;
            this.isDisabled = false;
        },
        apply: function () {
            this.isPushed = false;
            this.isDisabled = true;
            //プルダウンの内容を取り出してjsonを書き換え
            rewriteData();
        },
        cancel: function () {
		    this.isPushed = false;
            this.isDisabled = true;
            //プルダウンの状態を元に戻す
            for (a of save_applied) {
                eval("vm_allocate." + a.id + " = a.action_id");
            }
        }
    }
});

//動作データのリクエストを送信
ipcRenderer.send("REQUEST_APPLIED_DATA");

//動作データの内容を受け取る
ipcRenderer.on("SEND_APPLIED_DATA", (event, applied, actions) => {
    //プルダウンの内容を代入
    vm_allocate.gestures = actions;

    //プルダウンを戻すとき用にグローバル変数に保存
    save_applied = applied;

    //selected要素の指定
    for (a of applied) {
        eval("vm_allocate." + a.id + " = a.action_id");
    }
});

//動作データを書き換える
function rewriteData() {
    let applied_list = [];
    //全種類のジェスチャを確認
    for (let i = 0; i < GESTURES.length; i++) {
        applied_list
        eval("applied_list.push(vm_allocate." + GESTURES[i] + ")");  //新しく適用されたデータのID
    }
    //console.log(vm_allocate.push);
    //データの更新要求を送る
    ipcRenderer.send("UPDATE_APPLIED_DATA", applied_list, GESTURES);
}