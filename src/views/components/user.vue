<template>
    <div class="user">
        <div class="upload">
            <div class="avatar">
                <img v-if="data" :src="data">
                <p v-else>选择图片</p>
                <label for="avatar"></label>
            </div>
            <p>{{ user.name }}的头像</p>
            <input id="avatar" type="file" @change="choose">
            <button @click="upload">上传</button>
            <p v-if="attention">{{ attention }}</p>
        </div>
        <span class="close" @click="changePanel('chat')">X</span>
    </div>
</template>

<script>
    import {mapState, mapMutations} from 'vuex'

    export default {
        data() {
            return {
                file: null,
                data: null,
                attention: null
            }
        },

        computed: mapState({
            user: state => state.user,
        }),

        methods: {
            ...mapMutations(['changePanel']),

            upload(e) {
                if (!this.file) {
                    this.attention = '请选择文件'
                    return
                }
                let form = new FormData()
                form.append('avatar', this.file)
                let request = new XMLHttpRequest()
                request.open("POST", "/avatar")
                request.setRequestHeader('Authorization', 'Bearer ' + window.localStorage.token)
                request.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        var percentComplete = Math.round(e.loaded * 100 / e.total)
                        this.attention = '上传中'+percentComplete+"%"
                    }
                }, false)
                request.onload = (e) => {
                    if(request.status == 200) {
                        this.attention = "上传成功"
                    } else {
                        this.attention = "上传失败"
                    }
                }
                request.send(form)
            },

            choose(e) {
                this.file = e.target.files[0]
                let size = Math.floor(this.file.size / 1024);
                if (size > 1024) {
                    this.attention = '文件不能大于1MB'
                    return 
                }

                 if (!this.file || !window.FileReader) return
                 if (/^image/.test(this.file.type)) {
                    let reader = new FileReader()
                    reader.readAsDataURL(this.file);
                    
                    let self = this
                    reader.onloadend = function() {
                        self.data = this.result;
                    }
                }
            }
        },
    }

</script>

<style>
    .upload {
        position: relative;
        margin: 20% auto;
        height: 300px;
        width: 300px;
        text-align: center;
        line-height: 50px;
    }
    .upload input {
        position: absolute;
        left: -9999px;
    }
    .upload label {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
        cursor: pointer;
    }

    .upload .avatar {
        position: relative;
        float: none;
        height: 100px;
        width: 100px;
        margin: 0 auto;
    }

    .upload button {
        margin: 10px auto;
        background-color: #fff;
        border: none;
        width: 100px;
        cursor: pointer;
    }

    .avatar img {
        display: inline-block;
        height: 100%;
        width: 100%;
        border-radius: 50%;
    }

    .close {
        font-size: 32px;
        font-weight: bold;
        font-family: sans-serif;
        cursor: pointer;
    }

    .close {
        position: absolute;
        top: 20px;
        right: 50px;
    }

</style>