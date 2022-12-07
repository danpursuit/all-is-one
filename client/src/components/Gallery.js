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
import { CONFIRM_DELETE, CONFIRM_DELETE_BATCH, IMG2IMG, MIRROR, SEND_TO_IMG2IMG, SHOW_BATCH } from '../constants/features';
import { setTip } from '../actions';
import { getImgSubDefaults, img2imgOpts } from '../constants/options';
import { CopySettingsButt, DeleteButt, NavLabel, NextButt, PrevButt, SendToImgButt, ShowEntireJobButt, ShowFolderButt } from './GalleryButtons';

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
    imgLarge: {
        width: '400px',
        height: '400px'
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
const Gallery = ({ op, optNames }) => {
    const ws = React.useContext(WebSocketContext);
    const dispatch = useDispatch();
    const options = useSelector(state => state.main.options);
    const data = useSelector(state => state.galleries.galleries[op]);
    const submitStatus = useSelector(state => state.main.submitStatus);
    const blankImg = useSelector(state => state.main.blanks.image);
    const [mirroring, setMirroring] = React.useState(false);
    const [showBatch, setShowBatch] = React.useState(false);

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
        if (showBatch) {
            const jobId = imgData['job_id']
            if (!data.batchMeta[jobId]) {
                ws.reqBatchMeta({ op, jobId });
                return;
            }
            // request all images in batch that don't exist
            // disabled now, since server should automatically send all images in batch
            // const startIdx = data.batchMeta[jobId].start_idx;
            // const endIdx = data.batchMeta[jobId].end_idx;
            // let requested = false;
            // for (let i = startIdx; i < endIdx; i++) {
            //     if (i === data.currentImage) continue;
            //     if (data.imgData[i] === undefined) {
            //         ws.reqImageByIdx({ op, idx: i });
            //         requested = true;
            //     }
            // }
            // if (requested) return;
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
                            values: [imgData[k]],
                            idx: 0
                        }
                    }
                })
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
        return <img src={blankImg} style={{ ...styles.img, ...(!showBatch && styles.imgLarge) }} />
    }
    // render a single image, or one in the batch
    const renderImage = (currentImage, circleSize = 200, selected = false) => {
        return data.imgData[currentImage] ?
            <img src={data.imgData[currentImage].imgResult} style={{ ...styles.img, ...(!showBatch && styles.imgLarge), ...(selected && styles.selected) }} onClick={() => {
                if (showBatch) {
                    setShowBatch(false);
                    dispatch({ type: SET_CURRENT_IMAGE, payload: { op, idx: currentImage } });
                } else {
                    setShowBatch(true);
                }
            }} /> :
            <Box sx={{ position: 'relative' }}>
                <img src={blankImg} style={{ ...styles.img, ...(!showBatch && styles.imgLarge) }} />
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
    return (
        <Stack spacing={2} alignItems='center'>
            <Card sx={{ width: '450px', height: '400px', overflow: 'auto' }}>
                {data.currentImage <= -1 ? renderNoImage() :
                    (showBatch ? renderBatch() : renderImage(data.currentImage))
                }
            </Card>
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                <DeleteButt ws={ws} data={data} op={op} submitStatus={submitStatus} showBatch={showBatch} />
                <CopySettingsButt mirroring={mirroring} setMirroring={setMirroring} />
                <PrevButt disabled={data.numImages <= 0} onClick={prevImage} />
                <NavLabel data={data} op={op} />
                <NextButt disabled={data.numImages <= 0} onClick={nextImage} />
                <ShowEntireJobButt showBatch={showBatch} setShowBatch={setShowBatch} />
                <ShowFolderButt ws={ws} op={op} />
                <SendToImgButt data={data} />
            </Stack>
        </Stack >
    )
}

export default Gallery