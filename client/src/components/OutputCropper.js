import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box } from "@mui/material";
import { SET_BATCH_OPTION } from '../constants/actionTypes';

const styles = {
    corner: {
        width: '20px',
        height: '20px',
        backgroundColor: 'rgba(10,10,10, 0.8)',
        position: 'absolute',
    }
}
const subOption = 'cropper';
const OutputCropper = ({ data, sizePx, suffix, ref }) => {
    const target = data.values[data.idx];
    const outputCropperStyle = (data) => {
        const zoom = getZoom(data);
        let height = (ref && ref.current) ? ref.current.naturalHeight : 512;
        let width = (ref && ref.current) ? ref.current.naturalWidth : 512;
        return {
            display: 'relative',
            position: 'absolute',
            border: '2px inset yellow',
            height: `${Math.round(zoom * sizePx) - 4}px`,
            width: `${Math.round(zoom * sizePx * getW(data) / getH(data)) - 4}px`,
            backgroundColor: 'rgba(10,10,10, 0.2)',
            top: `${getY(data) * sizePx / height}px`,
            left: `${getX(data) * sizePx / width}px`,
        }
    }
    const getZoom = (v) => { if (v) return v['z' + suffix] ? Math.round(v['z' + suffix] * 100) / 100 : 1; return 1; }
    const getX = (v) => { if (v) return v['x' + suffix] ? Math.round(v['x' + suffix]) : 0; return 0; }
    const getY = (v) => { if (v) return v['y' + suffix] ? Math.round(v['y' + suffix]) : 0; return 0; }
    const getH = (v) => { if (v) return v['h' + suffix] ? Math.round(v['h' + suffix]) : 512; return 512; }
    const getW = (v) => { if (v) return v['w' + suffix] ? Math.round(v['w' + suffix]) : 512; return 512; }
    return (
        <Box sx={outputCropperStyle(data.values[data.idx])} >
            <Box sx={{
                ...styles.corner,
                top: 0,
                left: 0,
            }}
            />
            <Box sx={{
                ...styles.corner,
                top: 0,
                right: 0,
            }}
            />
            <Box sx={{
                ...styles.corner,
                bottom: 0,
                right: 0,
            }}
            />
            <Box sx={{
                ...styles.corner,
                bottom: 0,
                left: 0,
            }}
            />
        </Box>
    )
}

export default OutputCropper;