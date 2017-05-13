<template>
    <form class="input" @submit.prevent="send">
        <div class="function">
            <button class="btn btn-link">颜文字</button>
            <button class="btn btn-link">图片</button>
            <button class="btn btn-link">语音</button>
            <button class="btn btn-link">文件</button>
            <span>Shift + Enter发送消息</span>
        </div>
        <textarea v-model="input" @keyup.enter.prevent="send" autocomplete="off"></textarea>
        <button class="btn btn-primary" id="submit">Post!</button>
    </form>
</template>

<script>
    export default {
        data() {
            return {
                input: ''
            }
        },

        props: ['target', 'at'],

        methods: {
            send() {
                if (this.input == '')
                    return
                socket.emit('message', {
                    content: this.input,
                    to: this.target,
                    at: this.at
                })
                this.input = ''
            },

            shortcut(e) {
                let keyCode = e.keyCode || e.which || e.charCode
                let ctrlKey = e.ctrlKey || e.metaKey
                if(ctrlKey && keyCode == 83) {
                    this.send()
                }
                e.preventDefault()
            }
        }
    }
</script>

<style>
    .input {
        position: absolute;
        bottom: 0px;
        height: 80px;
        width: 100%;
    }
    
    .input textarea {
        height: 50px;
        border: 0;
        padding: 10px;
        width: 90%;
    }
    
    #submit {
        position: absolute;
        top: 30px;
        right: 0;
        height: 50px;
        width: 10%;
        min-width: 80px;
    }

    .input .function {
        height: 30px;
        padding: 0 20px;
        border-top: 1px solid #333;
    }

    .input .function button {
        color: #fff;
        width: 60px;
        margin: 0 0px;
    }

    .input .function button:hover {
        background-color: #fff;
        color: #000;
    }

    .input .function span {
        line-height: 30px;
        float: right;
    }

    @media (max-width: 600px) {
        .input .function span {
            display: none;
        }
    }
</style>