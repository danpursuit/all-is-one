import { Box, Button, Card, Checkbox, MenuItem, Select, Slider, Stack, TextField, Typography } from '@mui/material'
import Grid from '@mui/material/Unstable_Grid2'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';



import JobProgress from '../components/JobProgress';
import BatchOptionTextInput from '../components/BatchOptionTextInput';
import { REDO, UNDO, SUBMIT_START } from '../constants/actionTypes';
import BatchOptionSlider from '../components/BatchOptionSlider';
import BatchOptionSelect from '../components/BatchOptionSelect';
import schedulers from '../constants/schedulers';
import { WebSocketContext } from '../WebSocket';
import { img2imgOpts } from '../constants/options';
import Gallery from '../components/Gallery';
import Tips from '../components/Tips';
import { setTip } from '../actions';
import ImageSizer from './ImageSizer';

// contains the canvas for sizing the input and output
// inpainting will happen on the canvas later

const canvasWidth = 2048;
const canvasHeight = 1024;
const canvasScale = 2;
const cX = canvasWidth / 2 / canvasScale;
const cY = canvasHeight / 2 / canvasScale;
const styles = {
    outer: { zIndex: 1000, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    container: {
        // position: 'absolute',
        // top: 0,
        // left: 0,
        border: '4px solid black',
        // width: '2048px',
        // height: '2048px',
        // overflow: 'scroll',
        // zIndex: 100,
        backgroundColor: 'rgba(230,230,230,0.9)',
    },
    options: {
        backgroundColor: 'white',
    },
    canvasContainer: {
        position: 'relative',
        width: `${canvasWidth / canvasScale}px`,
        height: `${canvasHeight / canvasScale}px`,
        backgroundColor: 'purple'
    },
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${canvasWidth / canvasScale}px`,
        height: `${canvasHeight / canvasScale}px`,
    }
}
const initCanvas = (canvas) => {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    // canvas.style.width = `${canvasWidth / canvasScale}px`;
    // canvas.style.height = `${canvasHeight / canvasScale}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(canvasScale, canvasScale);
    return ctx
}
// let history = {
//     index: -1,
//     lines: []
// }
let currentLine = null;
const ConfigCanvas = ({ cf, setCf, updateAndClose }) => {
    const canvasRef = React.useRef(null);
    const ctxRef = React.useRef(null);
    const inpaintRef = React.useRef(null);
    const inpaintCtxRef = React.useRef(null);
    const imgRef = React.useRef(null);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [loaded, setLoaded] = React.useState(false);
    const [inpainting, setInpainting] = React.useState(cf.mask !== null && cf.mask !== undefined);
    const [brushSize, setBrushSize] = React.useState(5);
    const [history, setHistory] = React.useState({
        index: -1,
        lines: []
    });
    const handleClose = () => {
        if (!inpainting)
            return updateAndClose({ ...cf, mask: null });
        // get dataurl from inpaint
        const dataUrl = inpaintRef.current.toDataURL();
        const maskImage = new Image();
        maskImage.onload = () => {
            // create new canvas
            const canvas = document.createElement('canvas');
            canvas.width = cf.w_out;
            canvas.height = cf.h_out;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(
                maskImage,
                maskImage.width / 2 + cf.x_out - cf.w_out / 2, maskImage.height / 2 + cf.y_out - cf.h_out / 2,
                cf.w_out,
                cf.h_out,
                0, 0, cf.w_out, cf.h_out
            );
            const mask = canvas.toDataURL();
            updateAndClose({ ...cf, mask });
        }
        maskImage.src = dataUrl;
    }
    useEffect(() => {
        if (!cf.visible) return;

        // canvas for displaying image
        const ctx = initCanvas(canvasRef.current);
        ctxRef.current = ctx;
        const im = new Image()
        im.src = cf.src;
        im.onload = () => {
            imgRef.current = im;
            setLoaded(true);
            draw();
        }

        //canvas for inpainting
        let inpaintCtx = initCanvas(inpaintRef.current);
        inpaintCtx.lineCap = "round";
        inpaintCtx.lineJoin = "round";
        inpaintCtx.strokeStyle = "black";
        inpaintCtx.lineWidth = brushSize;
        inpaintCtxRef.current = inpaintCtx;
        redrawMask();

    }, [cf.visible]);
    useEffect(() => {
        if (!cf.visible) return;
        if (!imgRef.current) return;
        draw();
    }, [imgRef, cf]);
    const draw = () => {
        const ctx = ctxRef.current;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // if outpainting, draw black background
        const outWidth = cf.w_out / canvasScale * cf.z_out;
        const outHeight = cf.h_out / canvasScale * cf.z_out;
        if (cf.outpaint) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(cX - outWidth / 2 + cf.x_out / canvasScale, cY - outHeight / 2 + cf.y_out / canvasScale, outWidth, outHeight);
        }

        // draw image
        const img = imgRef.current;
        const imWidth = img.width / canvasScale * cf.z_in;
        const imHeight = img.height / canvasScale * cf.z_in;
        ctx.drawImage(img, cX - imWidth / 2 + cf.x_in / canvasScale, cY - imHeight / 2 + cf.y_in / canvasScale, imWidth, imHeight);

        // draw outputbox
        ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
        ctx.fillRect(cX - outWidth / 2 + cf.x_out / canvasScale, cY - outHeight / 2 + cf.y_out / canvasScale, outWidth, outHeight);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 4;
        ctx.strokeRect(cX - outWidth / 2 + cf.x_out / canvasScale, cY - outHeight / 2 + cf.y_out / canvasScale, outWidth, outHeight);
    }
    const processPoint = ({ type, x, y, size }) => {
        if (type === 0) {
            inpaintCtxRef.current.beginPath();
            inpaintCtxRef.current.moveTo(x, y);
            inpaintCtxRef.current.lineWidth = size;
        } else if (type === 1) {
            inpaintCtxRef.current.lineTo(x, y);
            inpaintCtxRef.current.stroke();
        } else if (type === 2) {
            inpaintCtxRef.current.closePath();
        }
    }
    const processPoints = (points) => {
        for (let i = 0; i < points.length; i++) {
            processPoint(points[i]);
        }
    }
    const mouseDown = (e) => {
        if (!inpainting) return;
        setIsDrawing(true);
        const { offsetX, offsetY } = e.nativeEvent;
        const point = { type: 0, x: offsetX, y: offsetY, size: brushSize }
        // begin currentLine
        currentLine = [point];
        currentLine.push(point)
        processPoint(point);
        // chop off any "undone" history after current index
        setHistory({
            ...history,
            lines: history.lines.slice(0, history.index + 1)
        })
    }
    const mouseUp = (e) => {
        if (!isDrawing) return;
        if (!inpainting) return;
        setIsDrawing(false);
        const point = { type: 2 }
        currentLine.push(point);
        processPoint(point);
        // add the line to history
        setHistory({
            index: history.index + 1,
            lines: [...history.lines, currentLine]
        })
        currentLine = null;
    }
    const mouseMove = (e) => {
        if (!isDrawing) return;
        if (!inpainting) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const point = { type: 1, x: offsetX, y: offsetY }
        currentLine.push(point);
        processPoint(point);
    }
    const redrawMask = () => {
        if (!cf.mask) return;
        const maskImage = new Image();
        maskImage.onload = () => {
            const outWidth = cf.w_out / canvasScale * cf.z_out;
            const outHeight = cf.h_out / canvasScale * cf.z_out;
            inpaintCtxRef.current.drawImage(maskImage, 0, 0, maskImage.width, maskImage.height, cX - outWidth / 2 + cf.x_out / canvasScale, cY - outHeight / 2 + cf.y_out / canvasScale, outWidth, outHeight);
        }
        maskImage.src = cf.mask;
    }
    const redraw = ({ index, lines }) => {
        inpaintCtxRef.current.clearRect(0, 0, canvasWidth, canvasHeight);
        // redrawMask();
        for (let i = 0; i <= index; i++) {
            processPoints(lines[i]);
        }
    }
    const undoDraw = () => {
        let index = history.index - 1;
        if (index < -1) return;
        redraw({ index, lines: history.lines });
        setHistory({ index, lines: history.lines })
    }
    const redoDraw = () => {
        if (history.index >= history.lines.length - 1) return;
        const index = history.index + 1;
        redraw({ index, lines: history.lines });
        setHistory({ index, lines: history.lines });
    }
    if (!cf.visible) return null;
    return (
        <Box sx={styles.outer}>
            <Box sx={styles.container}>
                <Box sx={styles.canvasContainer}>
                    <canvas
                        ref={canvasRef}
                        // onMouseDown={mouseDown}
                        // onMouseUp={mouseUp}
                        // onMouseMove={mouseMove}
                        style={{ border: '3px solid red', ...styles.canvas }}
                    />
                    <canvas
                        ref={inpaintRef}
                        onMouseDown={mouseDown}
                        onMouseUp={mouseUp}
                        onMouseMove={mouseMove}
                        style={{ border: '3px solid yellow', ...styles.canvas }}
                    />
                </Box>
                {loaded && <Stack direction='column' spacing={1} sx={styles.options}>
                    <Stack direction='row' spacing={2} padding={1}>
                        <Typography variant='h6'>Configure</Typography>
                        <Button variant='contained' size='small' onClick={handleClose}>Confirm</Button>
                        <Button variant='outlined' size='small' onClick={() => setCf({ visible: false })}>Cancel</Button>
                        <Stack direction='row' spacing={2} alignItems='center'>
                            <Stack direction='row' spacing={0} alignItems='center'>

                                <Typography variant='body2'>Inpainting</Typography>
                                <Checkbox checked={inpainting} onChange={(e) => setInpainting(e.target.checked)} />
                            </Stack>
                            <Stack direction='row' spacing={0} alignItems='center'>

                                <Typography variant='body2'>Outpainting</Typography>
                                <Checkbox checked={cf.outpaint} onChange={(e) => setCf({ ...cf, outpaint: e.target.checked })} />
                            </Stack>
                        </Stack>
                    </Stack>
                    {inpainting && <Stack direction='row' spacing={2} padding={1}>
                        <Typography variant='body2' sx={{ flex: '0 0 auto' }}>Brush size: {brushSize}</Typography>
                        <Slider sx={{ flex: '1 1' }} value={brushSize} onChange={(e, v) => setBrushSize(v)} min={1} max={50} />
                        <Button disabled={history.index < 0} onClick={undoDraw}><UndoIcon /></Button>
                        <Button disabled={history.index >= history.lines.length - 1} onClick={redoDraw}><RedoIcon /></Button>
                    </Stack>
                    }
                    <ImageSizer target={cf} setCf={setCf} suffix='_in' fixedHeight={imgRef.current ? imgRef.current.height : 512} fixedWidth={imgRef.current ? imgRef.current.width : 512} />
                    <ImageSizer target={cf} setCf={setCf} suffix='_out' />
                </Stack>}
            </Box ></Box>
    )
}

export default ConfigCanvas