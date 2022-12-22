import { Button, Card, Checkbox, FormControlLabel, FormGroup, MenuItem, Select, Slider, Stack, IconButton, Typography, Box, Grid, TextField } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import FileCopyTwoToneIcon from '@mui/icons-material/FileCopyTwoTone';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import GridOnTwoToneIcon from '@mui/icons-material/GridOnTwoTone';
import CircularProgress from '@mui/material/CircularProgress';
import ClearIcon from '@mui/icons-material/Clear';
import SendIcon from '@mui/icons-material/Send';
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';

import { WebSocketContext } from '../WebSocket';
import { SET_CURRENT_IMAGE, SET_BATCH_OPTIONS, DELETE_SINGLE_IMAGE, DELETE_BATCH, SET_BATCH_OPTION, SET_LOCATION } from '../constants/actionTypes';
import { CONFIRM_DELETE, CONFIRM_DELETE_BATCH, GALLERY_DISPLAY, GALLERY_NAVIGATION, IMG2IMG, IMG2VID, MIRROR, SEND_TO_IMG2IMG, SHOW_BATCH } from '../constants/features';
import { setTip } from '../actions';
import { getImgSubDefaults, img2imgOpts } from '../constants/options';
import { CopySettingsButt, DeleteButt, NavLabel, NextButt, PrevButt, SendToImgButt, ShowEntireJobButt, ShowFolderButt } from './GalleryButtons';
import ResizerDrag from './ResizerDrag';

