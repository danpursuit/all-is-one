import { Button, Card, Checkbox, FormControlLabel, FormGroup, MenuItem, Select, Slider, Stack, IconButton, Typography, Box, Grid, TextField } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import FileCopyTwoToneIcon from '@mui/icons-material/FileCopyTwoTone';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import GridOnTwoToneIcon from '@mui/icons-material/GridOnTwoTone';
import CircularProgress from '@mui/material/CircularProgress';

import React from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { WebSocketContext } from '../WebSocket';
import { SET_CURRENT_IMAGE, SET_BATCH_OPTIONS } from '../constants/actionTypes';
import { MIRROR, SHOW_BATCH } from '../constants/features';
import { setTip } from '../actions';

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
    }
}
const Gallery = ({ op, optNames }) => {
    const ws = React.useContext(WebSocketContext);
    const dispatch = useDispatch();
    const data = useSelector(state => state.galleries.galleries[op]);
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
            // request all images in batch that don't exist
            const startIdx = data.currentImage - imgData.idx_in_job;
            const endIdx = startIdx + imgData.job_size;
            let requested = false;
            for (let i = startIdx; i < endIdx; i++) {
                if (data.imgData[i] === undefined) {
                    ws.reqImageByIdx({ op, idx: i });
                    requested = true;
                }
            }
            if (!data.batchMeta[startIdx]) {
                ws.reqBatchMeta({ op, idx: startIdx });
                requested = true;
            }
            if (requested) return;
            if (mirroring) {
                const optData = data.batchMeta[startIdx]
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
        const idx = data.currentImage === -1 ? data.numImages - 1 : (data.currentImage - 1 + data.numImages) % data.numImages;
        dispatch({ type: SET_CURRENT_IMAGE, payload: { op, idx } });
    }
    const nextImage = () => {
        if (data.numImages === 0) return;
        const idx = (data.currentImage + 1 + data.numImages) % data.numImages;
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
            <img src={data.imgData[currentImage].img} style={{ ...styles.img, ...(!showBatch && styles.imgLarge), ...(selected && styles.selected) }} onClick={() => {
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
        const startIdx = data.currentImage - imgData.idx_in_job;
        const endIdx = startIdx + imgData.job_size;
        const batch = [];
        let gridSize = 3;
        if (imgData.job_size <= 4) gridSize = 6;
        else if (imgData.job_size <= 6) gridSize = 4;
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
                <Checkbox
                    onMouseEnter={() => dispatch(setTip(MIRROR))}
                    checked={mirroring}
                    onClick={() => setMirroring(!mirroring)}
                    icon={<FileCopyOutlinedIcon />}
                    checkedIcon={<FileCopyTwoToneIcon />} />
                <IconButton disabled={data.numImages <= 0} onClick={prevImage}>
                    <NavigateBeforeIcon />
                </IconButton>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField value={data.currentImage + 1} onChange={e => {
                        const idx = parseInt(e.target.value) - 1;
                        if (idx >= 0 && idx < data.numImages) {
                            dispatch({ type: SET_CURRENT_IMAGE, payload: { op, idx } });
                        }
                    }} sx={{ width: data.numImages > 999 ? '5em' : '4em' }} size='small' />
                    <Typography>of {data.numImages}</Typography>
                </Stack>
                <IconButton disabled={data.numImages <= 0} onClick={nextImage}>
                    <NavigateNextIcon />
                </IconButton>
                <Checkbox
                    onMouseEnter={() => dispatch(setTip(SHOW_BATCH))}
                    checked={showBatch}
                    onClick={() => setShowBatch(!showBatch)}
                    icon={<GridOnOutlinedIcon />}
                    checkedIcon={<GridOnTwoToneIcon />} />
            </Stack>
        </Stack>
    )
}

export default Gallery