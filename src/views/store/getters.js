export default {
    messages: state => {
        return state[state.at][state.target].messages
    },
}