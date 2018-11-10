const {ipcRenderer} = nodeRequire("electron");

let actions;
const GESTURES = ["push", "pull", "up", "down", "right", "left"];
let action_list = Array(GESTURES.length);

let vm = new Vue({
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
            rewriteData(actions);
        },
        cancel: function () {
		    this.isPushed = false;
            this.isDisabled = true;
			//プルダウンの状態を元に戻したい
        }
    }
});

//動作データのリクエストを送信
ipcRenderer.send("REQUEST_APPLIED_DATA");

//動作データの内容を受け取る
ipcRenderer.on("SEND_APPLIED_DATA", (event, actions) => {
    //プルダウンの内容を代入
    vm.gestures = actions;

    console.log(actions);
    
    //selected要素の指定
    for (action of actions) {
        eval("vm." + action.id + " = action.action_id");    //邪悪を感じる
    }
});

//動作データを書き換える
function rewriteData(actions) {
    let applied_list = [];
    //全種類のジェスチャを確認
    for (let i = 0; i < GESTURES.length; i++) {
        applied_list
        eval("applied_list.push(vm." + GESTURES[i] + ")");  //新しく適用されたデータのID
    }
    console.log(vm.push);
    //データの更新要求を送る
    ipcRenderer.send("UPDATE_APPLIED_DATA", applied_list, GESTURES);
}