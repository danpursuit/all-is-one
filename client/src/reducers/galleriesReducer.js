import React from "react";
import { ADD_IMAGE, SET_CURRENT_IMAGE, RCV_NUM_IMAGES, RCV_BATCH_META, DELETE_SINGLE_IMAGE, DELETE_BATCH } from "../constants/actionTypes";
import { EDITING, IMG2IMG, IMG2VID, TXT2IMG } from "../constants/features";

const ops = [TXT2IMG, IMG2IMG, IMG2VID, EDITING]
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
    let gallery, imgData;
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
            case DELETE_SINGLE_IMAGE:
                gallery = state.galleries[action.payload.op];
                // clear all images after the deleted image
                imgData = { ...gallery.imgData };
                for (let i = action.payload.idx; i < gallery.numImages; i++) {
                    if (imgData[i]) delete imgData[i];
                }
                return {
                    ...state,
                    galleries: {
                        ...state.galleries,
                        [action.payload.op]: {
                            ...gallery,
                            imgData,
                            numImages: gallery.numImages - 1,
                            currentImage: action.payload.idx - 1
                        }
                    }
                }
            case DELETE_BATCH:
                gallery = state.galleries[action.payload.op];
                imgData = { ...gallery.imgData };
                for (let i = action.payload.idx; i < gallery.numImages; i++) {
                    if (imgData[i]) delete imgData[i];
                }
                return {
                    ...state,
                    galleries: {
                        ...state.galleries,
                        [action.payload.op]: {
                            ...gallery,
                            imgData,
                            numImages: action.payload.numImages,
                            currentImage: action.payload.idx - 1,
                            batchMeta: {
                                ...gallery.batchMeta,
                                [action.payload.jobId]: undefined
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