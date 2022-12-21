import React from 'react';
import promptSuggestions from '../constants/promptSuggestions';
import { NestedDropdown } from './NestedMenu/components/NestedDropdown.tsx';
import { ClickAwayListener, Divider } from '@mui/material';
import { SET_BATCH_OPTION } from '../constants/actionTypes';
import { useDispatch, useSelector } from 'react-redux';
import { setTip } from '../actions';
import { PROMPT_HELP } from '../constants/features';

// the imported NestedDropdown is a modified version
//     - added a closeCallback prop
//     - removed the automatic handleClose() call on child click
// original: https://mui-nested-menu.vercel.app/nested-dropdown

const PromptHelp = ({ optNames, isKf = false }) => {
    const prompt = useSelector(state => state.main.options[isKf ? optNames.prompt_kf : optNames.prompt]);
    const negative_prompt = useSelector(state => state.main.options[isKf ? optNames.negative_prompt_kf : optNames.negative_prompt]);
    const dispatch = useDispatch();
    const [menuItemsData, setMenuItemsData] = React.useState(null);
    const [computeItems, setComputeItems] = React.useState(false);


    const addToPrompt = (token, negative = false) => {
        const data = negative ? negative_prompt : prompt;
        if (isKf) {
            dispatch({
                type: SET_BATCH_OPTION, payload: {
                    ...data, values: data.values.map((v, i) =>
                        i === data.idx ? (v.value === '' ? { ...v, value: token } : { ...v, value: v.value + ', ' + token }) : v
                    )
                }
            })
        } else {
            if (data.values[data.idx] === '') {
                dispatch({
                    type: SET_BATCH_OPTION,
                    payload: { ...data, values: data.values.map((v, i) => i === data.idx ? token : v) }
                })
            } else {
                dispatch({
                    type: SET_BATCH_OPTION,
                    payload: { ...data, values: data.values.map((v, i) => i === data.idx ? v + ', ' + token : v) }
                })
            }
        }
    }
    React.useEffect(() => {
        if (!computeItems) {
            setMenuItemsData({ label: promptSuggestions.label, items: [] });
            return
        }
        const convertItems = ({ label, items, callback }, negative = false) => {
            if (items) {
                const isNegative = label.toLowerCase().includes('negative');
                return {
                    label,
                    items: items.map((item) => convertItems(item, isNegative)),
                }
            }
            if (callback === null) {
                return {
                    label,
                    callback: () => addToPrompt(label, negative)
                }
            }
        }
        setMenuItemsData(convertItems(promptSuggestions));
    }, [computeItems, prompt, negative_prompt])
    return (
        <NestedDropdown
            menuItemsData={menuItemsData}
            MenuProps={{ elevation: 3 }}
            ButtonProps={{ variant: 'outlined', onMouseEnter: () => dispatch(setTip(PROMPT_HELP)) }}
            onClick={() => setComputeItems(true)}
            closeCallback={() => setComputeItems(false)}
        />)
}
export default PromptHelp;
