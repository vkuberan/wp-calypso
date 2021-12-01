import { CheckoutProvider, Button } from '@automattic/composite-checkout';
import { useShoppingCart } from '@automattic/shopping-cart';
import styled from '@emotion/styled';
import { sprintf } from '@wordpress/i18n';
import { useI18n } from '@wordpress/react-i18n';
import { MiniCartLineItems } from './mini-cart-line-items';
import type { PaymentMethod } from '@automattic/composite-checkout';
import type { ResponseCart } from '@automattic/shopping-cart';

const MiniCartWrapper = styled.div`
	box-sizing: border-box;
	padding: 16px;
	max-width: 480px;
	text-align: left;
	font-size: 1rem;
`;

const MiniCartHeader = styled.div`
	text-align: left;
`;

const MiniCartTitle = styled.h2`
	font-weight: 600;
`;

const MiniCartSiteTitle = styled.span`
	color: var( --color-neutral-50 );
	font-size: 0.875rem;
`;

const MiniCartFooter = styled.div`
	margin-top: 12px;
`;

const MiniCartTotalWrapper = styled.div`
	font-weight: 600;
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin-bottom: 4px;
`;

function MiniCartTotal( { responseCart }: { responseCart: ResponseCart } ) {
	const { __ } = useI18n();
	return (
		<MiniCartTotalWrapper className="mini-cart__total">
			<span>{ __( 'Total' ) }</span>
			<span>{ responseCart.total_cost_display }</span>
		</MiniCartTotalWrapper>
	);
}

// The CheckoutProvider normally is used to provide a payment flow, but in this
// case we just want its UI features so we set its payment methods to an empty
// array. This could be improved in the future by using just the required
// features of the provider.
const emptyPaymentMethods: PaymentMethod[] = [];
const emptyPaymentProcessors = {};

export function MiniCart( {
	selectedSiteSlug,
	goToCheckout,
}: {
	selectedSiteSlug: string;
	goToCheckout: ( siteSlug: string ) => void;
} ): JSX.Element {
	const {
		responseCart,
		removeCoupon,
		removeProductFromCart,
		isLoading,
		isPendingUpdate,
	} = useShoppingCart( selectedSiteSlug );
	const { __ } = useI18n();
	const isDisabled = isLoading || isPendingUpdate;

	return (
		<CheckoutProvider
			paymentMethods={ emptyPaymentMethods }
			paymentProcessors={ emptyPaymentProcessors }
		>
			<MiniCartWrapper className="mini-cart">
				<MiniCartHeader className="mini-cart__header">
					<MiniCartTitle className="mini-cart__title">{ __( 'Cart' ) }</MiniCartTitle>
					<MiniCartSiteTitle className="mini-cart__site-title">
						{ sprintf(
							/* translators: %s is the site slug */
							__( 'Site: %s' ),
							selectedSiteSlug
						) }
					</MiniCartSiteTitle>
				</MiniCartHeader>
				<MiniCartLineItems
					removeCoupon={ removeCoupon }
					removeProductFromCart={ removeProductFromCart }
					responseCart={ responseCart }
				/>
				<MiniCartTotal responseCart={ responseCart } />
				<MiniCartFooter className="mini-cart__footer">
					<Button
						className="mini-cart__checkout"
						buttonType="primary"
						fullWidth
						disabled={ isDisabled }
						isBusy={ isDisabled }
						onClick={ () => goToCheckout( selectedSiteSlug ) }
					>
						{ __( 'Checkout' ) }
					</Button>
				</MiniCartFooter>
			</MiniCartWrapper>
		</CheckoutProvider>
	);
}
