import { SET_TIP } from "../constants/actionTypes";

const initialState = {
    name: null
}

export default (state = initialState, action) => {
    switch (action.type) {
        case SET_TIP:
            return {
                ...state,
                name: action.payload
            }
        default:
            return state
    }
}