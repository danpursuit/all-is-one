import { Card } from '@mui/material';
import React from 'react'
import { useDispatch, useSelector } from 'react-redux';

const styles = {
    img: {
        width: '100%',
        objectFit: 'contain',
        maxHeight: '400px'
    },
    batch: {
        border: '10px solid #00f'
    }
}
const Gallery = ({ op }) => {
    const data = useSelector(state => state.galleries.galleries[op]);
    const blankImg = useSelector(state => state.main.blanks.image);

    // several display types:
    // no image (idx -1)
    const renderNoImage = () => {
        return <img src={blankImg} style={styles.img} />
    }
    // image (idx > 0)
    const renderImage = () => {
        return <img src={data.imgData[data.idx].img} style={styles.img} />
    }
    // image batch (idx > 0, showBatch = true)
    const renderBatch = () => {
        return <img src={data.imgData[data.idx].img} style={{ ...styles.img, ...styles.batch }} />
    }
    return (

        <Card>
            {data.currentImage <= -1 ? renderNoImage() :
                (data.showBatch ? renderBatch() : renderImage())
            }
        </Card>
    )
}

export default Gallery