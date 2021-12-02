import { Card, Button } from '@automattic/components';
import { ToggleControl } from '@wordpress/components';
import { createElement, createInterpolateElement } from '@wordpress/element';
import { sprintf } from '@wordpress/i18n';
import { Icon, lock } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import { useState } from 'react';
import { connect } from 'react-redux';
import ActionCard from 'calypso/components/action-card';
import CardHeading from 'calypso/components/card-heading';
import QueryDomainInfo from 'calypso/components/data/query-domain-info';
import FormattedHeader from 'calypso/components/formatted-header';
import Layout from 'calypso/components/layout';
import Column from 'calypso/components/layout/column';
import Main from 'calypso/components/main';
import BodySectionCssClass from 'calypso/layout/body-section-css-class';
import { getSelectedDomain, isMappedDomain } from 'calypso/lib/domains';
import { TRANSFER_DOMAIN_REGISTRATION } from 'calypso/lib/url/support';
import wpcom from 'calypso/lib/wp';
import Breadcrumbs from 'calypso/my-sites/domains/domain-management/components/breadcrumbs';
import {
	domainManagementEdit,
	domainManagementList,
	domainManagementTransferToAnotherUser,
	domainManagementTransferToOtherSite,
} from 'calypso/my-sites/domains/paths';
import {
	getDomainLockUnlockError,
	getDomainTransferCodeError,
	getNoticeOptions,
} from 'calypso/state/data-layer/wpcom/domains/transfer/notices';
import { updateDomainLock } from 'calypso/state/domains/transfer/actions';
import { getDomainWapiInfoByDomainName } from 'calypso/state/domains/transfer/selectors';
import { successNotice, errorNotice } from 'calypso/state/notices/actions';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import getPrimaryDomainBySiteId from 'calypso/state/selectors/get-primary-domain-by-site-id';
import isDomainOnlySite from 'calypso/state/selectors/is-domain-only-site';
import isPrimaryDomainBySiteId from 'calypso/state/selectors/is-primary-domain-by-site-id';
import isSiteAutomatedTransfer from 'calypso/state/selectors/is-site-automated-transfer';
import { hasLoadedSiteDomains } from 'calypso/state/sites/domains/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import type { TransferPageProps } from './types';

import './style.scss';

