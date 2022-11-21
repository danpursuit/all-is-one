import { ADD_IMAGE, SET_CURRENT_IMAGE } from "../constants/actionTypes";

const ops = ['txt2img', 'img2img']
const galleryTemplate = {
    op: '',
    imgData: {}, // key by idx
    numImages: 0,
    currentImage: -1,
    showBatch: false,
    batch: {
        startIdx: null,
        numInBatch: null,
    }
}
const initialState = {
    galleries: {},
}
ops.forEach(op => initialState.galleries[op] = { ...galleryTemplate, op });

export default (state = initialState, action) => {
    let gallery;
    try {
        switch (action.type) {
            case ADD_IMAGE:
                gallery = state.galleries[action.payload.op];
                gallery.imgData[action.payload.idx] = action.payload.imgData;
                // set current image to last image
                gallery.currentImage = action.payload.idx;
                // numImages may be given if server added a new image
                if (action.payload.numImages)
                    gallery.numImages = action.payload.numImages;
                return {
                    ...state,
                    galleries: {
                        ...state.galleries,
                        [action.payload.op]: gallery
                    }
                }
            case SET_CURRENT_IMAGE:
                gallery = state.galleries[action.payload.op];
                gallery.currentImage = action.payload.idx;
                return {
                    ...state,
                    galleries: {
                        ...state.galleries,
                        [action.payload.op]: gallery
                    }
                }
            default:
                return state
        }
    }
    catch (e) {
        console.log('gallery error:', e);
        return state
    }
}