<template>
    <div class="auth">
        <h2>{{ loginMode ? '登录' : '注册' }}</h2>
        <form  @submit.prevent="submitAuth">
            <div class="form-group">
                <label class="form-label" for="username">用户名</label>
                <input class="form-input" type="text" id="username" placeholder="用户名" v-model="username" />
                <label class="form-label" for="password">密码</label>
                <input class="form-input" type="password" id="password" placeholder="密码" v-model="password" />
                <label class="form-label" for="passwordAgain" v-if="!loginMode">重复密码</label>
                <input class="form-input" type="password" id="passwordAgain" placeholder="重复密码" v-if="!loginMode" v-model="passwordAgain"
                />
            </div>
            <p class="attention" v-if="attention != null">{{ attention }}</p>
            <button class="btn btn-lg" type="submit">提交</button>
            <button class="btn btn-lg switch" @click.prevent="switchAuthMode">{{ loginMode ? '注册' : '登录' }}</button>
        </form>
    </div>
</template>

<script>
    import { mapState } from 'vuex'

    export default {
        data() {
            return {
                username: null,
                password: null,
                passwordAgain: null,
                loginMode: true,
            }
        },

        computed: mapState({
            attention: state => state.attention
        }),

        methods: {
            submitAuth() {
                if (!this.username || !this.password) {
                    this.$store.commit('attention', '用户信息需要')
                    return
                }

                if (!this.loginMode) {
                    if (/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(this.username)) {
                        this.$store.commit('attention', '用户名不要有特殊字符可以吗')
                        return
                    }
                    if (this.username.length < 2) {
                        this.$store.commit('attention', '用户名太短啦，要大于2个字符')
                        return
                    }
                    if (this.password.length < 6) {
                        this.$store.commit('attention', '密码太短啦，要大于6个字符')
                        return
                    }
                    if (this.password != this.passwordAgain) {
                        this.$store.commit('attention', '两次密码不一样啊')
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
                this.username = this.password = this.passwordAgain = null
                this.$store.commit('attention', null)
                this.loginMode = !this.loginMode
            },
        },
    }

</script>

<style>
    .auth form {
        width: 300px;
    }

    .auth form button {
        width: 75px;
        margin-left: 50px;
    }
</style>