import React from 'react';
import { nestedMenuItemsFromObject } from './nestedMenuItemsFromObject.tsx';
import Button, { ButtonProps } from '@mui/material/Button';
import Menu, { MenuProps } from '@mui/material/Menu';
import SendIcon from '@mui/icons-material/Send';
import { ChevronDown } from '../icons/ChevronDown.tsx';
import { MenuItemData } from '../definitions';
import { IconButton } from '@mui/material';

interface NestedDropdownProps {
	children?: React.ReactNode;
	menuItemsData?: MenuItemData;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	closeCallback: () => void;
	ButtonProps?: Partial<ButtonProps>;
	MenuProps?: Partial<MenuProps>;
	useIcon?: boolean;
}

export const NestedDropdown = React.forwardRef<
	HTMLDivElement | null,
	NestedDropdownProps
>(function NestedDropdown(props, ref) {
	const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
		null
	);
	const open = Boolean(anchorEl);

	const {
		menuItemsData: data,
		onClick,
		ButtonProps,
		MenuProps,
		closeCallback,
		useIcon,
		...rest
	} = props;

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(e.currentTarget);
		onClick && onClick(e);
	};
	const handleClose = () => {
		setAnchorEl(null);
		closeCallback();
	};

	const menuItems = nestedMenuItemsFromObject({
		menuItemsData: data?.items ?? [],
		isOpen: open,
		handleClose,
	});

	return (
		<div ref={ref} {...rest}>
			{useIcon ? <IconButton onClick={handleClick} {...ButtonProps}><SendIcon/></IconButton> :
			<Button onClick={handleClick} endIcon={<ChevronDown />} {...ButtonProps}>
				{data?.label ?? 'Menu'}
			</Button>}
			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				{...MenuProps}
			>
				{menuItems}
			</Menu>
		</div>
	);
});
