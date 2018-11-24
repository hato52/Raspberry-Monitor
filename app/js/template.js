const {ipcRenderer} = nodeRequire("electron");

// テンプレート用
let allocate_flag = false;
let list_flag = false;

// ジェスチャ割り当て用
let save_applied;
const GESTURES = ["push", "pull", "up", "down", "right", "left"];
let action_list = Array(GESTURES.length);
let vm_allocate

// リスト用
let id;
let vm_list;
let index_vm;
let entry_vm;

let vm_template = new Vue({
    el: ".sidebar",
    methods: {
        jumpAllocation: function() {
            $("#content").empty();
            //割り当て画面をAjaxで表示
            $.ajax({
                url : "allocation.html",
                dataType : "html",
                success : function(data){
                    $("#content").html(data);
                    $.getScript("../js/allocation.js");
                    allocate_flag = true;
                }
            });
        },
        jumpList: function() {
            $("#content").empty();
            //リスト画面をAjaxで表示
            $.ajax({
                url : "list.html",
                dataType : "html",
                success : function(data){
                    $("#content").html(data);
                    $.getScript("../js/list.js");
                    list_flag = true;
                }
            });
        }
    }
});