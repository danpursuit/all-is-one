// WebSocket.js redux/context methodology: https://www.pluralsight.com/guides/using-web-sockets-in-your-reactredux-app

import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { SET_DOWNLOADING_MODEL, INTERRUPTED, IMG_RESULT, DELETE_SINGLE_IMAGE, DELETE_BATCH, ADD_IMAGE, RCV_NUM_IMAGES, RCV_BATCH_META, IN_PROGRESS_START, RCV_MODEL_DATA } from './constants/actionTypes';
import baseURL from './constants/url';
import { txt2imgNames, txt2imgOpts, img2imgNames, img2imgOpts, editingOpts, editingNames } from './constants/options';
import { EDITING, IMG2IMG, TXT2IMG } from './constants/features';

const WebSocketContext = React.createContext(null)

export { WebSocketContext }

export default ({ children }) => {
    let socket;
    let localUpdate;
    let ws;

    const dispatch = useDispatch();

    const ping = ({ steps }) => {
        socket.emit("ping", { steps });
    }
    const submitQuick = ({ options, op }) => {
        if (op === 'txt2img') {
            return submitTxt2ImgQuick({ options });
        } else if (op === 'img2img') {
            return submitImg2ImgQuick({ options });
        } else if (op === EDITING) {
            return submitEditingQuick({ options });
        } else {
            console.log('unknown op', op);
        }
    }
    const submitProcedural = ({ options, op }) => {
        if (op === TXT2IMG) {
            return submitTxt2ImgProcedural({ options });
        } else if (op === IMG2IMG) {
            return submitImg2ImgProcedural({ options });
        } else if (op === EDITING) {
            return submitEditingProcedural({ options });
        } else {
            console.log('unknown op', op);
        }
    }
    const submitTxt2ImgQuick = ({ options }) => {
        const opts = {};
        txt2imgNames.forEach((name, i) => opts[name] = [options[txt2imgOpts[name]].values[options[txt2imgOpts[name]].idx]]);
        socket.emit('txt2imgProcedural', { options: opts });
    }
    const submitTxt2ImgProcedural = ({ options }) => {
        const opts = {};
        txt2imgNames.forEach((name, i) => opts[name] = options[txt2imgOpts[name]].values);
        socket.emit('txt2imgProcedural', { options: opts });
    }
    const submitImg2ImgQuick = ({ options }) => {
        const opts = {};
        img2imgNames.forEach((name, i) => opts[name] = [options[img2imgOpts[name]].values[options[img2imgOpts[name]].idx]]);
        socket.emit('img2imgProcedural', { options: opts });
    }
    const submitImg2ImgProcedural = ({ options }) => {
        const opts = {};
        img2imgNames.forEach((name, i) => opts[name] = options[img2imgOpts[name]].values);
        socket.emit('img2imgProcedural', { options: opts });
    }
    const submitEditingQuick = ({ options }) => {
        const opts = {};
        editingNames.forEach((name, i) => opts[name] = [options[editingOpts[name]].values[options[editingOpts[name]].idx]]);
        socket.emit('editingProcedural', { options: opts });
    }
    const submitEditingProcedural = ({ options }) => {
        const opts = {};
        editingNames.forEach((name, i) => opts[name] = options[editingOpts[name]].values);
        socket.emit('editingProcedural', { options: opts });
    }
    const reqImageByIdx = ({ op, idx }) => {
        socket.emit('reqImageByIdx', { op, idx });
    }
    const reqNumImages = ({ op }) => {
        socket.emit('reqNumImages', { op });
    }
    const reqBatchMeta = ({ op, jobId }) => {
        // request metadata for the entire batch, idx=startIdx
        socket.emit('reqBatchMeta', { op, jobId });
    }
    const interrupt = ({ op }) => {
        socket.emit('interrupt', { op });
    }
    const deleteSingleImage = ({ op, idx }) => {
        socket.emit('deleteSingleImage', { op, idx });
    }
    const deleteBatch = ({ op, idx }) => {
        socket.emit('deleteBatch', { op, idx });
    }
    // const reqCacheModels = () => {
    //     socket.emit('reqCacheModels');
    // }
    // const reqCkpts = () => {
    //     socket.emit('reqCkpts');
    // }
    const reqModelData = () => {
        socket.emit('reqModelData');
    }
    const saveModelChoices = ({ regularChoice, inpaintingChoice, outpaintingChoice }) => {
        socket.emit('saveModelChoices', { regularChoice, inpaintingChoice, outpaintingChoice });
    }
    const downloadModel = ({ name }) => {
        dispatch({ type: SET_DOWNLOADING_MODEL, payload: { name } });
        socket.emit('downloadModel', { name });
    }
    const downloadByRepoId = ({ saveName, repoId }) => {
        dispatch({ type: SET_DOWNLOADING_MODEL, payload: { name: saveName } });
        socket.emit('downloadByRepoId', { save_name: saveName, repo_id: repoId });
    }
    const convertCkpt = ({ saveName, ckptName, inpainting }) => {
        dispatch({ type: SET_DOWNLOADING_MODEL, payload: { name: saveName } });
        socket.emit('convertCkpt', { save_name: saveName, ckpt_name: ckptName, inpainting });
    }
    const showFolder = ({ location }) => {
        socket.emit('showFolder', { location });
    }

    const addImage = ({ img, meta, idx }) => {
        dispatch({
            type: ADD_IMAGE,
            payload: {
                imgData: {
                    imgResult: 'data:image/png;base64,' + img,
                    ...meta
                },
                op: meta.context,
                idx,
                numImages: idx + 1
            }
        })
    }
    if (!socket) {
        console.log('connecting');
        const clientOnly = false;
        if (clientOnly) {
            socket = null;
        } else {
            socket = io.connect(baseURL);
            // clear localUpdate on disconnect
            socket.on('disconnect', (reason) => {
                console.log('disconnected?', reason);
                if (localUpdate) {
                    clearInterval(localUpdate);
                }
            })

            socket.on("init", (msg) => {
                console.log('init:', msg);
            })
            socket.on("pong", (msg) => {
                console.log('pong:', msg);
            })
            socket.on("img2imgResult", ({ img, meta, idx }) => {
                dispatch({
                    type: ADD_IMAGE,
                    payload: {
                        imgData: {
                            imgResult: 'data:image/png;base64,' + img,
                            ...meta
                        },
                        op: meta.context,
                        idx,
                        numImages: idx + 1
                    }
                })
            })
            socket.on("txt2imgResult", ({ img, meta, idx }) => {
                dispatch({
                    type: ADD_IMAGE,
                    payload: {
                        imgData: {
                            imgResult: 'data:image/png;base64,' + img,
                            ...meta
                        },
                        op: meta.context,
                        idx,
                        numImages: idx + 1
                    }
                })
            })
            socket.on("editingResult", ({ img, meta, idx }) => {
                addImage({ img, meta, idx });
            })
            socket.on('numImages', ({ op, numImages }) => {
                dispatch({
                    type: RCV_NUM_IMAGES,
                    payload: {
                        op,
                        numImages
                    }
                })
            })
            socket.on('imageByIdx', ({ op, meta, img, idx }) => {
                dispatch({
                    type: ADD_IMAGE,
                    payload: {
                        imgData: {
                            imgResult: 'data:image/png;base64,' + img,
                            ...meta
                        },
                        op,
                        idx
                    }
                })
            })
            socket.on('deletedSingleImage', ({ op, idx }) => {
                dispatch({
                    type: DELETE_SINGLE_IMAGE,
                    payload: {
                        op,
                        idx
                    }
                })
            })
            socket.on('deletedBatch', ({ op, idx, numImages, jobId }) => {
                dispatch({
                    type: DELETE_BATCH,
                    payload: {
                        op,
                        idx: Math.max(Math.min(idx, numImages - 1), 0),
                        jobId,
                        numImages
                    }
                })
            })
            socket.on('jobStarted', ({ op, expectedCount }) => {
                dispatch({
                    type: IN_PROGRESS_START,
                    payload: {
                        op, expectedCount
                    }
                })
            })
            socket.on('interrupted', ({ ok, msg }) => {
                if (msg) {
                    alert(msg);
                }
                dispatch({
                    type: INTERRUPTED
                })
            })
            socket.on('batchMeta', ({ op, meta, jobId }) => {
                dispatch({
                    type: RCV_BATCH_META,
                    payload: { op, idx: jobId, meta }
                })
            })
            // socket.on('cacheModels', (payload) => {
            //     dispatch({
            //         type: RCV_CACHE_MODELS,
            //         payload
            //     })
            // })
            // socket.on('localCkpts', ({ ckpts }) => {
            //     dispatch({
            //         type: RCV_LOCAL_CKPTS,
            //         payload: { ckpts }
            //     })
            // })
            socket.on('modelData', (payload) => {
                dispatch({
                    type: RCV_MODEL_DATA,
                    payload
                })
            })
            // //generic
            // socket.on('fail', (msg) => {
            //     console.log('fail from server', msg);
            // })
            // socket.on('success', (msg) => {
            //     console.log('success from server', msg);
            // })
        }


        ws = {
            socket,
            ping,
            submitTxt2ImgQuick,
            submitTxt2ImgProcedural,
            submitImg2ImgQuick,
            submitImg2ImgProcedural,
            reqNumImages,
            reqImageByIdx,
            reqBatchMeta,
            submitProcedural,
            submitQuick,
            interrupt,
            deleteSingleImage,
            deleteBatch,
            reqModelData,
            saveModelChoices,
            downloadModel,
            downloadByRepoId,
            convertCkpt,
            showFolder
        }

        return (
            <WebSocketContext.Provider value={ws}>
                {children}
            </WebSocketContext.Provider>
        )
    }
}