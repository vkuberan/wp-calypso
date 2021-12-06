import { Title } from '@automattic/onboarding';
import styled from '@emotion/styled';
import { useI18n } from '@wordpress/react-i18n';
import { ReactElement } from 'react';
import WarningCard from 'calypso/components/warning-card';

const WarningsOrHoldsSection = styled.div`
	margin-bottom: 40px;
`;

import './style.scss';

export default function Error( { message }: { message: string } ): ReactElement {
	const { __ } = useI18n();
	return (
		<>
			<div className="transfer__heading-wrapper woocommerce-install__heading-wrapper">
				<div className="transfer__heading woocommerce-install__heading">
					<Title>{ __( "We've hit a snag" ) }</Title>
				</div>
			</div>
			<div className="transfer__content woocommerce-install__content">
				<p>
					{ __(
						'It looks like something went wrong while setting up your store. If this is unexpected, please contact support so that we can help you out.'
					) }
				</p>
				<WarningsOrHoldsSection>
					<WarningCard
						message={
							message ||
							__(
								'There is an error that is stopping us from being able to install this product, please contact support.'
							)
						}
					/>
				</WarningsOrHoldsSection>
			</div>
		</>
	);
}
