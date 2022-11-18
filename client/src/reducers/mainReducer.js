import { IMG_UPLOAD, IMG_RESULT } from "../constants/actionTypes";
import { IMG2IMG } from "../constants/features";
// import blank.png
import blank from "../images/blank.png";

const initialState = {
    uploads: {
        [IMG2IMG]: null
    },
    results: {
        [IMG2IMG]: null
    },
    blanks: {
        image: blank
    },
    panel: 0,
    history: []
}
export default (state = initialState, action) => {
    try {
        switch (action.type) {
            case IMG_UPLOAD:
                return {
                    ...state,
                    uploads: {
                        ...state.uploads,
                        [IMG2IMG]: action.payload
                    }
                }
            case IMG_RESULT:
                return {
                    ...state,
                    results: {
                        ...state.results,
                        [IMG2IMG]: action.payload
                    }
                }
            default:
                return state;
        }
    } catch (error) {
        console.log('reducer error:', error);
    }
}