<template>
    <div class="welcome">
        <h1>{{ loginMode ? '登录' : '注册' }}</h1>
        <form @submit.prevent="submitAuth">
            <div>
                <span>用户名</span>
                <input type="text" v-model="username">
            </div>

            <div>
                <span>密码</span>
                <input type="password" v-model="password">
            </div>

            <div v-if="!loginMode">
                <span>重复密码</span>
                <input type="password" v-model="passwordAgain">
            </div>

            <p class="attention" v-if="attention != null">{{ attention }}</p>
            <button type="submit">提交</button>
            <div class="switch" @click="switchAuthMode">{{ loginMode ? '注册' : '登录' }}</div>
        </form>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                username: null,
                password: null,
                passwordAgain: null,
                loginMode: true,
            }
        },

        props: ['hasInit', 'attention'],
        
        methods: {
            submitAuth() {
                if (!this.username || !this.password) {
                    this.attention = '用户信息需要'
                    return
                }

                if (!this.loginMode) {
                    if (/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(this.username)) {
                        this.attention = '用户名不要有特殊字符可以吗'
                        return
                    }
                    if (this.username.length < 2) {
                        this.attention = '用户名太短啦，要大于2个字符'
                        return
                    }
                    if (this.password.length < 6) {
                        this.attention = '密码太短啦，要大于6个字符'
                        return
                    }
                    if (this.password != this.passwordAgain) {
                        this.attention = '两次密码不一样啊'
                        return
                    }
                }

                let event = this.loginMode ? 'login' : 'signup'
                if (!socket.id) socket.open()
                socket.emit(event, {
                    username: this.username,
                    password: this.password,
                })
            },

            switchAuthMode() {
                this.attention = this.username = this.password = this.passwordAgain = null
                this.loginMode = !this.loginMode
            },
        },

        created() {
            if (this.hasInit) return

            socket.on('signup failed', (info) => {
                this.attention = info
            })

            socket.on('login failed', (info) => {
                this.attention = info
            })
        }
    }
</script>

<style>
    .welcome {
        position: absolute;
        top: 30%;
        left: 50%;
        transform: translateX(-50%);
    }

    .welcome form > div {
        width: 300px;
        margin-bottom: 10px;
    }

    .welcome span {
        display: inline-block;
        width: 80px;
    }

    .welcome input {
        padding: 5px 10px;
    }

    .welcome button, .welcome .switch {
        padding: 8px 15px;
        margin-right: 30px;
        margin-top: 10px;
        border: none;
        background-color: firebrick;
        color: #fff;
        font-size: 16px;
        border-radius: 5px;
        cursor: pointer;
    }

    .welcome .switch {
        display: inline;
    }

    .welcome .attention {
        color: red;
    }
</style>