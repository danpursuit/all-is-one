// WebSocket.js redux/context methodology: https://www.pluralsight.com/guides/using-web-sockets-in-your-reactredux-app

import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { IMG_RESULT, ADD_IMAGE } from './constants/actionTypes';
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
        console.log('opts', opts);
        socket.emit('txt2imgProcedural', { options: opts });
    }
    const submitTxt2ImgProcedural = ({ options }) => {
        const opts = {};
        txt2imgNames.forEach((name, i) => opts[name] = options[txt2imgOpts[name]].values);
        console.log('opts', opts);
        socket.emit('txt2imgProcedural', { options: opts });
    }
    const saveImage = ({ img, metadata }) => {
        const folder = `output/${metadata.op}`
        // get number of files in folder
        const numFiles = 0;

    }
    if (!socket) {
        console.log('connecting');
        // socket = null;
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
        // //generic
        // socket.on('fail', (msg) => {
        //     console.log('fail from server', msg);
        // })
        // socket.on('success', (msg) => {
        //     console.log('success from server', msg);
        // })


        ws = {
            socket,
            ping,
            submitImg2Img,
            submitTxt2ImgQuick,
            submitTxt2ImgProcedural,
        }

        return (
            <WebSocketContext.Provider value={ws}>
                {children}
            </WebSocketContext.Provider>
        )
    }
}