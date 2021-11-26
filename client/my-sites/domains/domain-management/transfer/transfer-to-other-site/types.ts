import { DefaultRootState } from 'react-redux';
import { LocalizeProps } from 'calypso/../packages/i18n-calypso/types';
import { errorNotice, successNotice } from 'calypso/state/notices/actions';
import { requestSites } from 'calypso/state/sites/actions';
import type { SiteDomain } from 'calypso/state/sites/domains/types';
import type { SiteData } from 'calypso/state/ui/selectors/site-data';

type Maybe< T > = T | null;
// TODO: remove this once the checkout types are further described
type SiteDataExtraInfo = SiteData & {
	title: string;
	capabilities: Record< string, boolean >;
};

// props passed to the component
export type TransferDomainToOtherSitePassedProps = {
	domains: SiteDomain[];
	isRequestingSiteDomains: boolean;
	selectedDomainName: string;
	selectedSite: SiteDataExtraInfo;
};

// state props
export type TransferDomainToOtherSiteStateProps = {
	currentRoute: string;
	currentUserCanManage: boolean;
	hasSiteDomainsLoaded: boolean;
	isDomainOnly: Maybe< boolean >;
	isMapping: boolean;
	// eslint-disable-next-line @typescript-eslint/ban-types
	sites: Maybe< object >[];
};
// state props added by redux connect
export type TransferDomainToOtherSiteStateToProps = (
	state: DefaultRootState,
	ownProps: TransferDomainToOtherSitePassedProps
) => TransferDomainToOtherSiteStateProps;

// all component props (passed + redux state props)
export type TransferDomainToOtherSiteProps = TransferDomainToOtherSitePassedProps &
	TransferDomainToOtherSiteStateProps &
	TransferDomainToOtherSiteDispatchToProps &
	LocalizeProps;

export type TransferDomainToOtherSiteDispatchToProps = {
	requestSites: typeof requestSites;
	errorNotice: typeof errorNotice;
	successNotice: typeof successNotice;
};
