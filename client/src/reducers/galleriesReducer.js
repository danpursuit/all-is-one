import React from "react";
import { ADD_IMAGE, SET_CURRENT_IMAGE, RCV_NUM_IMAGES, RCV_BATCH_META } from "../constants/actionTypes";

const ops = ['txt2img', 'img2img']
const galleryTemplate = {
    op: '',
    imgData: {}, // key by idx
    numImages: 0,
    currentImage: -1,
    batchMeta: {},
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
                return {
                    ...state,
                    galleries: {
                        ...state.galleries,
                        [action.payload.op]: {
                            ...gallery,
                            imgData: {
                                ...gallery.imgData,
                                [action.payload.idx]: action.payload.imgData
                            },
                            // only set numImages if given. if it is, also scroll to the image
                            currentImage: action.payload.numImages ? action.payload.idx : gallery.currentImage,
                            numImages: action.payload.numImages ? action.payload.numImages : gallery.numImages
                        }
                    }
                }
            case RCV_NUM_IMAGES:
                gallery = state.galleries[action.payload.op];
                return {
                    ...state,
                    galleries: {
                        ...state.galleries,
                        [action.payload.op]: {
                            ...gallery,
                            numImages: action.payload.numImages
                        }
                    }
                }
            case RCV_BATCH_META:
                gallery = state.galleries[action.payload.op];
                return {
                    ...state,
                    galleries: {
                        ...state.galleries,
                        [action.payload.op]: {
                            ...gallery,
                            batchMeta: {
                                ...gallery.batchMeta,
                                [action.payload.idx]: action.payload.meta
                            }
                        }
                    }
                }
            case SET_CURRENT_IMAGE:
                gallery = state.galleries[action.payload.op];
                return {
                    ...state,
                    galleries: {
                        ...state.galleries,
                        [action.payload.op]: {
                            ...gallery,
                            currentImage: action.payload.idx
                        }
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