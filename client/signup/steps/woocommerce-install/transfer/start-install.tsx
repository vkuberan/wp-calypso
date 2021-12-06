import { useI18n } from '@wordpress/react-i18n';
import { ReactElement, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAutomatedTransferStatus } from 'calypso/state/automated-transfer/actions';
import { transferStates } from 'calypso/state/automated-transfer/constants';
import {
	isFetchingAutomatedTransferStatus,
	getAutomatedTransferStatus,
} from 'calypso/state/automated-transfer/selectors';
import { getSiteWooCommerceUrl } from 'calypso/state/sites/selectors';
import { hasUploadFailed } from 'calypso/state/themes/upload-theme/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import useWooCommerceOnPlansEligibility from '../hooks/use-woop-handling';
import Error from './error';
import Progress from './progress';
import type { GoToStep } from '../../../types';

import './style.scss';

export default function Install( { goToStep }: { goToStep: GoToStep } ): ReactElement | null {
	const { __ } = useI18n();
	const dispatch = useDispatch();

	const [ progress, setProgress ] = useState( 0.1 );
	const [ error, setError ] = useState( {
		transferFailed: false,
		transferStatus: null,
	} );

	// selectedSiteId is set by the controller whenever site is provided as a query param.
	const siteId = useSelector( getSelectedSiteId ) as number;
	const fetchingTransferStatus = !! useSelector( ( state ) =>
		isFetchingAutomatedTransferStatus( state, siteId )
	);
	const transferStatus = useSelector( ( state ) => getAutomatedTransferStatus( state, siteId ) );
	const transferFailed = useSelector( ( state ) => hasUploadFailed( state, siteId ) );

	const wcAdmin = useSelector( ( state ) => getSiteWooCommerceUrl( state, siteId ) ) ?? '/';

	const { isAtomicSite } = useWooCommerceOnPlansEligibility( siteId );

	// Initiate Atomic transfer
	useEffect( () => {
		if ( ! siteId ) {
			return;
		}

		dispatch( fetchAutomatedTransferStatus( siteId ) );
		// dispatch( initiateSoftwareInstall( siteId, { 'software-set': 'woo-on-plans' } ) );
	}, [ dispatch, siteId, isAtomicSite ] );

	// Watch transfer status
	useEffect( () => {
		if ( ! siteId ) {
			goToStep( 'confirm' );
			return;
		}

		if ( fetchingTransferStatus ) {
			return;
		}

		// Note: most of these states are never seen and the ones you do see will
		// sometimes be missed from transfer to transfer due to polling request timing.
		switch ( transferStatus ) {
			case transferStates.NONE:
			case transferStates.PENDING:
			case transferStates.INQUIRING:
			case transferStates.PROVISIONED:
			case transferStates.FAILURE:
			case transferStates.START:
			case transferStates.REVERTED:
				setProgress( 0.2 );
				break;
			case transferStates.SETUP:
			case transferStates.CONFLICTS:
			case transferStates.ACTIVE:
				setProgress( 0.5 );
				break;
			case transferStates.UPLOADING:
			case transferStates.BACKFILLING:
				setProgress( 0.6 );
				break;
			case transferStates.COMPLETE:
				setProgress( 1 );
				break;
		}

		if (
			transferFailed ||
			transferStatus === transferStates.ERROR ||
			transferStatus === transferStates.FAILURE ||
			transferStatus === transferStates.REQUEST_FAILURE ||
			transferStatus === transferStates.CONFLICTS
		) {
			setProgress( 0 );
			setError( { transferFailed, transferStatus } );
		}
	}, [ siteId, goToStep, fetchingTransferStatus, transferStatus, transferFailed, wcAdmin, __ ] );

	useEffect( () => {
		if ( progress < 1 ) {
			return;
		}

		const timer = setTimeout( () => {
			window.location.href = wcAdmin;
		}, 3000 );

		return function () {
			if ( ! timer ) {
				return;
			}
			window.clearTimeout( timer );
		};
	}, [ progress, wcAdmin ] );

	return (
		<>
			{ error.transferFailed && <Error message={ error.transferStatus || '' } /> }
			{ ! error.transferFailed && <Progress progress={ progress } /> }
		</>
	);
}
