// WebSocket.js redux/context methodology: https://www.pluralsight.com/guides/using-web-sockets-in-your-reactredux-app

import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { INTERRUPTED, IMG_RESULT, ADD_IMAGE, RCV_NUM_IMAGES, RCV_BATCH_META, IN_PROGRESS_START } from './constants/actionTypes';
import baseURL from './constants/url';
import { txt2imgNames, txt2imgOpts } from './constants/options';

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
    const submitImg2Img = ({ img }) => {
        socket.emit("img2img", { img });
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
    const reqImageByIdx = ({ op, idx }) => {
        socket.emit('reqImageByIdx', { op, idx });
    }
    const reqNumImages = ({ op }) => {
        socket.emit('reqNumImages', { op });
    }
    const reqBatchMeta = ({ op, idx }) => {
        // request metadata for the entire batch, idx=startIdx
        socket.emit('reqBatchMeta', { op, idx });
    }
    const interrupt = ({ op }) => {
        socket.emit('interrupt', { op });
    }
    if (!socket) {
        console.log('connecting');
        const clientOnly = false;
        if (clientOnly) {
            socket = null;
        } else {
            socket = io.connect(baseURL);
            // clear localUpdate on disconnect
            socket.on('disconnect', () => {
                console.log('disconnected?');
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
            socket.on("img2imgResult", ({ img, metadata }) => {
                dispatch({ type: IMG_RESULT, payload: 'data:image/png;base64,' + img });
            })
            socket.on("txt2imgResult", ({ img, meta, idx }) => {
                dispatch({
                    type: ADD_IMAGE,
                    payload: {
                        imgData: {
                            img: 'data:image/png;base64,' + img,
                            ...meta
                        },
                        op: meta.context,
                        idx,
                        numImages: idx + 1
                    }
                })
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
                            img: 'data:image/png;base64,' + img,
                            ...meta
                        },
                        op,
                        idx
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
            socket.on('interrupted', ({ ok }) => {
                dispatch({
                    type: INTERRUPTED
                })
            })
            socket.on('batchMeta', ({ op, meta, idx }) => {
                dispatch({
                    type: RCV_BATCH_META,
                    payload: { op, idx, meta }
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
            submitImg2Img,
            submitTxt2ImgQuick,
            submitTxt2ImgProcedural,
            reqNumImages,
            reqImageByIdx,
            reqBatchMeta,
            interrupt
        }

        return (
            <WebSocketContext.Provider value={ws}>
                {children}
            </WebSocketContext.Provider>
        )
    }
}