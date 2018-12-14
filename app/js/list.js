vm_list = new Vue({
    el: "#list",
    data: {
        rows: [],
    },
    methods: {
        removeRecord: function(remove_id) {
            //指定したレコードの削除
            if (confirm("本当に削除しますか？")) {
                console.log(remove_id);
                ipcRenderer.send("DB_REMOVE", remove_id);
            }
        }
    }
});

index_vm = new Vue({
    el: "#modal_index",
    data: {
        progress: "",
        isDisplayed: false,
        isDisabled: false
    },
    methods: {
        startCapture: function() {
            //ボタンを無効化
            this.isDisabled = true;

            //ステータス表示の初期化
            this.progress = "赤外線受信中";
            this.isDisplayed = true;

            //赤外線受信の開始を要求
            ipcRenderer.send("IR_CAPTURE");

            //通信ステータスの変更を反映
            ipcRenderer.on("CHANGE_STATE", (event, arg) => {
                this.progress = arg;
			});
			
			//受信成功
			ipcRenderer.on("IR_SUCCESS", (event, arg) => {
                id = arg;
                this.progress = "";
                this.isDisplayed = false;
                $(".modal_index").modaal("close");
                $(".modal_entry").modaal("open");
			});
            
            //受信失敗
            ipcRenderer.on("IR_FAILED", (event, arg) => {
                this.progress = arg;
                this.isDisabled = false;
                this.isDisplayed = false;
            });
		},
		cancelCapture: function() {
            this.progress = "";
            this.isDisabled = false;
            this.isDisplayed = false;
            $(".modal_index").modaal("close");
		}
    }
});

entry_vm = new Vue({
    el: "#modal_entry",
    data: {
        entry_name: "",
        entry_tag: ""
    },
    methods: {
        entryAction: function () {
            //フォームのデータを取得
            let data_hash = {};
            data_hash["id"] = id;
            data_hash["name"] = this.entry_name;
            data_hash["tag"] = this.entry_tag;

            //完了の通知とフォームのデータを送る
            ipcRenderer.send("ENTRY_COMPLETE", data_hash);
            $(".modal_entry").modaal("close")
        },
        cancelEntry: function() {
            $(".modal_entry").modaal("close");
		}
    }
});

//モーダルウィンドウの適用
$(".modal_index").modaal({
    hide_close: true,
    overlay_close: false
});

$(".modal_entry").modaal({
    hide_close: true,
    overlay_close: false
});

//ジェスチャデータのリクエストを送信
ipcRenderer.send("REQUEST_ACTION_DATA");

//ジェスチャデータの内容をリストのビューモデルに反映
ipcRenderer.on("SEND_ACTION_DATA", (event, actions) => {
    vm_list.rows = actions;
});