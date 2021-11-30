import { Button } from '@automattic/components';
import classnames from 'classnames';
import { translate } from 'i18n-calypso';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ExternalLinkWithTracking from 'calypso/components/external-link/with-tracking';
import ThreatItemHeader from 'calypso/components/jetpack/threat-item-header-new';
import { Threat } from 'calypso/components/jetpack/threat-item-new-new/types';
import { getThreatFix } from 'calypso/components/jetpack/threat-item-new/utils';
import { recordTracksEvent } from 'calypso/state/analytics/actions/record';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import LogItem from '../log-item';
import ThreatDescription from '../threat-description-new';

import './style.scss';
interface Props {
	threat: Threat;
	isPlaceholder: boolean;
	onFixThreat?: ( threat: Threat ) => void;
	onIgnoreThreat?: () => void;
	isFixing: boolean;
	contactSupportUrl?: string;
}

export const ThreatItemPlaceholder: React.FC = () => (
	<LogItem
		className={ classnames( 'threat-item-new', 'is-placeholder' ) }
		header="Placeholder threat"
		subheader="Placeholder sub header"
	/>
);

const ThreatItem: React.FC< Props > = ( {
	threat,
	isPlaceholder,
	onFixThreat,
	onIgnoreThreat,
	isFixing,
	contactSupportUrl,
} ) => {
	const dispatch = useDispatch();

	/**
	 * Render a CTA button. Currently, this button is rendered three
	 * times: in the details section, and in the `summary` and `extendSummary`
	 * sections of the header.
	 *
	 * @param {string} className A class for the button
	 */
	const renderFixThreatButton = React.useCallback(
		( className: string ) => {
			// Without this, clicking the [Fix threat] button will open the
			// entire ThreatItem element as well
			const onClickHandler = ( e: React.MouseEvent< HTMLElement > ) => {
				e.stopPropagation();
				onFixThreat && onFixThreat( threat );
			};
			return (
				<Button
					primary
					className={ classnames( 'threat-item-new__fix-button', className ) }
					onClick={ onClickHandler }
					disabled={ isFixing }
				>
					{ translate( 'Fix threat' ) }
				</Button>
			);
		},
		[ isFixing, onFixThreat, threat ]
	);

	const getFix = React.useCallback( (): i18nCalypso.TranslateResult | undefined => {
		if ( threat.status === 'fixed' ) {
			return;
		}

		if ( ! threat.fixable ) {
			return (
				<>
					{ ! threat.rows && (
						<p className="threat-item-new threat-description__section-text">
							{ translate(
								'Jetpack Scan cannot automatically fix this threat. We suggest that you resolve the threat manually: ' +
									'ensure that WordPress, your theme, and all of your plugins are up to date, and remove ' +
									'the offending code, theme, or plugin from your site.'
							) }
						</p>
					) }
					{ threat.rows && (
						<p className="threat-item-new threat-description__section-text">
							{ translate(
								'Jetpack Scan cannot automatically fix this threat. We suggest that you resolve the threat manually: ' +
									'ensure that WordPress, your theme, and all of your plugins are up to date, and remove or edit ' +
									'the offending post from your site.'
							) }
						</p>
					) }
					{ 'current' === threat.status && (
						<p className="threat-item-new threat-description__section-text">
							{ translate(
								'If you need more help to resolve this threat, we recommend {{strong}}Codeable{{/strong}}, a trusted freelancer marketplace of highly vetted WordPress experts. ' +
									'They have identified a select group of security experts to help with these projects. ' +
									'Pricing ranges from $70-120/hour, and you can get a free estimate with no obligation to hire.',
								{
									components: {
										strong: <strong />,
									},
								}
							) }
						</p>
					) }
				</>
			);
		}

		return (
			<p className="threat-item-new threat-description__section-text">
				{ getThreatFix( threat.fixable ) }
			</p>
		);
	}, [ contactSupportUrl, threat ] );

	const isFixable = React.useMemo(
		() => threat.fixable && ( threat.status === 'current' || threat.status === 'ignored' ),
		[ threat ]
	);

	// We want to track which section are this toggles coming from
	const currentRoute = useSelector( getCurrentRoute );
	const currentRouteProp = React.useMemo( () => {
		return currentRoute
			? { section: currentRoute.includes( '/scan/history' ) ? 'History' : 'Scanner' }
			: {};
	}, [ currentRoute ] );
	const onOpenTrackEvent = React.useCallback(
		() =>
			dispatch(
				recordTracksEvent( 'calypso_jetpack_scan_threat_itemtoggle', {
					threat_signature: threat.signature,
					...currentRouteProp,
				} )
			),
		[ dispatch, threat, currentRouteProp ]
	);

	if ( isPlaceholder ) {
		return <ThreatItemPlaceholder />;
	}

	return (
		<LogItem
			key={ threat.id }
			className={ classnames( 'threat-item-new', {
				'is-fixed': threat.status === 'fixed',
				'is-ignored': threat.status === 'ignored',
				'is-current': threat.status === 'current',
			} ) }
			header={ <ThreatItemHeader threat={ threat } isStyled={ true } /> }
			clickableHeader={ true }
			onClick={ onOpenTrackEvent }
		>
			<ThreatDescription
				status={ threat.status }
				fix={ getFix() }
				problem={ threat.description }
				context={ threat.context }
				diff={ threat.diff }
				rows={ threat.rows }
				table={ threat.table }
				filename={ threat.filename }
				isFixable={ isFixable }
			/>

			<div className="threat-item-new__buttons">
				{ threat.status === 'current' && (
					<Button
						scary
						className="threat-item-new__ignore-button"
						onClick={ onIgnoreThreat }
						disabled={ isFixing }
					>
						{ translate( 'Ignore threat' ) }
					</Button>
				) }
				{ ! threat.fixable && 'current' === threat.status && (
					<ExternalLinkWithTracking
						className="button is-primary threat-item-new__codeable-button"
						href="https://codeable.io/partners/jetpack-scan/"
						target="_blank"
						rel="noopener noreferrer"
						tracksEventName="calypso_jetpack_scan_threat_codeable_estimate"
					>
						{ translate( 'Get a free estimate' ) }
					</ExternalLinkWithTracking>
				) }
				{ isFixable && renderFixThreatButton( 'is-details' ) }
			</div>
		</LogItem>
	);
};

export default ThreatItem;
