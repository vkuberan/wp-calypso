import { Button } from '@automattic/components';
import { Icon, plus } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import { domainManagementDnsAddRecord } from 'calypso/my-sites/domains/paths';
import { DndAddNewRecordButtonProps } from './types';

function DnsAddNewRecordButton( {
	site,
	domain,
	isMobile,
}: DndAddNewRecordButtonProps ): JSX.Element {
	const { __ } = useI18n();
	return (
		<Button
			borderless={ isMobile }
			href={ domainManagementDnsAddRecord( site, domain ) }
			className={ 'dns__breadcrumb-button add-record' }
		>
			<Icon icon={ plus } viewBox="4 4 16 16" size={ 16 } />
			{ ! isMobile && __( 'Add a record' ) }
		</Button>
	);
}

export default DnsAddNewRecordButton;
