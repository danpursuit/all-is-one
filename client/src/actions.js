import { SET_TIP } from "./constants/actionTypes"

export const setTip = (name) => async (dispatch) => {
    dispatch({
        type: SET_TIP,
        payload: name
    })
}