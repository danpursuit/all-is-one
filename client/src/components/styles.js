export default {
    overlayButton: {
        fill: 'white',
        backgroundColor: '#7777aa80',
        borderRadius: 1,
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: '#7777aad0',
        },
        '&:active': {
            backgroundColor: theme => theme.palette.primary.main,
        },
    },
    disabled: {
        backgroundColor: '#77777740',
        pointerEvents: 'none',
    },
}