const TransferPage = ( props: TransferPageProps ): JSX.Element => {
	const {
		currentRoute,
		errorNotice,
		isAtomic,
		isDomainInfoLoading,
		isDomainLocked,
		isDomainOnly,
		isMapping,
		isPrimaryDomain,
		selectedDomainName,
		selectedSite,
		successNotice,
		updateDomainLock,
	} = props;
	const { __ } = useI18n();
	const [ isRequestingTransferCode, setIsRequestingTransferCode ] = useState( false );
	const [ isLockingOrUnlockingDomain, setIsLockingOrUnlockingDomain ] = useState( false );

	const renderBreadcrumbs = () => {
		const items = [
			{
				// translators: Internet domains, e.g. mygroovydomain.com
				label: __( 'Domains' ),
				href: domainManagementList( selectedSite.slug, selectedDomainName ),
			},
			{
				label: selectedDomainName,
				href: domainManagementEdit( selectedSite.slug, selectedDomainName, currentRoute ),
			},
			{
				// translators: Verb - Transfer a domain somewhere else
				label: __( 'Transfer' ),
			},
		];

		const mobileItem = {
			label: sprintf(
				/* translators: Link to return to the settings management page of a specific domain (%s = domain, e.g. example.com) */
				__( 'Back to %s' ),
				selectedDomainName
			),
			href: domainManagementEdit( selectedSite.slug, selectedDomainName, currentRoute ),
			showBackArrow: true,
		};

		return <Breadcrumbs items={ items } mobileItem={ mobileItem } />;
	};

	const renderTransferOptions = () => {
		const options = [];

		if ( ! isDomainOnly ) {
			const mainText = isMapping
				? __( 'Transfer this domain connection to any administrator on this site' )
				: __( 'Transfer this domain to any administrator on this site' );

			options.push(
				<ActionCard
					key="transfer-to-another-user"
					buttonHref={ domainManagementTransferToAnotherUser(
						selectedSite.slug,
						selectedDomainName,
						currentRoute
					) }
					// translators: Continue is a verb
					buttonText={ __( 'Continue' ) }
					// translators: Transfer a domain to another user
					headerText={ __( 'To another user' ) }
					mainText={ mainText }
				/>
			);
		}

		if ( ! ( isPrimaryDomain && isAtomic ) ) {
			if ( options.length > 0 ) {
				options.push( <div key="separator" className="transfer-page__item-separator"></div> );
			}
			const mainText = isMapping
				? __( 'Transfer this domain connection to any site you are an administrator on' )
				: __( 'Transfer this domain to any site you are an administrator on' );

			options.push(
				<ActionCard
					key="transfer-to-another-site"
					buttonHref={ domainManagementTransferToOtherSite(
						selectedSite.slug,
						selectedDomainName,
						currentRoute
					) }
					// translators: Continue is a verb
					buttonText={ __( 'Continue' ) }
					// translators: Transfer a domain to another WordPress.com site
					headerText={ __( 'To another WordPress.com site' ) }
					mainText={ mainText }
				/>
			);
		}

		return options.length > 0 ? <Card>{ options }</Card> : null;
	};

	const toggleDomainLock = () => {
		setIsLockingOrUnlockingDomain( true );
		const lock = ! isDomainLocked;

		wpcom.req
			.post( `/domains/${ selectedDomainName }/transfer/`, {
				domainStatus: JSON.stringify( {
					command: lock ? 'lock' : 'unlock',
				} ),
			} )
			.then( () => {
				updateDomainLock( selectedDomainName, lock );
				successNotice(
					lock ? __( 'Domain locked successfully!' ) : __( 'Domain unlocked successfully!' ),
					getNoticeOptions( selectedDomainName )
				);
				setIsLockingOrUnlockingDomain( false );
			} )
			.catch( () => {
				errorNotice( getDomainLockUnlockError( lock ), getNoticeOptions( selectedDomainName ) );
				setIsLockingOrUnlockingDomain( false );
			} );
	};

	const requestTransferCode = () => {
		setIsRequestingTransferCode( true );

		wpcom.req
			.post( `/domains/${ selectedDomainName }/transfer/`, {
				domainStatus: JSON.stringify( {
					command: 'only-send-code',
				} ),
			} )
			.then( () => {
				successNotice(
					__(
						"We have sent the transfer authorization code to the domain registrant's email address. " +
							"If you don't receive the email shortly, please check your spam folder."
					),
					getNoticeOptions( selectedDomainName )
				);
				setIsRequestingTransferCode( false );
			} )
			.catch( ( error ) => {
				errorNotice(
					getDomainTransferCodeError( error.error ),
					getNoticeOptions( selectedDomainName )
				);
				setIsRequestingTransferCode( false );
			} );
	};

	const renderTransferLock = () => {
		if ( isDomainInfoLoading ) {
			return <span className="transfer-page__transfer-lock-placeholder"></span>;
		}

		// translators: domain transfer lock
		const disabledLockLabel = __( 'Transfer lock off' );
		// translators: domain transfer lock
		const enabledLockLabel = __( 'Transfer lock on' );

		const label = (
			<span className="transfer-page__transfer-lock-label">
				{ isDomainLocked ? (
					<>
						<Icon icon={ lock } size={ 15 } viewBox="4 0 18 20" />
						{ enabledLockLabel }
					</>
				) : (
					disabledLockLabel
				) }
			</span>
		);

		// TODO: Maybe if this is true, we can disable the domain lock toggle?
		// const { domainLockingAvailable } = getSelectedDomain( props );
		// TODO: Should we show a modal if there's a pending transfer and the user tries to lock the domain?

		return (
			<ToggleControl
				className="transfer-page__transfer-lock"
				checked={ isDomainLocked }
				disabled={ isLockingOrUnlockingDomain }
				onChange={ toggleDomainLock }
				label={ label }
			/>
		);
	};

	const renderAdvancedTransferOptions = () => {
		if ( isMapping ) {
			return null;
		}

		return (
			<Card className="transfer-page__advanced-transfer-options">
				<CardHeading size={ 16 }>Advanced Options</CardHeading>
				{ renderTransferLock() }
				<p>
					{ __(
						'We recommend leaving the transfer lock on, unless you want to transfer your domain to another provider.'
					) }
				</p>
				<Button primary={ false } busy={ isRequestingTransferCode } onClick={ requestTransferCode }>
					{ __( 'Get authorization code' ) }
				</Button>
			</Card>
		);
	};

	return (
		<Main className="transfer-page" wideLayout>
			<QueryDomainInfo domainName={ selectedDomainName } />
			<BodySectionCssClass bodyClass={ [ 'edit__body-white' ] } />
			{ renderBreadcrumbs() }
			<FormattedHeader brandFont headerText={ __( 'Transfer' ) } align="left" />
			<Layout>
				<Column type="main">
					{ renderTransferOptions() }
					{ renderAdvancedTransferOptions() }
				</Column>
				<Column type="sidebar">
					<Card className="transfer-page__help-section-card">
						<p className="transfer-page__help-section-title">{ __( 'How do transfers work?' ) }</p>
						<span className="transfer-page__help-section-text">
							{ __( 'Transferring a domain within WordPress.com is immediate.' ) }
							<br />
							{ createInterpolateElement(
								__(
									'However, transferring a domain to another provider can take five to seven days during which no changes to the domain can be made. Read <a>this important information</a> before starting a transfer.'
								),
								{
									a: createElement( 'a', { href: TRANSFER_DOMAIN_REGISTRATION } ),
								}
							) }
						</span>
					</Card>
				</Column>
			</Layout>
		</Main>
	);
};

const transferPageComponent = connect(
	( state, ownProps: TransferPageProps ) => {
		const domain = getSelectedDomain( ownProps );
		const siteId = getSelectedSiteId( state )!;
		const domainInfo = getDomainWapiInfoByDomainName( state, ownProps.selectedDomainName );
		return {
			currentRoute: getCurrentRoute( state ),
			hasSiteDomainsLoaded: hasLoadedSiteDomains( state, siteId ),
			isAtomic: isSiteAutomatedTransfer( state, siteId ),
			isDomainInfoLoading: ! domainInfo.hasLoadedFromServer,
			isDomainLocked: domainInfo.data?.locked,
			isDomainOnly: isDomainOnlySite( state, siteId ),
			isDomainPendingTransfer: !! domainInfo.data?.pendingTransfer,
			isMapping: Boolean( domain ) && isMappedDomain( domain ),
			isPrimaryDomain: isPrimaryDomainBySiteId( state, siteId, ownProps.selectedDomainName ),
			primaryDomain: getPrimaryDomainBySiteId( state, siteId ),
		};
	},
	{
		errorNotice,
		successNotice,
		updateDomainLock,
	}
)( TransferPage );

export default transferPageComponent;
