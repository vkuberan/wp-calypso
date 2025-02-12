import { translate } from 'i18n-calypso';
import { omit } from 'lodash';
import wpcom from 'calypso/lib/wp';
import {
	GUIDED_TRANSFER_HOST_DETAILS_SAVE,
	GUIDED_TRANSFER_HOST_DETAILS_SAVE_FAILURE,
	GUIDED_TRANSFER_HOST_DETAILS_SAVE_SUCCESS,
	GUIDED_TRANSFER_STATUS_RECEIVE,
	GUIDED_TRANSFER_STATUS_REQUEST,
	GUIDED_TRANSFER_STATUS_REQUEST_FAILURE,
	GUIDED_TRANSFER_STATUS_REQUEST_SUCCESS,
} from 'calypso/state/action-types';
import { successNotice } from 'calypso/state/notices/actions';

/**
 * Receives the status of a guided transfer for a particular site
 *
 * @param {number} siteId The site id to which the status belongs
 * @param {object} guidedTransferStatus The current status of the guided transfer
 * @returns {object} An action object
 */
export function receiveGuidedTransferStatus( siteId, guidedTransferStatus ) {
	return {
		type: GUIDED_TRANSFER_STATUS_RECEIVE,
		siteId,
		guidedTransferStatus,
	};
}

/**
 * Requests the status of guided transfer for a particular site
 *
 * @param {number} siteId The site ID to which the status belongs
 * @returns {Function} Action thunk
 */
export function requestGuidedTransferStatus( siteId ) {
	return ( dispatch ) => {
		dispatch( { type: GUIDED_TRANSFER_STATUS_REQUEST, siteId } );

		const success = ( response ) => {
			const guidedTransferStatus = omit( response, '_headers' );

			dispatch( {
				type: GUIDED_TRANSFER_STATUS_REQUEST_SUCCESS,
				siteId,
			} );

			dispatch( receiveGuidedTransferStatus( siteId, guidedTransferStatus ) );
		};

		const failure = ( error ) =>
			dispatch( {
				type: GUIDED_TRANSFER_STATUS_REQUEST_FAILURE,
				siteId,
				error,
			} );

		return wpcom.req
			.get( `/sites/${ siteId }/transfer`, { apiNamespace: 'wpcom/v2' } )
			.then( success )
			.catch( failure );
	};
}

export function saveHostDetailsFailure( siteId, error = {} ) {
	return {
		type: GUIDED_TRANSFER_HOST_DETAILS_SAVE_FAILURE,
		siteId,
		error,
	};
}

/**
 * Saves a user's target host details in preparation for
 * a guided transfer to that host
 *
 * @param {number} siteId The id of the source site to transfer
 * @param {object} data The form data containing the target host details
 * @returns {Function} Action thunk
 */
export function saveHostDetails( siteId, data ) {
	return ( dispatch ) => {
		dispatch( {
			type: GUIDED_TRANSFER_HOST_DETAILS_SAVE,
			siteId,
		} );

		const failure = ( error ) => {
			dispatch( saveHostDetailsFailure( siteId, error ) );
		};

		const success = ( response ) => {
			// The success response is the updated status of the guided transfer
			dispatch( receiveGuidedTransferStatus( siteId, omit( response, '_headers' ) ) );

			if ( ! response.host_details_entered ) {
				return failure();
			}

			dispatch( {
				type: GUIDED_TRANSFER_HOST_DETAILS_SAVE_SUCCESS,
				siteId,
			} );

			dispatch( successNotice( translate( 'Thanks for confirming those details!' ) ) );
		};

		return wpcom.req
			.post( { path: `/sites/${ siteId }/transfer`, apiNamespace: 'wpcom/v2' }, data )
			.then( success )
			.catch( failure );
	};
}