const styles = {
    img: {
        display: 'block',
        margin: 'auto',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        cursor: 'pointer'
        // maxHeight: '400px'
    },
    imgLarge: (sizePx) => {
        return {
            width: `${sizePx}px`,
            height: `${sizePx}px`,
        }
    },
    selected: {
        boxSizing: 'border-box',
        border: '4px solid #0000ff',
    },
    deleteButt0: {

    },
    deleteButt1: {
        backgroundColor: 'red'
    }
}
const Gallery = ({ op, optNames, isVideo = false }) => {
    const ws = React.useContext(WebSocketContext);
    const dispatch = useDispatch();
    const options = useSelector(state => state.main.options);
    const data = useSelector(state => state.galleries.galleries[op]);
    const submitStatus = useSelector(state => state.main.submitStatus);
    const blankImg = useSelector(state => state.main.blanks.image);
    // mirroring means the options used to generate gallery image are being copied to workstation
    const [mirroring, setMirroring] = React.useState(false);
    const [showBatch, setShowBatch] = React.useState(false);

    const [sizePx, setSizePx] = React.useState(400);
    const [resizing, setResizing] = React.useState(false);
    const containerRef = React.useRef(null);
    const resizerRef = React.useRef(null);

    // have ws request data on init
    React.useEffect(() => {
        ws.reqNumImages({ op });
    }, []);
    // when image changes
    React.useEffect(() => {
        if (!data || data.currentImage < 0) return;
        // if image does not exist, request it
        const imgData = data.imgData[data.currentImage];
        if (imgData === undefined) {
            ws.reqImageByIdx({ op, idx: data.currentImage });
            return;
        }
        // if showing entire job, request batch metadata also
        if (showBatch) {
            const jobId = imgData['job_id']
            if (!data.batchMeta[jobId]) {
                console.log('requesting batch meta', jobId)
                ws.reqBatchMeta({ op, jobId });
                return;
            }
            if (mirroring) {
                const optData = data.batchMeta[jobId]
                const options = {};
                Object.keys(optData).forEach(k => {
                    if (optNames[k]) { // some keys in imgData are not true options
                        options[optNames[k]] = {
                            name: optNames[k],
                            values: optData[k],
                            idx: Math.max(0, optData[k].indexOf(imgData[k]))
                        }
                    }
                })
                dispatch({ type: SET_BATCH_OPTIONS, payload: { options } });
            }
        } else {
            if (mirroring) {
                // construct options from img meta
                const options = {};
                Object.keys(imgData).forEach(k => {
                    if (optNames[k]) { // some keys in imgData are not true options
                        options[optNames[k]] = {
                            name: optNames[k],
                            values: isVideo ? imgData[k] : [imgData[k]],
                            idx: 0
                        }
                    }
                })
                console.log('from gallery', options)
                dispatch({ type: SET_BATCH_OPTIONS, payload: { options } });
            }
        }
    }, [data.currentImage, data.imgData[data.currentImage], mirroring, showBatch]);
    const prevImage = () => {
        if (data.numImages === 0) return;
        let idx;
        if (showBatch && data.currentImage !== -1 && !mirroring) {
            // go to last image of last batch
            const startIdx = data.currentImage - data.imgData[data.currentImage].idx_in_job;
            idx = (startIdx - 1 + data.numImages) % data.numImages;
        } else {
            idx = data.currentImage === -1 ? data.numImages - 1 : (data.currentImage - 1 + data.numImages) % data.numImages;
        }
        dispatch({ type: SET_CURRENT_IMAGE, payload: { op, idx } });
    }
    const nextImage = () => {
        if (data.numImages === 0) return;
        let idx;
        if (showBatch && !mirroring && data.currentImage !== -1) {
            // go to last image of last batch
            idx = (data.currentImage - data.imgData[data.currentImage].idx_in_job + data.imgData[data.currentImage].job_size) % data.numImages;
        } else {
            idx = (data.currentImage + 1 + data.numImages) % data.numImages;
        }
        dispatch({ type: SET_CURRENT_IMAGE, payload: { op, idx } });
    }
    // several display types:
    // no image (idx -1)
    const renderNoImage = () => {
        return <img src={blankImg} style={{ ...styles.img, ...(!showBatch && styles.imgLarge(sizePx)) }} />
    }
    // render a single image, or one in the batch
    // const renderImage = (currentImage, circleSize = 200, selected = false) => {
    //     return data.imgData[currentImage] ?
    //         <img src={data.imgData[currentImage].imgResult} style={{ ...styles.img, ...(!showBatch && styles.imgLarge(sizePx)), ...(selected && styles.selected) }} onClick={() => {
    //             if (showBatch) {
    //                 setShowBatch(false);
    //                 dispatch({ type: SET_CURRENT_IMAGE, payload: { op, idx: currentImage } });
    //             } else {
    //                 setShowBatch(true);
    //             }
    //         }} /> :
    //         <Box sx={{ position: 'relative' }}>
    //             <img src={blankImg} style={{ ...styles.img, ...(!showBatch && styles.imgLarge(sizePx)) }} />
    //             <CircularProgress sx={{ position: 'absolute', top: `calc(50% - ${circleSize / 2}px)`, left: `calc(50% - ${circleSize / 2}px)` }} size={circleSize} />
    //         </Box>
    // }
    const renderImage = (currentImage, circleSize = 200, selected = false) => {
        return data.imgData[currentImage] ?
            (isVideo ?
                <video src={data.imgData[currentImage].imgResult} controls style={{ ...styles.img, ...(!showBatch && styles.imgLarge(sizePx)) }}>
                    <source src={data.imgData[currentImage].imgResult} type="video/mp4" /></video> :
                <img src={data.imgData[currentImage].imgResult} style={{ ...styles.img, ...(!showBatch && styles.imgLarge(sizePx)), ...(selected && styles.selected) }} onClick={() => {
                    if (showBatch) {
                        setShowBatch(false);
                        dispatch({ type: SET_CURRENT_IMAGE, payload: { op, idx: currentImage } });
                    } else {
                        setShowBatch(true);
                    }
                }} />) :
            <Box sx={{ position: 'relative' }}>
                <img src={blankImg} style={{ ...styles.img, ...(!showBatch && styles.imgLarge(sizePx)) }} />
                <CircularProgress sx={{ position: 'absolute', top: `calc(50% - ${circleSize / 2}px)`, left: `calc(50% - ${circleSize / 2}px)` }} size={circleSize} />
            </Box>
    }
    // image batch (idx > 0, showBatch = true)
    const renderBatch = () => {
        if (!data.imgData[data.currentImage]) return renderImage(data.currentImage);
        const imgData = data.imgData[data.currentImage];
        const jobId = imgData.job_id;
        let startIdx, endIdx, jobSize;
        if (data.batchMeta[jobId]) {
            startIdx = data.batchMeta[jobId].start_idx;
            endIdx = data.batchMeta[jobId].end_idx;
            jobSize = endIdx - startIdx;
        } else {
            startIdx = data.currentImage - imgData.idx_in_job;
            endIdx = startIdx + imgData.job_size;
            jobSize = imgData.job_size;
        }
        const batch = [];
        let gridSize = 3;
        if (jobSize <= 4) gridSize = 6;
        else if (jobSize <= 6) gridSize = 4;
        for (let i = startIdx; i < endIdx; i++) {
            batch.push(
                <Grid item xs={gridSize - 0.1} key={i}>
                    {renderImage(i, 20, i === data.currentImage)}
                </Grid>)
        }
        return <Grid container spacing={1}>
            {batch}
        </Grid>
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

    const galleryNavTip = () => {
        dispatch(setTip(GALLERY_NAVIGATION))
    }

    return (
        <Stack spacing={2} alignItems='center' onMouseUp={() => setResizing(false)} onMouseMove={(e) => { if (resizing) { handleResize(e) } }}>
            <Box sx={{ position: 'relative' }}><Card sx={{ width: `${sizePx + 50}px`, height: `${sizePx}px`, overflow: 'auto' }} ref={containerRef} onMouseEnter={() => dispatch(setTip(GALLERY_DISPLAY))}>
                {data.currentImage <= -1 ? renderNoImage() :
                    (showBatch ? renderBatch() : renderImage(data.currentImage))
                }

            </Card>
                <ResizerDrag resizerRef={resizerRef} setResizing={setResizing} /></Box>
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                {!isVideo && <DeleteButt ws={ws} data={data} op={op} submitStatus={submitStatus} showBatch={showBatch} />}
                <CopySettingsButt mirroring={mirroring} setMirroring={setMirroring} />
                <PrevButt disabled={data.numImages <= 0} onClick={prevImage} onMouseEnter={galleryNavTip} />
                <NavLabel data={data} op={op} onMouseEnter={galleryNavTip} />
                <NextButt disabled={data.numImages <= 0} onClick={nextImage} onMouseEnter={galleryNavTip} />
                {!isVideo && <ShowEntireJobButt showBatch={showBatch} setShowBatch={setShowBatch} />}
                <ShowFolderButt ws={ws} op={op} />
                {!isVideo && <SendToImgButt data={data} />}
            </Stack>
        </Stack >
    )
}

export default Gallery