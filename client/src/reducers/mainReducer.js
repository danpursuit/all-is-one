import { IMG_UPLOAD, IMG_RESULT, INIT_BATCH_OPTION, SET_BATCH_OPTION, UNDO, REDO } from "../constants/actionTypes";
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
    options: {

    },
    panel: 0,
    history: [],
    historyIndex: -1,
    lastUndo: null
}
export default (state = initialState, action) => {
    let history;
    try {
        // console.log('action', action.type);
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
            // case SET_BATCH_OPTION:
            //     history = [...state.history.slice(0, state.historyIndex + 1), action];
            //     return {
            //         ...state,
            //         history,
            //         historyIndex: history.length - 1
            //     }
            // case UNDO:
            //     if (state.historyIndex < 0) return state;
            //     return {
            //         ...state,
            //         historyIndex: state.historyIndex - 1,
            //         lastUndo: state.history[state.historyIndex]
            //     }
            case INIT_BATCH_OPTION:
                if (!state.options[action.payload.name]) {
                    // history = [...state.history.slice(0, state.historyIndex + 1), { action, prevState: state.options[action.payload.name] }]
                    return {
                        ...state,
                        // chop off history
                        // history,
                        // historyIndex: history.length,
                        options: {
                            ...state.options,
                            [action.payload.name]: action.payload
                        },
                    }
                }
                return state
            case SET_BATCH_OPTION:
                if (state.options[action.payload.name] !== action.payload) {
                    history = [...state.history.slice(0, state.historyIndex + 1)]
                    const newStep = { type: action.type, nextState: action.payload, prevState: state.options[action.payload.name] }
                    const lastStep = history[history.length - 1];
                    // if it is the same option (and makes sense to do so), update last history instead of pushing new one
                    if (lastStep !== undefined && lastStep.type === action.type && lastStep.nextState.name === action.payload.name && lastStep.nextState.idx === action.payload.idx
                        && history.length === state.history.length) {
                        newStep.prevState = history[history.length - 1].prevState
                        history[history.length - 1] = newStep;
                    } else {
                        history.push(newStep);
                    }
                    return {
                        ...state,
                        history,
                        historyIndex: history.length - 1,
                        options: {
                            ...state.options,
                            [action.payload.name]: action.payload
                        },
                    }
                }
                return state
            case UNDO:
                if (state.historyIndex >= 0) {
                    const prev = state.history[state.historyIndex];
                    switch (prev.type) {
                        case SET_BATCH_OPTION:
                            return {
                                ...state,
                                historyIndex: state.historyIndex - 1,
                                options: {
                                    ...state.options,
                                    [prev.prevState.name]: prev.prevState
                                }
                            }
                        default:
                            return state
                    }
                }
                return state
            case REDO:
                if (state.historyIndex < state.history.length - 1) {
                    const next = state.history[state.historyIndex + 1];
                    console.log('next', next);
                    switch (next.type) {
                        case SET_BATCH_OPTION:
                            return {
                                ...state,
                                historyIndex: state.historyIndex + 1,
                                options: {
                                    ...state.options,
                                    [next.nextState.name]: next.nextState
                                }
                            }
                        default:
                            return state
                    }
                }
                return state
            default:
                return state;
        }
    } catch (e) {
        console.log('reducer error:', e);
    }
}