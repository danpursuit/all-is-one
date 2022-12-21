import { READ_WELCOME, SET_DOWNLOADING_MODEL, RCV_MODEL_DATA, IMG_UPLOAD, IMG_RESULT, ADD_IMAGE, INIT_BATCH_OPTION, SET_BATCH_OPTION, SET_BATCH_OPTIONS, UNDO, REDO, SUBMIT_START, IN_PROGRESS_START, INTERRUPTED, SET_LOCATION, SET_MODEL } from "../constants/actionTypes";
import { EMPTY_MODEL, IMG2IMG, IMG2VID, SELECT_MODEL, TXT2IMG } from "../constants/features";
// import blank.png
import blank from "../images/blank.png";

const maxHistory = 50;
const initialSubmitStatus = {
    submitting: false,
    inProgress: false,
    done: false,
    error: null,
    expectedCount: 0,
    currentCount: 0,
    op: null
}
const initialState = {
    welcome: false,
    blanks: {
        image: blank
    },
    options: {

    },
    models: {
        models: {
            regular: null,
            inpainting: null,
            regularChoice: EMPTY_MODEL,
            inpaintingChoice: EMPTY_MODEL,
            outpaintingChoice: EMPTY_MODEL,
        },
        ckpts: null,
        downloads: null,
        downloading: null,
    },
    panel: 0,
    history: [],
    historyIndex: -1,
    lastUndo: null,
    submitStatus: {
        ...initialSubmitStatus
    },
    preset: null,
    location: IMG2VID,
    welcome: false,
    readWelcome: false
}
export default (state = initialState, action) => {
    let history, prevState;
    try {
        // console.log('action', action.type);
        switch (action.type) {
            case RCV_MODEL_DATA:
                const welcome = !state.readWelcome && action.payload.models.regularChoice === EMPTY_MODEL;
                return {
                    ...state,
                    models: { ...state.models, ...action.payload },
                    welcome,
                    location: welcome ? SELECT_MODEL : state.location,
                }
            // return {
            //     ...state,
            //     models: {
            //         ...state.models,
            //         models: {
            //             ...state.models.models,
            //             ...action.payload
            //         }
            //     },
            //     welcome,
            //     location: welcome ? SELECT_MODEL : state.location
            // }
            case SET_MODEL:
                return {
                    ...state,
                    models: {
                        ...state.models,
                        models: {
                            ...state.models.models,
                            ...action.payload
                        }
                    }
                }
            case SET_DOWNLOADING_MODEL:
                return {
                    ...state,
                    models: {
                        ...state.models,
                        downloading: action.payload.name
                    }
                }
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
                    if (history.length > maxHistory) history = history.slice(1);
                    const newStep = { type: action.type, nextState: action.payload, prevState: state.options[action.payload.name] }
                    const lastStep = history[history.length - 1];
                    // if it is the same option (and makes sense to do so), update last history instead of pushing new one
                    if (lastStep !== undefined && lastStep.type === action.type && lastStep.nextState.name === action.payload.name && lastStep.nextState.idx === action.payload.idx
                        && history.length === state.history.length && lastStep.nextState.subOption === action.payload.subOption) {
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
                        preset: null,
                    }
                }
                return state
            case SET_BATCH_OPTIONS:
                prevState = {};
                Object.keys(action.payload.options).forEach(name => {
                    prevState[name] = state.options[name];
                })
                history = [...state.history.slice(0, state.historyIndex + 1)]
                if (history.length > maxHistory) history = history.slice(1);
                const newStep = { type: action.type, nextState: action.payload, prevState };
                const lastStep = history[history.length - 1];
                if (lastStep !== undefined && lastStep.type === action.type && action.type) {
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
                        ...action.payload.options
                    },
                }
            case SUBMIT_START:
                return {
                    ...state,
                    submitStatus: {
                        ...initialSubmitStatus,
                        submitting: true,
                        inProgress: false,
                    }
                }
            case IN_PROGRESS_START:
                return {
                    ...state,
                    submitStatus: {
                        ...state.submitStatus,
                        submitting: false,
                        inProgress: true,
                        op: action.payload.op,
                        expectedCount: action.payload.expectedCount,
                        currentCount: 0,
                    }
                }
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
                        case SET_BATCH_OPTIONS:
                            return {
                                ...state,
                                historyIndex: state.historyIndex - 1,
                                options: {
                                    ...state.options,
                                    ...prev.prevState
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
                        case SET_BATCH_OPTIONS:
                            return {
                                ...state,
                                historyIndex: state.historyIndex + 1,
                                options: {
                                    ...state.options,
                                    ...next.nextState.options
                                }
                            }
                        default:
                            return state
                    }
                }
                return state
            case INTERRUPTED:
                return {
                    ...state,
                    submitStatus: {
                        ...initialSubmitStatus
                    }
                }
            case ADD_IMAGE:
                if (action.payload.numImages && state.submitStatus.inProgress) {
                    return {
                        ...state,
                        submitStatus: {
                            ...state.submitStatus,
                            currentCount: state.submitStatus.currentCount + 1,
                            inProgress: state.submitStatus.currentCount + 1 < state.submitStatus.expectedCount,
                            done: state.submitStatus.currentCount + 1 >= state.submitStatus.expectedCount
                        }
                    }
                }
                return state
            case SET_LOCATION:
                return {
                    ...state,
                    location: action.payload.location,
                    preset: action.payload.preset ? action.payload.preset : state.preset
                }
            case READ_WELCOME:
                return {
                    ...state,
                    readWelcome: true
                }
            default:
                return state;
        }
    } catch (e) {
        console.log('reducer error:', e);
    }
}