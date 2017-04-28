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

        props: ['attention'],
        
        methods: {
            submitAuth() {
                if (!this.username || !this.password) {
                    this.attention = '用户信息需要'
                    return
                }

                if (!this.loginMode) {
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
                socket.emit(event, {
                    username: this.username,
                    password: this.password
                })
                console.log(1)
            },

            switchAuthMode() {
                this.attention = this.username = this.password = this.passwordAgain = null
                this.loginMode = !this.loginMode
            },
        }
    }
</script>