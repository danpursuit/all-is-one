import { useSelector, useDispatch } from 'react-redux';
import { Card, Grid, CardContent, Fab, CardActionArea, Button, Typography, Box, Stack, Slider } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search';
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CollectionsIcon from "@mui/icons-material/Collections";
import React, { useEffect } from 'react'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import { IMG2IMG } from '../constants/features';
import { setTip } from '../actions';
import { IMG_UPLOAD, INIT_BATCH_OPTION, SET_BATCH_OPTION } from '../constants/actionTypes';
import { WebSocketContext } from '../WebSocket';
import BatchOptions from './BatchOptions';
import OutputCropper from './OutputCropper';
import ImageSizer from './ImageSizer';
import { imgSubOpts, imgSubNames, imgSubDefaults, getImgSubDefaults } from '../constants/options';
import ConfigCanvas from './ConfigCanvas';
import ImageUploadButtons from './ImageUploadButtons';
import ResizerDrag from './ResizerDrag';

// manages the image upload and associated subOptions
// once image is uploaded, allows opening ConfigCanvas for inpainting/sizing

const inSuffix = '_in';
const outSuffix = '_out';
const styles = {
    container: (sizePx) => {
        return {
            position: 'relative', margin: 0, width: `${sizePx}px`, height: `${sizePx}px`,
            // border: '1px solid black',
            overflow: 'hidden', minWidth: `${sizePx}px`, minHeight: `${sizePx}px`
        }
    },
    resizer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        height: '2rem',
        width: '2rem',
        backgroundColor: 'rgba(0,0,0,0.5)',
        cursor: 'se-resize',
        '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRight: '4px solid white',
            borderBottom: '4px solid white',
        }
    },
    formOuter: {
    },
    label: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
    },
    labelBlank: {
        borderWidth: '2px',
        borderRadius: '1rem',
        borderStyle: 'dashed',
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
    },
    dragScreen: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: '1rem',
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
    },
    img: {
        objectFit: 'contain',
    }
}
const defaultValue = null;
const ImageUpload = ({ name, advanced }) => {
    const dispatch = useDispatch();
    const [sizePx, setSizePx] = React.useState(350);
    const [resizing, setResizing] = React.useState(false);
    const containerRef = React.useRef(null);
    const resizerRef = React.useRef(null);

    const blankImg = useSelector(state => state.main.blanks.image);
    const [hovered, setHovered] = React.useState(false);
    // on startup, dispatch to initialize values
    const uploadRef = React.useRef(null);
    const imRef = React.useRef(null);
    React.useEffect(() => { dispatch({ type: INIT_BATCH_OPTION, payload: { name, values: [defaultValue], idx: 0 } }); })
    const data = useSelector(state => state.main.options[name]);
    const preset = useSelector(state => state.main.preset);
    const [editInputs, setEditInputs] = React.useState(true);

    const [disableSubmit, setDisableSubmit] = React.useState(false);
    const [config, setConfig] = React.useState({ visible: false });
    const [dragActive, setDragActive] = React.useState(false);

    const updateSettingsFromConfigure = (settings) => {
        const newSettings = {}
        imgSubNames.forEach((subName, idx) => {
            newSettings[subName] = settings[subName];
        })
        setConfig({ visible: false });
        dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? { ...v, ...newSettings } : v) } })
    }
    const enableCanvas = () => {
        const newConfig = {
            defaults: {}
        };
        newConfig.visible = true;
        // newConfig.imRef = imRef;
        newConfig.src = data.values[data.idx].img;
        imgSubNames.forEach((subName, idx) => {
            const val = data.values[data.idx][subName] === undefined ? imgSubDefaults[subName](imRef) : data.values[data.idx][subName];
            newConfig[subName] = val;
            newConfig.defaults[subName] = val;
        })
        setConfig(newConfig);
    }

    //resize
    const handleResize = function (e) {
        e.preventDefault();
        e.stopPropagation();
        const tl = containerRef.current.getBoundingClientRect();
        // console.log('resize type', e.type, 'containerRef loc', containerRef.current.getBoundingClientRect());
        // console.log('resizerRef loc', resizerRef.current.getBoundingClientRect());
        const horiz = e.clientX - tl.x;
        const vert = e.clientY - tl.y;
        // console.log('horiz', horiz, 'vert', vert)
        setSizePx(Math.max(horiz, vert));
    }

    // whenever disableSubmit is set to true, set a timer to set it back to false
    React.useEffect(() => { if (disableSubmit) { setTimeout(() => { setDisableSubmit(false); }, 2000); } }, [disableSubmit])
    // on upload, create an image object for defaults, then dispatch all img settings
    const handleUpload = (img) => {
        const im = new Image();
        im.onload = () => {
            const defaults = getImgSubDefaults({ current: { naturalHeight: im.height, naturalWidth: im.width, } }, data.values[data.idx]);
            dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? { ...v, img, ...defaults } : v) } })
        }
        im.src = img;
    }
    React.useEffect(() => {
        if (preset !== null && data) {
            handleUpload(preset)
        }
    }, [preset, data])
    const handleDrag = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    const handleDrop = function (e) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleUpload(reader.result);
            }
            reader.readAsDataURL(file);
        }
    };
    const handleChange = function (e) {
        e.preventDefault();
        // uploadRef.value = null;
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                handleUpload(reader.result);
                uploadRef.current.reset();
            }
            reader.readAsDataURL(file);
        }
    };
    const clearImage = (e) => {
        if (data.values[data.idx]) {
            e.preventDefault();
            dispatch({ type: SET_BATCH_OPTION, payload: { ...data, values: data.values.map((v, i) => i === data.idx ? defaultValue : v) } })
        }
    }
    const getZoom = (v, sfx) => { if (v) return v['z' + sfx] ? Math.round(v['z' + sfx] * 100) / 100 : 1; return 1; }
    const getX = (v, sfx) => { if (v) return v['x' + sfx] ? Math.round(v['x' + sfx]) : 0; return 0; }
    const getY = (v, sfx) => { if (v) return v['y' + sfx] ? Math.round(v['y' + sfx]) : 0; return 0; }
    const getHout = (v) => { if (v) return v.hout ? Math.round(v.hout) : 512; return 512; }
    const getScaleOut = (v) => { if (v) return v.scaleOut ? Math.round(v.scaleOut * 100) / 100 : 1; return 1; }
    const getWout = (v) => { if (v) return v.wout ? Math.round(v.wout) : 512; return 512; }
    const handleSubOptionChange = (e, newValue, optionName) => {
        if (data.values[data.idx]) {
            dispatch({ type: SET_BATCH_OPTION, payload: { ...data, subOption: optionName, values: data.values.map((v, i) => i === data.idx ? { ...v, [optionName]: newValue } : v) } })
        }
    }
    const resetOptions = (e) => {
        if (data.values[data.idx]) {
            const defaults = getImgSubDefaults(imRef);
            dispatch({
                type: SET_BATCH_OPTION, payload: {
                    ...data, subOption: 'reset', values: data.values.map((v, i) => i === data.idx ?
                        { ...v, ...defaults } : v)
                }
            })
        }
    }
    const imgStyle = (data, ref, container = false, mask = false) => {
        const displayHeight = sizePx;
        const displayWidth = sizePx;
        let zoom = getZoom(data, inSuffix);
        let height = (ref && ref.current) ? ref.current.naturalHeight : displayHeight;
        let width = (ref && ref.current) ? ref.current.naturalWidth : displayWidth;
        if (!ref || !ref.current || !data || !data.img) {
            if (container) {
                return {
                    width: `${sizePx * zoom}px`,
                    height: `${sizePx * zoom}px`,
                }
            }
            return {
                ...styles.img,
                width: `${sizePx * zoom}px`,
                height: `${sizePx * zoom}px`,
                objectPosition: `top ${getY(data, inSuffix) * sizePx / height}px left ${getX(data, inSuffix) * sizePx / width}px`,
                // objectPosition: `calc(50% + ${getYoff(data)}px) calc(50% + ${getXoff(data)}px)`,
            }
        }
        const w_out = data.w_out;
        const h_out = data.h_out;
        let w_disp, h_disp, scale_disp;
        if (w_out > h_out) {
            w_disp = displayWidth;
            scale_disp = w_disp / w_out;
            h_disp = h_out * scale_disp;
        } else {
            h_disp = displayHeight;
            scale_disp = h_disp / h_out;
            w_disp = w_out * scale_disp;
        }
        if (container) {
            return {
                position: 'relative',
                backgroundColor: data.outpaint ? '#111111' : '#aaaaaa',
                overflow: 'hidden',
                width: `${w_disp}px`,
                height: `${h_disp}px`,
                margin: 'auto',
            }
        }
        if (mask) {
            return {
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${w_disp}px`,
                height: `${h_disp}px`,
                opacity: 0.8,
                // objectFit: 'cover',
            }
        }
        const imgDispWidth = width * data.z_in;
        const imgDispHeight = height * data.z_in;
        return {
            position: 'absolute',
            top: `${(data.y_in - data.y_out - imgDispHeight / 2 + data.h_out / 2) * scale_disp}px`,
            left: `${(data.x_in - data.x_out - imgDispWidth / 2 + data.w_out / 2) * scale_disp}px`,
            width: `${width * data.z_in * scale_disp}px`,
            height: `${height * data.z_in * scale_disp}px`,
        }
    }
    return (
        <Stack direction='row' spacing={1} onMouseUp={() => setResizing(false)} onMouseMove={(e) => { if (resizing) { handleResize(e) } }}>
            <Box ref={containerRef} sx={styles.container(sizePx)} onMouseEnter={() => { dispatch(setTip(name)); setHovered(true) }}
                onMouseLeave={() => setHovered(false)}>
                {data && <>
                    <form ref={uploadRef} onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()} style={{ ...styles.formOuter }}>
                        <input type="file" id="input-file-upload" accept="image/*" style={{ display: 'none' }} onChange={handleChange} />
                        <label id="label-file-upload" htmlFor="input-file-upload" style={{ ...styles.label, ...(data.values[data.idx] === null && styles.labelBlank) }}>
                            <Box sx={imgStyle(data.values[data.idx], imRef, true)}>
                                <img ref={imRef} src={data.values[data.idx] !== null ? data.values[data.idx].img : blankImg} style={imgStyle(data.values[data.idx], imRef)} />
                                {data.values[data.idx]?.mask && <img src={data.values[data.idx].mask} style={{ ...imgStyle(data.values[data.idx], imRef, false, true) }} />}
                                {/* {data.values[data.idx]?.mask && <img src={data.values[data.idx].mask} style={{ position: 'absolute', left: 0, top: 0, backgroundColor: '#ff000080' }} />} */}
                            </Box>
                        </label>
                        {dragActive && <div style={styles.dragScreen} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
                    </form>
                    {(hovered || data.values.length > 1) && <BatchOptions data={data} defaultValue={defaultValue} />}
                </>}
                {/* <Box sx={styles.resizer} ref={resizerRef} onDragEnter={handleResize} onDragLeave={handleResize} onDragOver={handleResize} onDrop={handleResize} draggable /> */}
                <ResizerDrag resizerRef={resizerRef} setResizing={setResizing} />
            </Box>
            {data && <>
                <ImageUploadButtons target={data.values[data.idx]} clearImage={clearImage} resetOptions={resetOptions} enableCanvas={enableCanvas} advanced={advanced} />
                {advanced && <ConfigCanvas cf={config} setCf={setConfig} subs={imgSubOpts} updateAndClose={updateSettingsFromConfigure} />}
            </>}
        </Stack>
    )
}

export default ImageUpload