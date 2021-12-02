import { useShoppingCart } from '@automattic/shopping-cart';
import { useTranslate } from 'i18n-calypso';
import page from 'page';
import { FunctionComponent, useCallback, useState } from 'react';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import JetpackLogo from 'calypso/components/jetpack-logo';
import WordPressWordmark from 'calypso/components/wordpress-wordmark';
import CalypsoShoppingCartProvider from 'calypso/my-sites/checkout/calypso-shopping-cart-provider';
import useValidCheckoutBackUrl from 'calypso/my-sites/checkout/composite-checkout/hooks/use-valid-checkout-back-url';
import useCartKey from 'calypso/my-sites/checkout/use-cart-key';
import { clearSignupDestinationCookie } from 'calypso/signup/storageUtils';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import Item from './item';
import Masterbar from './masterbar';

interface Props {
	title: string;
	isJetpackNotAtomic?: boolean;
	previousPath?: string;
	siteSlug?: string;
}

const CheckoutMasterbar: FunctionComponent< Props > = ( {
	title,
	isJetpackNotAtomic,
	previousPath,
	siteSlug,
} ) => {
	const translate = useTranslate();
	const dispatch = useDispatch();
	const checkoutBackUrl = useValidCheckoutBackUrl( siteSlug );
	const isJetpackCheckout = window.location.pathname.startsWith( '/checkout/jetpack' );
	const isJetpack = isJetpackCheckout || isJetpackNotAtomic;

	const leaveCheckout = useCallback( () => {
		let closeUrl = siteSlug ? '/plans/' + siteSlug : '/start';

		dispatch( recordTracksEvent( 'calypso_masterbar_close_clicked' ) );

		if ( checkoutBackUrl ) {
			window.location.href = checkoutBackUrl;
			return;
		}

		if (
			previousPath &&
			'' !== previousPath &&
			previousPath !== window.location.href &&
			! previousPath.includes( '/checkout/' )
		) {
			closeUrl = previousPath;
		}

		try {
			const searchParams = new URLSearchParams( window.location.search );

			if ( searchParams.has( 'signup' ) ) {
				clearSignupDestinationCookie();
			}

			// Some places that open checkout (eg: purchase page renewals) return the
			// user there after checkout by putting the previous page's path in the
			// `redirect_to` query param. When leaving checkout via the close button,
			// we probably want to return to that location also.
			if ( searchParams.has( 'redirect_to' ) ) {
				const redirectPath = searchParams.get( 'redirect_to' ) ?? '';
				// Only allow redirecting to relative paths.
				if ( redirectPath.startsWith( '/' ) ) {
					page( redirectPath );
					return;
				}
			}
		} catch ( error ) {
			// Silently ignore query string errors (eg: which may occur in IE since it doesn't support URLSearchParams).
			// eslint-disable-next-line no-console
			console.error( 'Error getting query string in close button' );
		}

		window.location.href = closeUrl;
	}, [ siteSlug, checkoutBackUrl, previousPath, dispatch ] );

	const cartKey = useCartKey();
	const { responseCart, replaceProductsInCart } = useShoppingCart( cartKey );
	const [ isModalVisible, setIsModalVisible ] = useState( false );
	const clickClose = () => {
		if ( responseCart.products.length > 0 ) {
			setIsModalVisible( true );
			return;
		}
		leaveCheckout();
	};

	const modalTitleText = String(
		translate( 'You are about to leave Checkout with items in your cart' )
	);
	const modalBodyText = String(
		translate( 'You can leave the items in the cart or clear your cart.' )
	);
	const modalPrimaryText = String( translate( 'Leave items in cart' ) );
	const modalSecondaryText = String( translate( 'Clear cart' ) );
	const clearCartAndLeave = () => {
		replaceProductsInCart( [] );
		leaveCheckout();
		// No need to close the modal since we will be redirected
	};
	return (
		<Masterbar>
			<div className="masterbar__secure-checkout">
				<Item
					url={ '#' }
					icon="cross"
					className="masterbar__close-button"
					onClick={ clickClose }
					tooltip={ translate( 'Close Checkout' ) }
					tipTarget="close"
				/>
				{ ! isJetpack && <WordPressWordmark className="masterbar__wpcom-wordmark" /> }
				{ isJetpack && <JetpackLogo className="masterbar__jetpack-wordmark" full /> }
				<span className="masterbar__secure-checkout-text">{ translate( 'Secure checkout' ) }</span>
			</div>
			<Item className="masterbar__item-title">{ title }</Item>
			<ReactModal
				isOpen={ isModalVisible }
				onRequestClose={ () => {
					setIsModalVisible( false );
				} }
			>
				<h2>{ modalTitleText }</h2>
				<div>{ modalBodyText }</div>
				<button onClick={ clearCartAndLeave }>{ modalSecondaryText }</button>
				<button onClick={ leaveCheckout }>{ modalPrimaryText }</button>
			</ReactModal>
		</Masterbar>
	);
};

export default function CheckoutMasterbarWrapper( props: Props ): JSX.Element {
	return (
		<CalypsoShoppingCartProvider>
			<CheckoutMasterbar { ...props } />
		</CalypsoShoppingCartProvider>
	);
}
