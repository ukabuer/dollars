<template>
    <form class="input" @submit.prevent="send">
        <input v-model="input" autocomplete="off" />
        <button>Post!</button>
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
            }
        }
    }
</script>

<style>
    .input {
        position: absolute;
        bottom: 0;
        height: 40px;
        width: 100%;
    }
    
    .input input {
        height: 100%;
        border: 0;
        padding: 10px;
        width: 90%;
    }
    
    .input button {
        height: 100%;
        width: 9%;
        background: rgb(130, 224, 255);
        border: none;
        padding: 5px;
    }
</style>