import { useI18n } from '@wordpress/react-i18n';
import { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import StepWrapper from 'calypso/signup/step-wrapper';
import isAtomicSite from 'calypso/state/selectors/is-site-automated-transfer';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import StartInstall from './start-install';
import StartTransfer from './start-transfer';
import type { WooCommerceInstallProps } from '../';

import './style.scss';

export default function Transfer( props: WooCommerceInstallProps ): ReactElement | null {
	const { goToStep, isReskinned } = props;
	const { __ } = useI18n();

	// selectedSiteId is set by the controller whenever site is provided as a query param.
	const siteId = useSelector( getSelectedSiteId ) as number;

	const isAtomic = useSelector( ( state ) => isAtomicSite( state, siteId ) );

	return (
		<StepWrapper
			flowName="woocommerce-install"
			hideSkip={ true }
			nextLabelText={ __( 'Confirm' ) }
			allowBackFirstStep={ true }
			backUrl="/woocommerce-installation"
			hideFormattedHeader={ true }
			className="transfer__step-wrapper"
			isWideLayout={ isReskinned }
			stepContent={
				<>
					{ isAtomic && <StartInstall goToStep={ goToStep } /> }
					{ ! isAtomic && <StartTransfer goToStep={ goToStep } /> }
				</>
			}
			{ ...props }
		/>
	);
}
