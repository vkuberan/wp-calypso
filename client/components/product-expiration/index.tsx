import { localize, LocalizeProps } from 'i18n-calypso';
import { Moment } from 'moment';
import { PureComponent } from 'react';

interface Props extends LocalizeProps {
	dateFormat?: string;
	expiryDateMoment: Moment;
	renewDateMoment: Moment;
	isRefundable?: boolean;
	purchaseDateMoment?: Moment;
}

export class ProductExpiration extends PureComponent< Props > {
	static defaultProps = {
		dateFormat: 'LL',
		isRefundable: false,
	};

	render() {
		const {
			dateFormat,
			expiryDateMoment,
			renewDateMoment,
			isRefundable,
			purchaseDateMoment,
			translate,
		} = this.props;

		// Return null if we don't have any dates.
		if ( ! expiryDateMoment && ! renewDateMoment && ! purchaseDateMoment ) {
			return null;
		}

		// Return the subscription date if we don't have the expiry date or the plan is refundable.
		if ( ! expiryDateMoment || isRefundable ) {
			if ( purchaseDateMoment && purchaseDateMoment.isValid() ) {
				return translate( 'Purchased on %s', { args: purchaseDateMoment.format( dateFormat ) } );
			}
			return null;
		}

		// Return null if expiration date isn't parsable.
		if ( ! expiryDateMoment.isValid() ) {
			return null;
		}

		// If the expiry date is in the past, show the expiration date.
		if ( expiryDateMoment.diff( new Date() ) < 0 ) {
			return translate( 'Expired on %s', { args: expiryDateMoment.format( dateFormat ) } );
		}

		if ( ! renewDateMoment || ! renewDateMoment.isValid() ) {
			return translate( 'Expires on %s', { args: expiryDateMoment.format( dateFormat ) } );
		}

		// Lastly, return the renewal date.
		return translate( 'Renews on %s', { args: renewDateMoment.format( dateFormat ) } );
	}
}

export default localize( ProductExpiration );
