const {ipcRenderer} = nodeRequire("electron");

let gestures;

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
        },
        cancel: function () {
		    this.isPushed = false;
            this.isDisabled = true;

			//プルダウンの状態を元に戻したい
        }
    }
});

//ジェスチャデータのリクエストを送信
ipcRenderer.send("REQUEST_GESTURE_DATA");

//ジェスチャデータの内容を受け取る
ipcRenderer.on("SEND_GESTURE_DATA", (event, data) => {
    gestures = data;
    applyToPulldown(gestures);
});

//プルダウンにJSONデータを適用
function applyToPulldown(gestures) {
    vm.gestures.length = 0;

    for (let gesture of gestures) {
        let gesture_hash = {};
        gesture_hash["text"] = gesture.name;
        gesture_hash["value"] = gesture.id;

        vm.gestures.push(gesture_hash);

        switch(gesture.status) {
            case 1:
                vm.push = gesture.id;
                break;
            case 2:
                vm.pull = gesture.id;
                break;
            case 3:
                vm.up = gesture.id;
                break;
            case 4:
                vm.down = gesture.id;
                break;
            case 5:
                vm.right = gesture.id;
                break;
            case 6:
                vm.left = gesture.id;
                break;
            default:
                break;
        }
    }
}